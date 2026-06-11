// `api` Edge Function — Hono gateway reproducing the Express `/api/*` contract.
// Served at /functions/v1/api/* ; the function sees paths as /api/* (function name = `api`).
// NOTE: deploy with `verify_jwt = false` (we do our own auth; some routes are public).
import { Hono } from "hono";
import { cors } from "hono/cors";
import { baseMiddleware, type Env } from "../_shared/http.ts";
import { corsOrigin } from "../_shared/config.ts";

import health from "./routes/health.ts";
import blog from "./routes/blog.ts";
import leads from "./routes/leads.ts";
import auth from "./routes/auth.ts";
import me from "./routes/me.ts";
import advertiser from "./routes/advertiser.ts";
import wallet from "./routes/wallet.ts";
import publisher from "./routes/publisher.ts";
import payouts from "./routes/payouts.ts";
import sdk from "./routes/sdk.ts";
import demo from "./routes/demo.ts";
import admin from "./routes/admin.ts";

const app = new Hono<Env>();

// CORS — mirror API_CORS_ORIGIN (comma-separated list, or "*").
const origins = corsOrigin.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  "*",
  cors({
    origin: origins.includes("*") ? "*" : origins,
    allowHeaders: ["authorization", "x-user-email", "x-admin-key", "content-type", "apikey",
      "x-request-id", "x-prism-timestamp", "x-prism-signature"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use("*", baseMiddleware);

// Domains (mounted at the same paths Express used).
app.route("/api", health); // -> /api/health
app.route("/api/blog", blog);
app.route("/api/leads", leads);
app.route("/api/auth", auth);
app.route("/api/me", me);
app.route("/api/advertiser", advertiser);
app.route("/api/wallet", wallet);
app.route("/api/publisher", publisher);
app.route("/api/payouts", payouts);
app.route("/api/admin", admin);
app.route("/api/demo", demo);
app.route("/api", sdk); // /api/ads + /api/track/:eventType

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error("Unhandled error", err);
  return c.json({ error: "Internal error" }, 500);
});

Deno.serve(app.fetch);
