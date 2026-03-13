"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const onlineUsers = new Map(); // socketId -> userId
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        },
    });
    io.on("connection", (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);
        // Track identity
        socket.on("identify", (userId) => {
            onlineUsers.set(socket.id, userId);
            broadcastOnlineUsers();
        });
        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
            onlineUsers.delete(socket.id);
            broadcastOnlineUsers();
        });
    });
    return io;
};
exports.initSocket = initSocket;
const broadcastOnlineUsers = () => {
    const users = Array.from(new Set(onlineUsers.values()));
    io.emit("update_online_users", users);
};
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
exports.getIO = getIO;
//# sourceMappingURL=socket.js.map