import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware, JwtPayload } from "../middleware/jwt";
import { getIO } from "../lib/socket";

const router = Router();

router.get("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as Request & { user: JwtPayload }).user;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        bio: true, 
        avatarUrl: true, 
        role: true,
        roles: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

router.get("/list", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        lastActiveAt: true,
        roles: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });
    return res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ error: "Failed to load user list" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        displayName: true,
        bio: true, 
        avatarUrl: true, 
        role: true,
        lastActiveAt: true,
        roles: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Get user profile by ID error:", err);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});



const updateProfileSchema = z.object({
  displayName: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

router.put("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as Request & { user: JwtPayload }).user;
    const parsed = updateProfileSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { bio, avatarUrl, displayName } = parsed.data;
    const data: { bio?: string | null; avatarUrl?: string | null; displayName?: string | null } = {};
    if (bio !== undefined) data.bio = bio;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    if (displayName !== undefined) data.displayName = displayName;

    const user = await prisma.user.update({
      where: { id: payload.sub },
      data,
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        lastActiveAt: true,
        roles: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      }
    });

    getIO().emit("update_user", updatedUser);

    return res.json(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Update profile failed",
    });
  }
});



export default router;
