"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const node_path_1 = __importDefault(require("node:path"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const error_handler_1 = require("./middleware/error-handler");
const not_found_1 = require("./middleware/not-found");
exports.app = (0, express_1.default)();
const configuredOrigins = env_1.env.CLIENT_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const isAllowedOrigin = (origin) => {
    if (!origin) {
        return true;
    }
    if (configuredOrigins.includes(origin)) {
        return true;
    }
    if (env_1.env.NODE_ENV !== "production") {
        try {
            const parsed = new URL(origin);
            return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
        }
        catch {
            return false;
        }
    }
    return false;
};
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin ${origin ?? "unknown"} is not allowed by CORS.`));
    },
    credentials: true,
}));
exports.app.use((0, helmet_1.default)());
exports.app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 250,
    standardHeaders: true,
    legacyHeaders: false,
}));
exports.app.use(express_1.default.json({ limit: "10mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, morgan_1.default)("dev"));
exports.app.use("/uploads", express_1.default.static(node_path_1.default.resolve(process.cwd(), env_1.env.UPLOAD_DIR)));
exports.app.get("/health", (_req, res) => {
    res.json({
        success: true,
        service: "relief-grid-server",
        status: "ok",
        ai: {
            provider: env_1.env.GEMINI_API_KEY ? "gemini" : "heuristic",
            fallbackProvider: "heuristic",
            configured: Boolean(env_1.env.GEMINI_API_KEY),
            model: env_1.env.GEMINI_MODEL,
        },
    });
});
exports.app.use("/api", routes_1.apiRouter);
exports.app.use(not_found_1.notFoundHandler);
exports.app.use(error_handler_1.errorHandler);
