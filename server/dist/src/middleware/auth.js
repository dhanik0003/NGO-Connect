"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const requireAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }
    try {
        const payload = (0, jwt_1.verifyAccessToken)(header.slice(7));
        req.user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
        };
        return next();
    }
    catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};
exports.requireAuth = requireAuth;
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to perform this action.",
        });
    }
    return next();
};
exports.requireRole = requireRole;
