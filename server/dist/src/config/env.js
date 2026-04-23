"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required."),
    CLIENT_ORIGIN: zod_1.z.string().default("http://localhost:3000"),
    JWT_ACCESS_SECRET: zod_1.z.string().min(12, "JWT_ACCESS_SECRET must be set."),
    JWT_REFRESH_SECRET: zod_1.z.string().min(12, "JWT_REFRESH_SECRET must be set."),
    ACCESS_TOKEN_TTL: zod_1.z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: zod_1.z.coerce.number().default(14),
    STORAGE_DRIVER: zod_1.z.enum(["local"]).default("local"),
    UPLOAD_DIR: zod_1.z.string().default("uploads"),
    GEMINI_API_KEY: zod_1.z.string().trim().optional(),
    GEMINI_MODEL: zod_1.z.string().default("gemini-2.5-flash-lite"),
    GEMINI_API_BASE_URL: zod_1.z.string().default("https://generativelanguage.googleapis.com/v1beta"),
    AI_REQUEST_TIMEOUT_MS: zod_1.z.coerce.number().default(20000),
});
exports.env = envSchema.parse(process.env);
