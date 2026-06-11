// SDK auth — ported from server/src/portal.ts (requireSdkKey, requireSdkSignature, ensureSdkBotScope).
import type { MiddlewareHandler } from "hono";
import type { Ctx, Env } from "./http.ts";
import { sql } from "./db.ts";
import { sdkApiKey, requireSdkHmac } from "./config.ts";
import { getBearerToken, secureEqual, hashSecret, verifyHmac } from "./crypto.ts";

const HMAC_WINDOW_SECONDS = 300; // ±5 minutes

export const requireSdkKey: MiddlewareHandler<Env> = async (c, next) => {
  const token = getBearerToken(c.req.header("authorization") ?? "");
  if (!token) return c.json({ error: "Unauthorized SDK key" }, 401);

  if (sdkApiKey && secureEqual(token, sdkApiKey)) {
    c.set("sdkAuth", { mode: "master", rawToken: token });
    await next();
    return;
  }
  try {
    const tokenHash = await hashSecret(token);
    const rows = await sql`
      SELECT k."id" AS key_id, b."id" AS bot_id, b."publicId" AS bot_public_id
      FROM bot_sdk_keys k JOIN publisher_bots b ON b."id" = k."botId"
      WHERE k."tokenHash" = ${tokenHash} AND k."revokedAt" IS NULL
      LIMIT 1`;
    if (!rows.length) return c.json({ error: "Unauthorized SDK key" }, 401);
    c.set("sdkAuth", {
      mode: "bot",
      botId: rows[0].bot_id,
      botPublicId: rows[0].bot_public_id,
      keyId: rows[0].key_id,
      rawToken: token,
    });
    await next();
  } catch (err) {
    console.error("SDK auth failed", err);
    return c.json({ error: "Failed to validate SDK key" }, 500);
  }
};

export const ensureSdkBotScope = (c: Ctx, botId: string): { ok: boolean; status?: number; error?: string } => {
  const sdkAuth = c.get("sdkAuth");
  if (sdkAuth?.mode !== "bot") return { ok: true };
  if (sdkAuth.botPublicId !== botId) return { ok: false, status: 403, error: "SDK key is not authorized for this botId" };
  return { ok: true };
};

// HMAC signature check. Requires requireSdkKey first. Reads the raw body (Hono buffers it, so the
// handler can still call c.req.json() afterward).
export const requireSdkSignature: MiddlewareHandler<Env> = async (c, next) => {
  const timestamp = c.req.header("x-prism-timestamp") || "";
  const signature = c.req.header("x-prism-signature") || "";
  const rawToken = c.get("sdkAuth")?.rawToken || "";
  const hasHeaders = Boolean(timestamp && signature);

  if (!hasHeaders) {
    if (requireSdkHmac) {
      return c.json({ error: "Missing request signature (X-Prism-Timestamp + X-Prism-Signature required)" }, 401);
    }
    await next();
    return;
  }

  const ts = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > HMAC_WINDOW_SECONDS) {
    if (requireSdkHmac) return c.json({ error: "Request timestamp expired or invalid" }, 401);
    await next();
    return;
  }

  const rawBody = await c.req.text();
  const valid = await verifyHmac(rawBody, timestamp, signature, rawToken);
  if (!valid && requireSdkHmac) return c.json({ error: "Invalid request signature" }, 401);
  if (!valid) console.warn("SDK request signature mismatch (enforcement disabled)");
  await next();
};
