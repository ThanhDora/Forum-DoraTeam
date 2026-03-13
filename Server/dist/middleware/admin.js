"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = adminMiddleware;
function adminMiddleware(req, res, next) {
    const user = req.user;
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
        return res.status(403).json({ error: "Forbidden: Admin access only" });
    }
    next();
}
//# sourceMappingURL=admin.js.map