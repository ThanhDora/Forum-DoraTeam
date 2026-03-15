import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { prisma } from "./prisma";

let io: SocketServer;
const onlineUsers = new Map<string, string>(); // socketId -> userId

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Track identity
    socket.on("identify", (userId: string) => {
      onlineUsers.set(socket.id, userId);
      broadcastOnlineUsers();
    });

    socket.on("disconnect", async () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() }
          });
        } catch (err) {
          console.error(`[Socket] Error updating lastActiveAt for ${userId}:`, err);
        }
      }
      onlineUsers.delete(socket.id);
      broadcastOnlineUsers();
    });

    // Forum Rooms
    socket.on("join_room", (room: string) => {
      socket.join(room);
      console.log(`[Socket] User ${socket.id} joined room: ${room}`);
    });

    socket.on("leave_room", (room: string) => {
      socket.leave(room);
      console.log(`[Socket] User ${socket.id} left room: ${room}`);
    });
  });

  return io;
};

const broadcastOnlineUsers = () => {
  const users = Array.from(new Set(onlineUsers.values()));
  io.emit("update_online_users", users);
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
