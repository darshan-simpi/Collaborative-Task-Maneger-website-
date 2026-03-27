import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const statusEnum = pgEnum("task_status", ["pending", "in_progress", "completed"]);
export const priorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: statusEnum("status").notNull().default("pending"),
  priority: priorityEnum("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  assignedToId: integer("assigned_to_id").references(() => usersTable.id),
  bounceCount: integer("bounce_count").notNull().default(0),
  bounceReason: text("bounce_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
