"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../middleware/jwt");
const admin_1 = require("../middleware/admin");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Apply admin protection to all routes in this router
router.use(jwt_1.authMiddleware, admin_1.adminMiddleware);
// List all users
router.get("/users", async (_req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                bio: true,
            },
            orderBy: { id: "desc" },
        });
        return res.json(users);
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to fetch users", details: err instanceof Error ? err.message : "Unknown error" });
    }
});
const updateUserRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(["user", "admin"]),
});
// Update user role
router.patch("/users/:id/role", async (req, res) => {
    try {
        const { id } = req.params;
        const parsed = updateUserRoleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid role", details: parsed.error.flatten() });
        }
        const targetUser = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (targetUser?.role === "superadmin") {
            return res.status(403).json({ error: "Cannot modify Super Admin" });
        }
        const user = await prisma_1.prisma.user.update({
            where: { id: id },
            data: { role: parsed.data.role },
        });
        return res.json(user);
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to update role", details: err instanceof Error ? err.message : "Unknown error" });
    }
});
// Delete user
router.delete("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const targetUser = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (targetUser?.role === "superadmin") {
            return res.status(403).json({ error: "Cannot delete Super Admin" });
        }
        await prisma_1.prisma.user.delete({ where: { id: id } });
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to delete user", details: err instanceof Error ? err.message : "Unknown error" });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map