import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { tasksTable } from "./tasks";

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogsTable).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogsTable.$inferSelect;
