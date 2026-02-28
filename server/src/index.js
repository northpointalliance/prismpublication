import "dotenv/config";
import crypto from "node:crypto";
import cors from "cors";
import express from "express";
import { port, corsOrigin, isProduction, allowInsecureDevAuth, sdkApiKey, adminApiKey } from "./config.js";
import { prisma } from "./db.js";
import { logger } from "./logger.js";
import { createIpRateLimiter } from "./rate-limit.js";

// Route modules
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import advertiserRouter from "./routes/advertiser.js";
import walletRouter from "./routes/wallet.js";
import publisherRouter from "./routes/publisher.js";
import payoutsRouter from "./routes/payouts.js";
import adminRouter from "./routes/admin.js";
import sdkRouter from "./routes/sdk.js";
import demoRouter from "./routes/demo.js";
import leadsRouter from "./routes/leads.js";
import webhooksRouter from "./routes/webhooks.js";

// ─── Startup validation ───────────────────────────────────────────────────────

if (!sdkApiKey || !adminApiKey) {
  throw new Error("PRISM_API_KEY (or legacy BOTGRID_API_KEY) and ADMIN_API_KEY are required.");
}
if (isProduction && allowInsecureDevAuth) {
  throw new Error("ALLOW_INSECURE_DEV_AUTH must be false in production.");
}

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();

const allowedOrigins = corsOrigin
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS blocked"));
    },
  }),
);
app.disable("x-powered-by");
app.use(express.json({
  limit: "64kb",
  verify: (req, _res, buf) => { req.rawBody = buf.toString("utf8"); },
}));

// Security headers + request ID
app.use((req, res, next) => {
  req.id = (req.headers["x-request-id"] || crypto.randomUUID()).slice(0, 64);
  res.setHeader("X-Request-Id", req.id);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info("request", {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
});

// ─── Rate limiters ────────────────────────────────────────────────────────────

const authRateLimiter = createIpRateLimiter({ prefix: "auth", windowMs: 10 * 60 * 1000, maxRequests: 180 });
const adminRateLimiter = createIpRateLimiter({ prefix: "admin", windowMs: 10 * 60 * 1000, maxRequests: 240 });
const demoRateLimiter = createIpRateLimiter({ prefix: "demo", windowMs: 10 * 60 * 1000, maxRequests: 240 });
const leadRateLimiter = createIpRateLimiter({ prefix: "lead", windowMs: 10 * 60 * 1000, maxRequests: 60 });

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use(healthRouter);
app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/me", authRateLimiter, meRouter);
app.use("/api/advertiser", advertiserRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/publisher", publisherRouter);
app.use("/api/payouts", payoutsRouter);
app.use("/api/admin", adminRateLimiter, adminRouter);
app.use("/api/leads", leadRateLimiter, leadsRouter);
app.use("/api", sdkRouter); // /api/ads and /api/track/:eventType
app.use("/api/demo", demoRateLimiter, demoRouter);
app.use("/api/webhooks", webhooksRouter);

// ─── Server ───────────────────────────────────────────────────────────────────

const server = app.listen(port, () => {
  logger.info("server started", { port, env: process.env.NODE_ENV || "development" });
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
