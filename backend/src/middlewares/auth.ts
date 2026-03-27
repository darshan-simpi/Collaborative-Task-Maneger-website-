import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "task-manager-secret-key-change-in-production";

export interface AuthPayload {
  userId: number;
  email: string;
  role: "manager" | "user";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }
}

export function requireManager(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "manager") {
    res.status(403).json({ error: "Forbidden", message: "Manager access required" });
    return;
  }
  next();
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
