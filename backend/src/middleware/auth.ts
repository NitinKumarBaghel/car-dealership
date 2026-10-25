import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// Checks the token. Runs BEFORE protected routes.
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token missing" });
  }
  try {
    const payload: any = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET || "dev-secret");
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Checks the role. Runs AFTER requireAuth, only on admin routes.
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}