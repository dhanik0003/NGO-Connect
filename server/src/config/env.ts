import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(12, "JWT_ACCESS_SECRET must be set."),
  JWT_REFRESH_SECRET: z.string().min(12, "JWT_REFRESH_SECRET must be set."),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(14),
  STORAGE_DRIVER: z.enum(["local"]).default("local"),
  UPLOAD_DIR: z.string().default("uploads"),
  GEMINI_API_KEY: z.string().trim().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash-lite"),
  GEMINI_API_BASE_URL: z.string().default("https://generativelanguage.googleapis.com/v1beta"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().default(20000),
});

export const env = envSchema.parse(process.env);
