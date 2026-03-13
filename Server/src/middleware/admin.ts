import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "./jwt";
import { prisma } from "../lib/prisma";
import { getUserPermissions, Permissions, hasPermission } from "../lib/permissions";

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: JwtPayload }).user;
  
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check legacy roles first
  if (user.role === "admin" || user.role === "superadmin") {
    return next();
  }

  // Check new permission system
  try {
    const userPermissions = await getUserPermissions(user.sub, prisma);
    if (hasPermission(userPermissions, Permissions.ADMINISTRATOR) || 
        hasPermission(userPermissions, Permissions.MANAGE_SERVER)) {
      return next();
    }
  } catch (err) {
    console.error("Admin check error:", err);
  }
  
  return res.status(403).json({ error: "Forbidden: Admin access only" });
}

export async function superadminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: JwtPayload }).user;
  
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (user.role === "superadmin") {
    return next();
  }

  return res.status(403).json({ error: "Forbidden: Superadmin access only" });
}
