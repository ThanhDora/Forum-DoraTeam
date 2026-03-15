import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import adminRoutes from "./routes/admin";
import tutorialRoutes from "./routes/tutorial";
import uploadRoutes from "./routes/upload";
import roleRoutes from "./routes/role";
import forumRoutes from "./routes/forum";
import path from "path";
import morgan from "morgan";
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(helmet({
  crossOriginResourcePolicy: false, // Allow local images/resources
}));
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/roles", roleRoutes);
app.use("/api/tutorials", tutorialRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/forum", forumRoutes);

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
    landingpage: "docx api",
    prisma: prismaOk ? "connected" : "disconnected",
  });
});

import { bootstrapAdmin } from "./lib/init-db";

import { createServer } from "http";
import { initSocket } from "./lib/socket";

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, async () => {
  await bootstrapAdmin();
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
