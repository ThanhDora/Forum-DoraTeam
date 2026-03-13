"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../middleware/jwt");
const router = (0, express_1.Router)();
router.get("/profile", jwt_1.authMiddleware, async (req, res) => {
    try {
        const payload = req.user;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, name: true, bio: true, avatarUrl: true, role: true },
        });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        return res.json(user);
    }
    catch (err) {
        console.error("Get profile error:", err);
        return res.status(500).json({ error: "Failed to load profile" });
    }
});
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().optional().nullable(),
    bio: zod_1.z.string().optional().nullable(),
    avatarUrl: zod_1.z.string().optional().nullable(),
});
router.put("/profile", jwt_1.authMiddleware, async (req, res) => {
    try {
        const payload = req.user;
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
        }
        const { name, bio, avatarUrl } = parsed.data;
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (bio !== undefined)
            data.bio = bio;
        if (avatarUrl !== undefined)
            data.avatarUrl = avatarUrl;
        const user = await prisma_1.prisma.user.update({
            where: { id: payload.sub },
            data,
        });
        return res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            role: user.role,
        });
    }
    catch (err) {
        console.error("Update profile error:", err);
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Update profile failed",
        });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map