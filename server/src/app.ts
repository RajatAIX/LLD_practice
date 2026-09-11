import express from "express";
import type { Express } from "express";
import { globalErrorHandler } from "./middleware/errorMiddleware.js";
import { notFoundHandler } from "./middleware/notFoundMiddleware.js";
import routes from "./routes/index.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { generalLimiter } from "./middleware/rateLimitMiddleware.js";

const app: Express = express();

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === env.allowedOrigin ||
        origin === "http://localhost:5173" ||
        origin === "http://localhost:5174" ||
        /^http:\/\/localhost:517\d$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ── General Rate Limiting ──────────────────────────────────────────────────
app.use(generalLimiter);

// ── Logging ────────────────────────────────────────────────────────────────
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// ── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", environment: env.nodeEnv, timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/v1", routes);
app.use("/api", routes);
app.use("/", routes);

// ── Error Handling ─────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;