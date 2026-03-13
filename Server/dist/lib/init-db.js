"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapAdmin = bootstrapAdmin;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("./prisma");
async function bootstrapAdmin() {
    const adminName = process.env.ADMIN || "Admin";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    try {
        const existing = await prisma_1.prisma.user.findUnique({
            where: { email: adminEmail },
        });
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
        if (existing) {
            console.log(`[Bootstrap] Updating existing admin account: ${adminEmail}`);
            await prisma_1.prisma.user.update({
                where: { email: adminEmail },
                data: {
                    name: adminName,
                    password: hashedPassword,
                    role: "superadmin",
                },
            });
        }
        else {
            console.log(`[Bootstrap] Creating new admin account: ${adminEmail}`);
            await prisma_1.prisma.user.create({
                data: {
                    email: adminEmail,
                    name: adminName,
                    password: hashedPassword,
                    role: "superadmin",
                },
            });
        }
    }
    catch (err) {
        console.error("[Bootstrap] Error initializing admin:", err);
    }
}
//# sourceMappingURL=init-db.js.map