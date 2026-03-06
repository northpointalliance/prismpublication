import "./types.js";
import "dotenv/config";
import { initSentry, Sentry } from "./sentry.js";
initSentry();
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import type { Request, Response, NextFunction } from "express";
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
import blogRouter from "./routes/blog.js";
import { startWorkers, closeWorkers } from "./queue.js";
import { handleCaptureReversed, handlePayoutSucceeded, handlePayoutFailed } from "./routes/webhooks.js";
import { sendPayPalPayout } from "./paypal.js";
import { logAudit } from "./audit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Startup validation ───────────────────────────────────────────────────────

if (!sdkApiKey || !adminApiKey) {
  throw new Error("PRISM_API_KEY (or legacy BOTGRID_API_KEY) and ADMIN_API_KEY are required.");
}
if (isProduction && allowInsecureDevAuth) {
  throw new Error("ALLOW_INSECURE_DEV_AUTH must be false in production.");
}

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();

const allowedOrigins: string[] = corsOrigin
  .split(",")
  .map((value: string) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
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
  verify: (req: Request, _res: Response, buf: Buffer) => { req.rawBody = buf.toString("utf8"); },
}));

// Security headers + request ID
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = (req.headers["x-request-id"] as string || crypto.randomUUID()).slice(0, 64);
  res.setHeader("X-Request-Id", req.id);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  next();
});

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
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

// Serve uploaded blog images as static files
app.use("/uploads", express.static(path.join(__dirname, "../../public/uploads")));

app.use(healthRouter);
app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/me", authRateLimiter, meRouter);
app.use("/api/advertiser", advertiserRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/publisher", publisherRouter);
app.use("/api/payouts", payoutsRouter);
app.use("/api/admin", adminRateLimiter, adminRouter);
app.use("/api/leads", leadRateLimiter, leadsRouter);
app.use("/api/blog", blogRouter);
app.use("/api", sdkRouter); // /api/ads and /api/track/:eventType
app.use("/api/demo", demoRateLimiter, demoRouter);
app.use("/api/webhooks", webhooksRouter);

// Dynamic sitemap — includes all published blog posts
app.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    const domain = process.env.SITE_URL ?? "https://prism.so";
    const staticUrls = ["/", "/blog", "/about", "/pricing", "/advertiser", "/publisher", "/ad-policy"];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map((u) => `  <url><loc>${domain}${u}</loc></url>`).join("\n")}
${posts
  .map(
    (p) =>
      `  <url><loc>${domain}/blog/${p.slug}</loc>${p.publishedAt ? `<lastmod>${p.publishedAt.toISOString().split("T")[0]}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>`;
    res.header("Content-Type", "application/xml").send(xml);
  } catch (err) {
    logger.error("Sitemap generation failed", err);
    res.status(500).send("Failed to generate sitemap");
  }
});

// ─── Sentry error handler (must be after all routes) ─────────────────────────

Sentry.setupExpressErrorHandler(app);

// ─── Server ───────────────────────────────────────────────────────────────────

const server = app.listen(port, async () => {
  logger.info("server started", { port, env: process.env.NODE_ENV || "development" });

  // Start BullMQ workers (no-op if REDIS_URL is not set)
  await startWorkers({
    processWebhook: async (event) => {
      const eventType = event?.event_type;
      switch (eventType) {
        case "PAYMENT.CAPTURE.DENIED":
        case "PAYMENT.CAPTURE.REVERSED":
          await handleCaptureReversed(event);
          break;
        case "PAYOUT_ITEM.SUCCEEDED":
          await handlePayoutSucceeded(event);
          break;
        case "PAYOUT_ITEM.FAILED":
          await handlePayoutFailed(event);
          break;
        case "PAYMENT.CAPTURE.COMPLETED":
          logger.info("worker: capture completed — acknowledged", { eventId: event?.id });
          break;
        default:
          logger.info("worker: unhandled webhook event type", { eventType });
          break;
      }
    },
    processPayout: async (payoutRequestId) => {
      const payoutReq = await prisma.payoutRequest.findUnique({ where: { id: payoutRequestId } });
      if (!payoutReq) throw new Error(`Payout request ${payoutRequestId} not found`);
      if (payoutReq.status !== "pending") throw new Error(`Payout ${payoutRequestId} is not pending (status: ${payoutReq.status})`);

      const senderItemId = `admin_${payoutReq.id}`;
      const paypalResult: any = await sendPayPalPayout({
        recipientEmail: payoutReq.paypalEmail,
        amountCents: payoutReq.amountCents,
        senderItemId,
        note: "Prism Ad Network publisher earnings payout",
      });

      await prisma.payoutRequest.update({
        where: { id: payoutReq.id },
        data: {
          status: "processing",
          paypalBatchId: paypalResult?.batch_header?.payout_batch_id ?? senderItemId,
          processedAt: new Date(),
        },
      });

      await logAudit({
        action: "PAYOUT_PROCESS",
        organizationId: payoutReq.organizationId,
        resourceId: payoutReq.id,
        resourceType: "payout_request",
        before: { status: "pending" },
        after: { status: "processing" },
      });
    },
  });
});

const shutdown = async () => {
  await closeWorkers();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
