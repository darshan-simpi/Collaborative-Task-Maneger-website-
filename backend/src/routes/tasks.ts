import { Router } from "express";
import { db, tasksTable, usersTable, activityLogsTable } from "@workspace/db";
import { eq, and, or, desc, count, SQL } from "drizzle-orm";
import { requireAuth, requireManager } from "../middlewares/auth.js";
import { z } from "zod";
import { io } from "../index.js";

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignedToId: z.number().int().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedToId: z.number().int().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

function formatTask(task: any, creator: any, assignee: any) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    bounceCount: task.bounceCount ?? 0,
    bounceReason: task.bounceReason ?? null,
    createdBy: {
      id: creator.id,
      name: creator.name,
      email: creator.email,
      role: creator.role,
      createdAt: creator.createdAt.toISOString(),
    },
    assignedTo: assignee
      ? {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
          role: assignee.role,
          createdAt: assignee.createdAt.toISOString(),
        }
      : null,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const statusFilter = req.query.status as string | undefined;
  const assignedToMe = req.query.assignedToMe === "true";
  const createdByMe = req.query.createdByMe === "true";

  const conditions: SQL[] = [];

  if (req.user!.role === "user") {
    conditions.push(eq(tasksTable.assignedToId, req.user!.userId));
  } else {
    if (assignedToMe) conditions.push(eq(tasksTable.assignedToId, req.user!.userId));
    if (createdByMe) conditions.push(eq(tasksTable.createdById, req.user!.userId));
  }

  if (statusFilter && ["pending", "in_progress", "completed"].includes(statusFilter)) {
    conditions.push(eq(tasksTable.status, statusFilter as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, rows] = await Promise.all([
    db.select({ count: count() }).from(tasksTable).where(whereClause),
    db
      .select()
      .from(tasksTable)
      .where(whereClause)
      .orderBy(desc(tasksTable.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = Number(totalResult[0].count);

  const userIds = [...new Set([...rows.map(t => t.createdById), ...rows.map(t => t.assignedToId).filter(Boolean)])];
  const users = userIds.length
    ? await db.select().from(usersTable).where(
        or(...userIds.map(id => eq(usersTable.id, id as number)))
      )
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json({
    tasks: rows.map(t => formatTask(t, userMap[t.createdById], t.assignedToId ? userMap[t.assignedToId] : null)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
  if (!task) {
    res.status(404).json({ error: "Not Found", message: "Task not found" });
    return;
  }

  if (req.user!.role === "user" && task.assignedToId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden", message: "Access denied" });
    return;
  }

  const userIds = [task.createdById, task.assignedToId].filter(Boolean) as number[];
  const users = await db.select().from(usersTable).where(or(...userIds.map(uid => eq(usersTable.id, uid))));
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json(formatTask(task, userMap[task.createdById], task.assignedToId ? userMap[task.assignedToId] : null));
});

router.post("/", requireAuth, requireManager, async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: parsed.error.message });
    return;
  }

  const { title, description, priority, assignedToId, dueDate } = parsed.data;

  const [task] = await db
    .insert(tasksTable)
    .values({
      title,
      description: description ?? null,
      priority,
      assignedToId: assignedToId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: req.user!.userId,
    })
    .returning();

  await db.insert(activityLogsTable).values({
    taskId: task.id,
    userId: req.user!.userId,
    action: "created",
    details: `Task "${title}" was created`,
  });

  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, task.createdById)).limit(1);
  const assignee = task.assignedToId
    ? (await db.select().from(usersTable).where(eq(usersTable.id, task.assignedToId)).limit(1))[0]
    : null;

  const payload = formatTask(task, creator, assignee);
  io.emit("task_created", payload);
  res.status(201).json(payload);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Task not found" });
    return;
  }

  if (req.user!.role === "user") {
    if (existing.assignedToId !== req.user!.userId) {
      res.status(403).json({ error: "Forbidden", message: "You can only update tasks assigned to you" });
      return;
    }
    const allowed = ["status"];
    const keys = Object.keys(req.body);
    if (keys.some(k => !allowed.includes(k))) {
      res.status(403).json({ error: "Forbidden", message: "Users can only update task status" });
      return;
    }
  }

  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: parsed.error.message });
    return;
  }

  const updates: Record<string, any> = { ...parsed.data, updatedAt: new Date() };
  if (updates.dueDate !== undefined) {
    updates.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
  }

  const [task] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();

  const changedFields = Object.keys(parsed.data).join(", ");
  await db.insert(activityLogsTable).values({
    taskId: task.id,
    userId: req.user!.userId,
    action: "updated",
    details: `Updated fields: ${changedFields}`,
  });

  const userIds = [task.createdById, task.assignedToId].filter(Boolean) as number[];
  const users = await db.select().from(usersTable).where(or(...userIds.map(uid => eq(usersTable.id, uid))));
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const payload = formatTask(task, userMap[task.createdById], task.assignedToId ? userMap[task.assignedToId] : null);
  io.emit("task_updated", payload);
  res.json(payload);
});

const bounceTaskSchema = z.object({
  reason: z.string().min(1),
});

router.post("/:id/bounce", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Task not found" });
    return;
  }

  if (req.user!.role === "user" && existing.assignedToId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden", message: "You can only bounce tasks assigned to you" });
    return;
  }

  const parsed = bounceTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: parsed.error.message });
    return;
  }

  const { reason } = parsed.data;
  const newBounceCount = (existing.bounceCount ?? 0) + 1;

  const [task] = await db
    .update(tasksTable)
    .set({
      status: "pending",
      bounceReason: reason,
      bounceCount: newBounceCount,
      updatedAt: new Date(),
    })
    .where(eq(tasksTable.id, id))
    .returning();

  await db.insert(activityLogsTable).values({
    taskId: task.id,
    userId: req.user!.userId,
    action: "bounced",
    details: `Task bounced back: "${reason}"`,
  });

  const userIds = [task.createdById, task.assignedToId].filter(Boolean) as number[];
  const users = await db.select().from(usersTable).where(or(...userIds.map(uid => eq(usersTable.id, uid))));
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const payload = formatTask(task, userMap[task.createdById], task.assignedToId ? userMap[task.assignedToId] : null);
  io.emit("task_updated", payload);
  res.json(payload);
});

router.delete("/:id", requireAuth, requireManager, async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Task not found" });
    return;
  }

  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  
  io.emit("task_deleted", { id });

  res.status(204).send();
});

export default router;
