import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected from server");
    });
  }
  return socket;
};
