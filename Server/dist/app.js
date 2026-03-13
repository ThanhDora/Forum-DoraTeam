"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const prisma_1 = require("./lib/prisma");
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/auth", auth_1.default);
app.use("/api/user", user_1.default);
app.use("/api/admin", admin_1.default);
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
const init_db_1 = require("./lib/init-db");
const http_1 = require("http");
const socket_1 = require("./lib/socket");
const httpServer = (0, http_1.createServer)(app);
(0, socket_1.initSocket)(httpServer);
(0, db_1.default)()
    .then(async () => {
    await (0, init_db_1.bootstrapAdmin)();
    httpServer.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map