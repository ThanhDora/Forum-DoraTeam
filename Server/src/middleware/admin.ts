import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "./jwt";

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: JwtPayload }).user;
  
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return res.status(403).json({ error: "Forbidden: Admin access only" });
  }
  
  next();
}
