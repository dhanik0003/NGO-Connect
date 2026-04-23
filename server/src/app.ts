import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

export const app = express();

const configuredOrigins = env.CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  if (env.NODE_ENV !== "production") {
    try {
      const parsed = new URL(origin);
      return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
    } catch {
      return false;
    }
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin ?? "unknown"} is not allowed by CORS.`));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "relief-grid-server",
    status: "ok",
    ai: {
      provider: env.GEMINI_API_KEY ? "gemini" : "heuristic",
      fallbackProvider: "heuristic",
      configured: Boolean(env.GEMINI_API_KEY),
      model: env.GEMINI_MODEL,
    },
  });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
