"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = __importDefault(require("./config/db"));
const prisma_1 = require("./lib/prisma");
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", async (_req, res) => {
    let prismaOk = false;
    try {
        await prisma_1.prisma.$connect();
        prismaOk = true;
    }
    catch {
        // ignore
    }
    res.json({
        status: "ok",
        mongodb: mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected",
        prisma: prismaOk ? "connected" : "disconnected",
    });
});
(0, db_1.default)()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map