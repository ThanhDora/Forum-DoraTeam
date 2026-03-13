import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware, JwtPayload } from "../middleware/jwt";

const router = Router();

router.get("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as Request & { user: JwtPayload }).user;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, bio: true, avatarUrl: true, role: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

const updateProfileSchema = z.object({
  name: z.string().optional().nullable(),
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

    const { name, bio, avatarUrl } = parsed.data;
    const data: { name?: string | null; bio?: string | null; avatarUrl?: string | null } = {};
    if (name !== undefined) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: payload.sub },
      data,
    });

    const u = user as any;
    return res.json({
      id: u.id,
      email: u.email,
      name: u.name,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      role: u.role,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Update profile failed",
    });
  }
});

export default router;
