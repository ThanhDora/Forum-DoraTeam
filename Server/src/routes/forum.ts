import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/jwt";
import { adminMiddleware } from "../middleware/admin";
import { getIO } from "../lib/socket";

const router = Router();

// --- Categories & Channels ---

// Get all categories and their channels
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.forumCategory.findMany({
      include: {
        channels: {
          orderBy: { position: "asc" }
        }
      },
      orderBy: { position: "asc" }
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Create a category (Admin only)
router.post("/categories", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, position } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const category = await prisma.forumCategory.create({
      data: { name, position: position ?? 0 }
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Create a channel (Admin only)
router.post("/channels", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, description, type, categoryId, position } = req.body;
  if (!name || !categoryId) return res.status(400).json({ error: "Name and Category ID are required" });
  try {
    const channel = await prisma.forumChannel.create({
      data: {
        name,
        description,
        type: type ?? "text",
        categoryId,
        position: position ?? 0
      }
    });
    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ error: "Failed to create channel" });
  }
});

// --- Threads (for Forum channels) ---

// Get threads for a specific forum channel
router.get("/channels/:channelId/threads", async (req, res) => {
  const { channelId } = req.params;
  try {
    const threads = await prisma.forumThread.findMany({
      where: { channelId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { messages: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// Create a thread
router.post("/channels/:channelId/threads", authMiddleware, async (req, res) => {
  const { channelId } = req.params;
  const { title, content } = req.body;
  const userId = (req as any).user.sub;

  if (!title) return res.status(400).json({ error: "Title is required" });

  try {
    const thread = await prisma.forumThread.create({
      data: {
        title,
        content,
        authorId: userId as string,
        channelId: channelId as string
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ error: "Failed to create thread" });
  }
});

// --- Messages ---

// Get messages for a channel (if text type) or thread
router.get("/messages", async (req, res) => {
  const { channelId, threadId, limit = 50, cursor } = req.query;
  
  if (!channelId && !threadId) {
    return res.status(400).json({ error: "channelId or threadId is required" });
  }

  try {
    const messages = await prisma.forumMessage.findMany({
      where: {
        ...(channelId ? { channelId: channelId as string } : {}),
        ...(threadId ? { threadId: threadId as string } : {})
      },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: cursor as string } } : {}),
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Post a message
router.post("/messages", authMiddleware, async (req, res) => {
  const { content, channelId, threadId } = req.body;
  const userId = (req as any).user.sub;

  if (!content) return res.status(400).json({ error: "Content is required" });
  if (!channelId && !threadId) return res.status(400).json({ error: "Target (channel or thread) is required" });

  try {
    const message = await prisma.forumMessage.create({
      data: {
        content: content as string,
        authorId: userId as string,
        ...(channelId ? { channelId: channelId as string } : {}),
        ...(threadId ? { threadId: threadId as string } : {})
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } }
      }
    });

    // Real-time broadcast
    const io = getIO();
    const room = threadId ? `thread:${threadId}` : `channel:${channelId}`;
    io.to(room).emit("new_message", message);

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
