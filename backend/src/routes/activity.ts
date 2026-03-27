import { Router } from "express";
import { db, activityLogsTable, usersTable, tasksTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const taskId = req.query.taskId ? Number(req.query.taskId) : undefined;

  const whereClause = taskId ? eq(activityLogsTable.taskId, taskId) : undefined;

  const [totalResult, rows] = await Promise.all([
    db.select({ count: count() }).from(activityLogsTable).where(whereClause),
    db
      .select()
      .from(activityLogsTable)
      .where(whereClause)
      .orderBy(desc(activityLogsTable.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = Number(totalResult[0].count);

  const userIds = [...new Set(rows.map(l => l.userId))];
  const taskIds = [...new Set(rows.map(l => l.taskId))];

  const [users, tasks] = await Promise.all([
    userIds.length
      ? db.select().from(usersTable).where(
          userIds.length === 1
            ? eq(usersTable.id, userIds[0])
            : eq(usersTable.id, userIds[0])
        )
      : [],
    taskIds.length
      ? db.select({ id: tasksTable.id, title: tasksTable.title }).from(tasksTable).where(
          taskIds.length === 1
            ? eq(tasksTable.id, taskIds[0])
            : eq(tasksTable.id, taskIds[0])
        )
      : [],
  ]);

  const allUsers = userIds.length > 0
    ? await db.select().from(usersTable)
    : [];
  const allTasks = taskIds.length > 0
    ? await db.select({ id: tasksTable.id, title: tasksTable.title }).from(tasksTable)
    : [];

  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));
  const taskMap = Object.fromEntries(allTasks.map(t => [t.id, t]));

  res.json({
    logs: rows.map(log => ({
      id: log.id,
      taskId: log.taskId,
      userId: log.userId,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      user: userMap[log.userId]
        ? {
            id: userMap[log.userId].id,
            name: userMap[log.userId].name,
            email: userMap[log.userId].email,
            role: userMap[log.userId].role,
            createdAt: userMap[log.userId].createdAt.toISOString(),
          }
        : { id: log.userId, name: "Unknown", email: "", role: "user", createdAt: new Date().toISOString() },
      task: taskMap[log.taskId] || { id: log.taskId, title: "Deleted Task" },
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export default router;
