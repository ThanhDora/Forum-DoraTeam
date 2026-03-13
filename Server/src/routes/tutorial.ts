import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/jwt";
import { adminMiddleware } from "../middleware/admin";
import { z } from "zod";

const router = Router();

const createTutorialSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().default("C++"),
  active: z.boolean().default(true),
  isPublic: z.boolean().default(true),
});

const updateTutorialSchema = createTutorialSchema.partial();

// Public endpoint for C++ menu
router.get("/public", async (_req: Request, res: Response) => {
  try {
    const tutorials = await prisma.tutorial.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        isPublic: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });
    return res.json(tutorials);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch tutorials", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

// Public endpoint for specific tutorial
router.get("/public/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tutorial = await prisma.tutorial.findUnique({
      where: { id, active: true },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        isPublic: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });
    if (!tutorial) return res.status(404).json({ error: "Tutorial not found" });
    return res.json(tutorial);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch tutorial", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

// Admin routes
router.use(authMiddleware, adminMiddleware);

// List all tutorials (Admin)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const tutorials = await prisma.tutorial.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });
    return res.json(tutorials);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch tutorials", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

// Create tutorial
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createTutorialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { title, content, category, active, isPublic } = parsed.data;
    const authorId = (req as any).user.sub;

    const tutorial = await prisma.tutorial.create({
      data: {
        title,
        content,
        category,
        active,
        isPublic,
        authorId,
      },
    });

    return res.status(201).json(tutorial);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create tutorial", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

// Update tutorial
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updateTutorialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    // Filter out undefined values because of exactOptionalPropertyTypes: true
    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
    );

    const tutorial = await prisma.tutorial.update({
      where: { id },
      data: updateData as any,
    });

    return res.json(tutorial);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update tutorial", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

// Delete tutorial
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.tutorial.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete tutorial", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
