import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { hasPermission, getUserPermissions } from "../lib/permissions";

/**
 * Middleware to check if the authenticated user has a specific permission.
 * Requires authMiddleware to be run beforehand to populate req.user.
 */
export function requirePermission(permission: bigint) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userPermissions = await getUserPermissions(userId, prisma);
      
      if (!hasPermission(userPermissions, permission)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      next();
    } catch (err) {
      console.error("Permission check error:", err);
      return res.status(500).json({ error: "Internal server error during permission check" });
    }
  };
}
