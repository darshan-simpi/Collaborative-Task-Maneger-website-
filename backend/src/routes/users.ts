import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { requireAuth, requireManager } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, requireManager, async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable);

  res.json(users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  })));
});

export default router;
