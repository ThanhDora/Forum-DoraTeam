import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import connectDB from "./config/db";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import adminRoutes from "./routes/admin";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", async (_req, res) => {
  let prismaOk = false;
  try {
    await prisma.$connect();
    prismaOk = true;
  } catch {
    // ignore
  }
  res.json({
    status: "ok",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    prisma: prismaOk ? "connected" : "disconnected",
  });
});

import { bootstrapAdmin } from "./lib/init-db";

import { createServer } from "http";
import { initSocket } from "./lib/socket";

const httpServer = createServer(app);
initSocket(httpServer);

connectDB()
  .then(async () => {
    await bootstrapAdmin();
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

export default app;
