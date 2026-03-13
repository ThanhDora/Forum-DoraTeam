import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware, JwtPayload } from "../middleware/jwt";

const router = Router();
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  const payload = (req as Request & { user: JwtPayload }).user;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return res.status(404).json({ error: "User not found" });
  
  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
  });
});

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET ?? process.env.JWT_SECRET ?? "default-secret-change-in-production";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? "default-refresh-secret";
const SALT_ROUNDS = 10;

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const { accessToken, refreshToken } = generateTokens(user);
    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Login failed",
    });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { email, password, name } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name ?? null },
    });
    const { accessToken, refreshToken } = generateTokens(user);
    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: null,
        avatarUrl: null,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Registration failed",
    });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const tokens = generateTokens(user);
    return res.json(tokens);
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

export default router;
