import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/jwt";
import { adminMiddleware, superadminMiddleware } from "../middleware/admin";
import { z } from "zod";
import { Permissions } from "../lib/permissions";

const router = Router();

// Apply admin protection
router.use(authMiddleware, adminMiddleware);

const createRoleSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#99aab5"),
  permissions: z.string().default("0"),
  hoist: z.boolean().default(false),
  mentionable: z.boolean().default(false),
  position: z.number().int().default(0),
});

// List all roles
router.get("/", async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { position: "desc" },
    });
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch roles" });
  }
});

// Create role
router.post("/", superadminMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const count = await prisma.role.count();
    const role = await prisma.role.create({
      data: {
        ...parsed.data,
        position: parsed.data.position || count,
      },
    });

    return res.status(201).json(role);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create role" });
  }
});

// Update role
router.patch("/:id", superadminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = createRoleSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    // Filter out undefined values because of exactOptionalPropertyTypes: true
    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
    );

    const role = await prisma.role.update({
      where: { id },
      data: updateData,
    });

    return res.json(role);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update role" });
  }
});

// Delete role
router.delete("/:id", superadminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    
    // Check if role is in use
    const userCount = await prisma.user.count({
      where: {
        roles: {
          some: { id }
        }
      }
    });

    if (userCount > 0) {
      return res.status(400).json({ error: "Cannot delete role while it is assigned to users" });
    }

    await prisma.role.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete role" });
  }
});

// Reorder roles
router.post("/reorder", superadminMiddleware, async (req: Request, res: Response) => {
  try {
    const { roles } = req.body as { roles: { id: string; position: number }[] };
    
    await prisma.$transaction(
      roles.map((r) =>
        prisma.role.update({
          where: { id: r.id },
          data: { position: r.position },
        })
      )
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reorder roles" });
  }
});

export default router;
