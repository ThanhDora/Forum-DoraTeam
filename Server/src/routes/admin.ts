import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/jwt";
import { adminMiddleware } from "../middleware/admin";
import { z } from "zod";
import bcrypt from "bcryptjs";

const router = Router();

const SALT_ROUNDS = 10;

// Apply admin protection to all routes in this router
router.use(authMiddleware, adminMiddleware);

// List all users
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
      },
      orderBy: { id: "desc" },
    });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch users", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(["user", "admin"]).default("user"),
});

// Create new user
router.post("/users", async (req: Request, res: Response) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { email, password, name, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name ?? null,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
      },
    });

    return res.status(201).json(user);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create user", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

const updateUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

// Update user role
router.patch("/users/:id/role", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = updateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid role", details: parsed.error.flatten() });
    }
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role === "superadmin") {
      return res.status(403).json({ error: "Cannot modify Super Admin" });
    }

    const user = await prisma.user.update({
      where: { id: id as string },
      data: { role: parsed.data.role },
    });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update role", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

// Delete user
router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role === "superadmin") {
      return res.status(403).json({ error: "Cannot delete Super Admin" });
    }
    await prisma.user.delete({ where: { id: id as string } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete user", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
