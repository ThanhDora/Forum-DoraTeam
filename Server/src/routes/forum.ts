import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/jwt";
import { adminMiddleware } from "../middleware/admin";
import { requirePermission } from "../middleware/permission";
import { getUserPermissions, Permissions, hasPermission } from "../lib/permissions";
import { getIO } from "../lib/socket";
import jwt from "jsonwebtoken";

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
    }) as any;
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Create a category (MANAGE_CHANNELS)
router.post("/categories", authMiddleware, requirePermission(Permissions.MANAGE_CHANNELS), async (req, res) => {
  const { name, position } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const category = await prisma.forumCategory.create({
      data: { name, position: position ?? 0 }
    });

    getIO().emit("update_categories");

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update a category (MANAGE_CHANNELS)
router.patch("/categories/:id", authMiddleware, requirePermission(Permissions.MANAGE_CHANNELS), async (req, res) => {
  const id = req.params.id as string;
  const { name, position } = req.body;
  try {
    const category = await prisma.forumCategory.update({
      where: { id },
      data: { name, position }
    });

    getIO().emit("update_categories");

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete a category (MANAGE_CHANNELS)
router.delete("/categories/:id", authMiddleware, requirePermission(Permissions.MANAGE_CHANNELS), async (req, res) => {
  const id = req.params.id as string;
  try {
    await prisma.forumCategory.delete({ where: { id } });

    getIO().emit("update_categories");

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Create a channel (MANAGE_CHANNELS)
router.post("/channels", authMiddleware, requirePermission(Permissions.MANAGE_CHANNELS), async (req, res) => {
  const { name, description, type, categoryId, position } = req.body;
  if (!name || !categoryId) return res.status(400).json({ error: "Name and Category ID are required" });

  const userId = (req as any).user.sub;
  const userRole = (req as any).user.role;

  // Restrict chat (text) creation to superadmin
  if (type === "text" && userRole !== "superadmin") {
     return res.status(403).json({ error: "Only superadmins can create chat channels" });
  }

  try {
    const channel = await prisma.forumChannel.create({
      data: {
        name,
        description,
        type: (type as string) ?? "text",
        categoryId: categoryId as string,
        position: position ?? 0
      }
    });

    getIO().emit("update_categories");

    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ error: "Failed to create channel" });
  }
});

// Update a channel (MANAGE_CHANNELS)
router.patch("/channels/:id", authMiddleware, requirePermission(Permissions.MANAGE_CHANNELS), async (req, res) => {
  const { id } = req.params;
  const { name, description, position, categoryId } = req.body;
  try {
    const channelId = id as string;
    const channel = await prisma.forumChannel.update({
      where: { id: channelId },
      data: { name, description, position, categoryId: categoryId as string }
    });

    getIO().emit("update_categories");

    res.json(channel);
  } catch (err) {
    res.status(500).json({ error: "Failed to update channel" });
  }
});

// Delete a channel (MANAGE_CHANNELS)
router.delete("/channels/:id", authMiddleware, requirePermission(Permissions.MANAGE_CHANNELS), async (req, res) => {
  const { id } = req.params;
  try {
    const channelId = id as string;
    await prisma.forumChannel.delete({ where: { id: channelId } });

    getIO().emit("update_categories");

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete channel" });
  }
});

// --- Threads (for Forum channels) ---

// Get threads for a specific forum channel
router.get("/channels/:channelId/threads", async (req: Request, res: Response) => {
  const channelId = req.params.channelId as string;
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const secret = (process.env.ACCESS_TOKEN_SECRET ?? process.env.JWT_SECRET ?? "default-secret-change-in-production") as string;
      const decoded = jwt.verify(token, secret) as any;
      userId = decoded.sub;
    } catch (err) {
      // Ignore invalid token for public list
    }
  }

  try {
    const threads = await prisma.forumThread.findMany({
      where: { channelId: channelId as string },
      include: {
        author: { select: { id: true, name: true, displayName: true, avatarUrl: true, roles: { select: { name: true, color: true } } } },
        _count: { select: { messages: true, likes: true } },
        likes: userId ? { where: { userId } } : false
      },
      orderBy: { updatedAt: "desc" }
    });

    const formattedThreads = threads.map((t: any) => ({
      ...t,
      liked: userId ? t.likes?.length > 0 : false,
      likes: undefined // Remove the likes array from response
    }));

    res.json(formattedThreads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// Create a thread
router.post("/channels/:channelId/threads", authMiddleware, async (req, res) => {
  const { channelId } = req.params;
  const { title, content, tagIds } = req.body;
  const userId = (req as any).user.sub;

  if (!title) return res.status(400).json({ error: "Title is required" });

  try {
    const thread = await prisma.forumThread.create({
      data: {
        title,
        content,
        authorId: userId as string,
        channelId: channelId as string,
        tags: {
          connect: tagIds?.map((id: string) => ({ id })) || []
        }
      },
      include: {
        author: { select: { id: true, name: true, displayName: true, avatarUrl: true, roles: { select: { name: true, color: true } } } },
        tags: true
      }
    });

    getIO().to(`channel:${channelId}`).emit("new_thread", thread);

    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ error: "Failed to create thread" });
  }
});

// Update a thread
router.patch("/threads/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, content, tagIds } = req.body;
  const userId = (req as any).user.sub;

  try {
    const threadId = id as string;
    const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });

    // Check MANAGE_FORUM permission or authorship
    const perms = await getUserPermissions(userId, prisma);
    const isMod = hasPermission(perms, Permissions.MANAGE_FORUM) || hasPermission(perms, Permissions.ADMINISTRATOR);
    const isAuthor = thread.authorId === userId;

    if (!isMod && !isAuthor) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await prisma.forumThread.update({
      where: { id: id as string },
      data: {
        title,
        content,
        ...(tagIds ? {
          tags: {
            set: tagIds.map((id: string) => ({ id }))
          }
        } : {})
      },
      include: {
        author: { select: { id: true, name: true, displayName: true, avatarUrl: true, roles: { select: { name: true, color: true } } } },
        tags: true
      }
    }) as any;

    getIO().to(`channel:${updated.channelId}`).emit("update_thread", updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update thread" });
  }
});

// Like/Unlike a thread
router.post("/threads/:id/like", authMiddleware, async (req, res) => {
  const id = req.params.id as string;
  const userId = (req as any).user.sub;

  try {
    const existing = await prisma.forumLike.findUnique({
      where: { userId_threadId: { userId: userId as string, threadId: id as string } }
    });

    if (existing) {
      await prisma.forumLike.delete({ where: { id: existing.id } });
      
      // Get updated count
      const thread = await prisma.forumThread.findUnique({
        where: { id: id as string },
        include: { _count: { select: { likes: true } } }
      }) as any;

      getIO().to(`channel:${thread?.channelId}`).emit("thread_like_update", {
        threadId: id,
        likes: thread?._count.likes || 0
      });

      return res.json({ liked: false });
    } else {
      await prisma.forumLike.create({
        data: { userId: userId as string, threadId: id as string }
      });

      // Get updated count
      const thread = await prisma.forumThread.findUnique({
        where: { id: id as string },
        include: { _count: { select: { likes: true } } }
      }) as any;

      getIO().to(`channel:${thread?.channelId}`).emit("thread_like_update", {
        threadId: id,
        likes: thread?._count.likes || 0
      });

      return res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// --- Messages ---

// Get messages for a channel (if text type) or thread
router.get("/messages", async (req, res) => {
  const { channelId, threadId, search, limit = 50, cursor } = req.query;
  
  if (!channelId && !threadId) {
    return res.status(400).json({ error: "channelId or threadId is required" });
  }

  try {
    const messages = await prisma.forumMessage.findMany({
      where: {
        ...(channelId ? { channelId: channelId as string } : {}),
        ...(threadId ? { threadId: threadId as string } : {}),
        ...(search ? { content: { contains: search as string } } : {})
      },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: cursor as string } } : {}),
      include: {
        author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true, roles: { select: { name: true, color: true } } } },
        likes: { select: { userId: true } },
        _count: { select: { replies: true } }
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
  const { content, channelId, threadId, parentMessageId } = req.body;
  const userId = (req as any).user.sub;

  if (!content) return res.status(400).json({ error: "Content is required" });
  if (!channelId && !threadId) return res.status(400).json({ error: "Target (channel or thread) is required" });

  try {
    const message = await prisma.forumMessage.create({
      data: {
        content: content as string,
        authorId: userId as string,
        ...(channelId ? { channelId: channelId as string } : {}),
        ...(threadId ? { threadId: threadId as string } : {}),
        ...(parentMessageId ? { parentMessageId: parentMessageId as string } : {})
      },
      include: {
        author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true, roles: { select: { name: true, color: true } } } },
        parentMessage: { select: { id: true, content: true, author: { select: { name: true } } } }
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

// Update a message
router.patch("/messages/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = (req as any).user.sub;

  try {
    const messageId = id as string;
    const message = await prisma.forumMessage.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Check MANAGE_FORUM permission or authorship
    const perms = await getUserPermissions(userId, prisma);
    const isMod = hasPermission(perms, Permissions.MANAGE_FORUM) || hasPermission(perms, Permissions.ADMINISTRATOR);
    const isAuthor = message.authorId === userId;

    if (!isMod && !isAuthor) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await prisma.forumMessage.update({
      where: { id: messageId },
      data: { content },
      include: {
        author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true, roles: { select: { name: true, color: true } } } }
      }
    });

    const io = getIO();
    const room = updated.threadId ? `thread:${updated.threadId}` : `channel:${updated.channelId}`;
    io.to(room).emit("update_message", updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

// Like/Unlike a message
router.post("/messages/:id/like", authMiddleware, async (req, res) => {
  const id = req.params.id as string;
  const userId = (req as any).user.sub;

  try {
    const existing = await prisma.forumLike.findUnique({
      where: { userId_messageId: { userId: userId as string, messageId: id as string } }
    });

    if (existing) {
      await prisma.forumLike.delete({ where: { id: existing.id } });
      
      // Get updated count
      const message = await prisma.forumMessage.findUnique({
        where: { id: id as string },
        include: { _count: { select: { likes: true } } }
      }) as any;

      const room = message?.threadId ? `thread:${message.threadId}` : `channel:${message?.channelId}`;
      getIO().to(room).emit("message_like_update", {
        messageId: id,
        likes: message?._count.likes || 0
      });

      return res.json({ liked: false });
    } else {
      await prisma.forumLike.create({
        data: { userId: userId as string, messageId: id as string }
      });

      // Get updated count
      const message = await prisma.forumMessage.findUnique({
        where: { id: id as string },
        include: { _count: { select: { likes: true } } }
      }) as any;

      const room = message?.threadId ? `thread:${message.threadId}` : `channel:${message?.channelId}`;
      getIO().to(room).emit("message_like_update", {
        messageId: id,
        likes: message?._count.likes || 0
      });

      return res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// --- Tags ---

// Get all tags
router.get("/tags", async (req, res) => {
  try {
    const tags = await prisma.forumTag.findMany({
      orderBy: { name: "asc" }
    });
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// Create a tag (MANAGE_FORUM)
router.post("/tags", authMiddleware, requirePermission(Permissions.MANAGE_FORUM), async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const tag = await prisma.forumTag.create({
      data: { name, color: color ?? "#3b82f6" }
    });
    res.status(201).json(tag);
  } catch (err) {
    res.status(500).json({ error: "Failed to create tag" });
  }
});

// Delete a tag (MANAGE_FORUM)
router.delete("/tags/:id", authMiddleware, requirePermission(Permissions.MANAGE_FORUM), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.forumTag.delete({ where: { id: id as string } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete tag" });
  }
});

// --- Management (Delete/Mod) ---

// Delete a thread
router.delete("/threads/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).user.sub;

  try {
    const thread = await prisma.forumThread.findUnique({ where: { id: id as string } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });

    // Check MANAGE_FORUM permission or authorship
    const perms = await getUserPermissions(userId, prisma);
    const isMod = hasPermission(perms, Permissions.MANAGE_FORUM) || hasPermission(perms, Permissions.ADMINISTRATOR);
    const isAuthor = thread.authorId === userId;

    if (!isMod && !isAuthor) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const channelId = thread.channelId;
    await prisma.forumThread.delete({ where: { id: id as string } });

    getIO().to(`channel:${channelId}`).emit("delete_thread", id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

// Delete a message
router.delete("/messages/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).user.sub;

  try {
    const message = await prisma.forumMessage.findUnique({ where: { id: id as string } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Check MANAGE_FORUM permission or authorship
    const perms = await getUserPermissions(userId, prisma);
    const isMod = hasPermission(perms, Permissions.MANAGE_FORUM) || hasPermission(perms, Permissions.ADMINISTRATOR);
    const isAuthor = message.authorId === userId;

    if (!isMod && !isAuthor) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const room = message.threadId ? `thread:${message.threadId}` : `channel:${message.channelId}`;
    await prisma.forumMessage.delete({ where: { id: id as string } });

    getIO().to(room).emit("delete_message", id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
