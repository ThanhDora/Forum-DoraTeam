"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../middleware/jwt");
const router = (0, express_1.Router)();
router.get("/me", jwt_1.authMiddleware, async (req, res) => {
    const payload = req.user;
    const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user)
        return res.status(404).json({ error: "User not found" });
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
const generateTokens = (user) => {
    const accessToken = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email, role: user.role }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().optional(),
});
router.post("/login", async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const { email, password } = parsed.data;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const valid = await bcryptjs_1.default.compare(password, user.password);
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
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Login failed",
        });
    }
});
router.post("/register", async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
        }
        const { email, password, name } = parsed.data;
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: "Email already registered" });
        }
        const hashed = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
        const user = await prisma_1.prisma.user.create({
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
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Registration failed",
        });
    }
});
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: decoded.sub } });
        if (!user) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }
        const tokens = generateTokens(user);
        return res.json(tokens);
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map