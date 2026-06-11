import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { adminCreateAdSchema, adminUpdateAdSchema } from "../../_shared/validation.ts";
import { requirePortalUser, requireAdminPortalUser } from "../../_shared/portal.ts";
import { requireAdminKey } from "../../_shared/auth.ts";
import {
  getPayPalConfig, getPayPalToken, getPlatformFeePct,
  PAYPAL_CLIENT_ID_KEY, PAYPAL_CLIENT_SECRET_KEY, PAYPAL_MODE_KEY, PLATFORM_FEE_KEY,
} from "../../_shared/paypal.ts";
import { enqueuePayoutProcess } from "../../_shared/queue.ts";
import { logAudit, ipFromHeaders } from "../../_shared/audit.ts";
import { validateImageUrl } from "../../_shared/image-validation.ts";
import { supabaseAdmin, BLOG_BUCKET } from "../../_shared/storage.ts";
import {
  CPM_TEXT_KEY, CPM_CARD_KEY, CPM_BANNER_KEY, DEFAULT_CPM_TEXT, DEFAULT_CPM_CARD, DEFAULT_CPM_BANNER,
} from "../../_shared/config.ts";

// Mounted at /api/admin. Ports server/src/routes/admin.ts.
const admin = new Hono<Env>();
const portalAdmin = [requirePortalUser, requireAdminPortalUser] as const;

const blogPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1),
  category: z.string().max(100).optional(),
  readingTime: z.number().int().min(1).max(60).optional(),
});
const toSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// deno-lint-ignore no-explicit-any
const num = (rows: any) => Number(rows[0].count) || 0;
const upsertSetting = (key: string, value: string) =>
  sql`INSERT INTO platform_settings ("id","key","value","updatedAt") VALUES (${newId()}, ${key}, ${value}, now())
      ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = now()`;
const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === "23505";

// ─── Portal admin routes ───────────────────────────────────────────────────────
admin.get("/portal/overview", ...portalAdmin, async (c) => {
  try {
    const [pend, act, ev, ld] = await Promise.all([
      sql`SELECT count(*) FROM ads WHERE "isActive" = false`,
      sql`SELECT count(*) FROM ads WHERE "isActive" = true`,
      sql`SELECT count(*) FROM ad_events`,
      sql`SELECT count(*) FROM leads`,
    ]);
    return c.json({
      campaignsPending: num(pend), botReviewsPending: 0, riskAlerts: 0, incidentsOpen: 0,
      activeAds: num(act), totalEvents: num(ev), totalLeads: num(ld),
    });
  } catch (err) {
    console.error("Admin portal overview failed", err);
    return c.json({ error: "Failed to load admin portal overview" }, 500);
  }
});

admin.get("/portal/ads/review", ...portalAdmin, async (c) => {
  try {
    const pending = await sql`SELECT * FROM ads WHERE "isActive" = false AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 100`;
    const active = await sql`SELECT * FROM ads WHERE "isActive" = true AND "deletedAt" IS NULL ORDER BY "updatedAt" DESC LIMIT 50`;
    return c.json({ pending, active });
  } catch (err) {
    console.error("Admin ad review list failed", err);
    return c.json({ error: "Failed to load ad review queue" }, 500);
  }
});

admin.post("/portal/ads/:id/approve", ...portalAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const ad = await sql`SELECT "id" FROM ads WHERE "id" = ${id} LIMIT 1`;
    if (!ad.length) return c.json({ error: "Ad not found" }, 404);
    await sql`UPDATE ads SET "isActive" = true, "updatedAt" = now() WHERE "id" = ${id}`;
    await logAudit({ action: "AD_APPROVE", actorUserId: c.get("portalUser")!.id, resourceId: id, resourceType: "ad",
      before: { isActive: false }, after: { isActive: true }, ip: ipFromHeaders(c.req.raw.headers) });
    return c.json({ ok: true });
  } catch (err) {
    console.error("Ad approve failed", err);
    return c.json({ error: "Failed to approve ad" }, 500);
  }
});

admin.post("/portal/ads/:id/reject", ...portalAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const ad = await sql`SELECT "id","isActive" FROM ads WHERE "id" = ${id} LIMIT 1`;
    if (!ad.length) return c.json({ error: "Ad not found" }, 404);
    await sql`UPDATE ads SET "deletedAt" = now(), "isActive" = false, "updatedAt" = now() WHERE "id" = ${id}`;
    await logAudit({ action: "AD_REJECT", actorUserId: c.get("portalUser")!.id, resourceId: id, resourceType: "ad",
      before: { isActive: ad[0].isActive }, after: { isActive: false }, ip: ipFromHeaders(c.req.raw.headers) });
    return c.json({ ok: true });
  } catch (err) {
    console.error("Ad reject failed", err);
    return c.json({ error: "Failed to reject ad" }, 500);
  }
});

admin.get("/platform-settings", ...portalAdmin, async (c) => {
  try {
    const [feePct, cfg, cpmText, cpmCard, cpmBanner] = await Promise.all([
      getPlatformFeePct(),
      getPayPalConfig(),
      sql`SELECT "value" FROM platform_settings WHERE "key" = ${CPM_TEXT_KEY} LIMIT 1`,
      sql`SELECT "value" FROM platform_settings WHERE "key" = ${CPM_CARD_KEY} LIMIT 1`,
      sql`SELECT "value" FROM platform_settings WHERE "key" = ${CPM_BANNER_KEY} LIMIT 1`,
    ]);
    const masked = cfg.clientId ? cfg.clientId.slice(0, 6) + "…" + cfg.clientId.slice(-4) : null;
    return c.json({
      platformFeePct: feePct, paypalMode: cfg.mode, paypalEnabled: cfg.enabled,
      paypalClientIdMasked: masked, paypalFromDb: cfg.fromDb,
      cpmTextCents: parseInt(cpmText[0]?.value ?? String(DEFAULT_CPM_TEXT), 10),
      cpmCardCents: parseInt(cpmCard[0]?.value ?? String(DEFAULT_CPM_CARD), 10),
      cpmBannerCents: parseInt(cpmBanner[0]?.value ?? String(DEFAULT_CPM_BANNER), 10),
    });
  } catch (err) {
    console.error("Get platform settings error", err);
    return c.json({ error: "Failed to fetch platform settings" }, 500);
  }
});

admin.put("/platform-settings/rates", ...portalAdmin, async (c) => {
  const parsed = z.object({
    cpmTextCents: z.number().int().min(100).max(1_000_000).optional(),
    cpmCardCents: z.number().int().min(100).max(1_000_000).optional(),
    cpmBannerCents: z.number().int().min(100).max(1_000_000).optional(),
  }).safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid rate values" }, 400);
  const { cpmTextCents, cpmCardCents, cpmBannerCents } = parsed.data;
  if (cpmTextCents === undefined && cpmCardCents === undefined && cpmBannerCents === undefined) {
    return c.json({ error: "Provide at least one rate to update" }, 400);
  }
  try {
    const ups: Promise<unknown>[] = [];
    if (cpmTextCents !== undefined) ups.push(upsertSetting(CPM_TEXT_KEY, String(cpmTextCents)));
    if (cpmCardCents !== undefined) ups.push(upsertSetting(CPM_CARD_KEY, String(cpmCardCents)));
    if (cpmBannerCents !== undefined) ups.push(upsertSetting(CPM_BANNER_KEY, String(cpmBannerCents)));
    await Promise.all(ups);
    await logAudit({ action: "RATE_TABLE_UPDATE", actorUserId: c.get("portalUser")!.id, resourceType: "platform_settings",
      after: { cpmTextCents, cpmCardCents, cpmBannerCents }, ip: ipFromHeaders(c.req.raw.headers) });
    return c.json({
      cpmTextCents: cpmTextCents ?? DEFAULT_CPM_TEXT,
      cpmCardCents: cpmCardCents ?? DEFAULT_CPM_CARD,
      cpmBannerCents: cpmBannerCents ?? DEFAULT_CPM_BANNER,
    });
  } catch (err) {
    console.error("Update CPM rates error", err);
    return c.json({ error: "Failed to update CPM rates" }, 500);
  }
});

admin.put("/platform-settings/paypal", ...portalAdmin, async (c) => {
  const parsed = z.object({
    clientId: z.string().trim().min(1).max(500).optional(),
    clientSecret: z.string().trim().min(1).max(500).optional(),
    mode: z.enum(["sandbox", "live"]).optional(),
  }).safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid PayPal settings" }, 400);
  const { clientId, clientSecret, mode } = parsed.data;
  if (!clientId && !clientSecret && !mode) return c.json({ error: "Provide at least one field to update" }, 400);
  try {
    const ups: Promise<unknown>[] = [];
    if (clientId !== undefined) ups.push(upsertSetting(PAYPAL_CLIENT_ID_KEY, clientId));
    if (clientSecret !== undefined) ups.push(upsertSetting(PAYPAL_CLIENT_SECRET_KEY, clientSecret));
    if (mode !== undefined) ups.push(upsertSetting(PAYPAL_MODE_KEY, mode));
    await Promise.all(ups);
    await logAudit({ action: "PAYPAL_CONFIG_UPDATE", actorUserId: c.get("portalUser")!.id, resourceType: "platform_settings",
      after: { clientIdUpdated: clientId !== undefined, secretUpdated: clientSecret !== undefined, modeUpdated: mode !== undefined, mode },
      ip: ipFromHeaders(c.req.raw.headers) });
    return c.json({ ok: true });
  } catch (err) {
    console.error("Update PayPal config error", err);
    return c.json({ error: "Failed to update PayPal config" }, 500);
  }
});

admin.post("/platform-settings/paypal/test", ...portalAdmin, async (c) => {
  try {
    const cfg = await getPayPalConfig();
    if (!cfg.enabled) return c.json({ ok: false, error: "No PayPal credentials configured" }, 400);
    await getPayPalToken(cfg);
    return c.json({ ok: true, mode: cfg.mode });
  } catch (err) {
    console.error("PayPal connection test failed", err);
    return c.json({ ok: false, error: "Authentication failed — check your Client ID and Secret" }, 200);
  }
});

admin.put("/platform-settings/fee", ...portalAdmin, async (c) => {
  const parsed = z.object({ platformFeePct: z.number().min(0).max(100) }).safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Fee must be between 0 and 100" }, 400);
  try {
    const oldFeePct = await getPlatformFeePct();
    await upsertSetting(PLATFORM_FEE_KEY, String(parsed.data.platformFeePct));
    await logAudit({ action: "PLATFORM_FEE_UPDATE", actorUserId: c.get("portalUser")!.id, resourceType: "platform_settings",
      before: { platformFeePct: oldFeePct }, after: { platformFeePct: parsed.data.platformFeePct }, ip: ipFromHeaders(c.req.raw.headers) });
    return c.json({ ok: true, platformFeePct: parsed.data.platformFeePct });
  } catch (err) {
    console.error("Update fee error", err);
    return c.json({ error: "Failed to update fee" }, 500);
  }
});

admin.get("/wallet-transactions", ...portalAdmin, async (c) => {
  try {
    const rows = await sql`
      SELECT wt.*, json_build_object('id', o."id", 'name', o."name", 'type', o."type") AS organization
      FROM wallet_transactions wt JOIN organizations o ON o."id" = wt."organizationId"
      ORDER BY wt."createdAt" DESC LIMIT 100`;
    return c.json(rows);
  } catch (err) {
    console.error("Admin wallet transactions error", err);
    return c.json({ error: "Failed to fetch wallet transactions" }, 500);
  }
});

admin.get("/payout-requests", ...portalAdmin, async (c) => {
  try {
    const rows = await sql`
      SELECT pr.*, json_build_object('id', o."id", 'name', o."name") AS organization
      FROM payout_requests pr JOIN organizations o ON o."id" = pr."organizationId"
      ORDER BY pr."createdAt" DESC LIMIT 100`;
    return c.json(rows);
  } catch (err) {
    console.error("Admin payout requests error", err);
    return c.json({ error: "Failed to fetch payout requests" }, 500);
  }
});

admin.post("/payout-requests/:id/process", ...portalAdmin, async (c) => {
  const cfg = await getPayPalConfig();
  if (!cfg.enabled) return c.json({ error: "PayPal not configured on this server" }, 503);
  try {
    const rows = await sql`SELECT "id","status" FROM payout_requests WHERE "id" = ${c.req.param("id")} LIMIT 1`;
    if (!rows.length) return c.json({ error: "Payout request not found" }, 404);
    if (rows[0].status !== "pending") return c.json({ error: "Only pending requests can be processed" }, 400);
    await enqueuePayoutProcess(rows[0].id);
    return c.json({ ok: true });
  } catch (err) {
    console.error("Admin process payout error", err);
    return c.json({ error: "PayPal payout failed" }, 500);
  }
});

admin.put("/payout-requests/:id/status", ...portalAdmin, async (c) => {
  const parsed = z.object({ status: z.enum(["pending", "processing", "paid", "failed"]) }).safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid status value" }, 400);
  try {
    const rows = await sql`SELECT "id","status","organizationId","processedAt" FROM payout_requests WHERE "id" = ${c.req.param("id")} LIMIT 1`;
    if (!rows.length) return c.json({ error: "Payout request not found" }, 404);
    const pr = rows[0];
    const setPaidNow = parsed.data.status === "paid" && !pr.processedAt;
    await sql`UPDATE payout_requests SET "status" = ${parsed.data.status},
      "processedAt" = ${setPaidNow ? new Date() : pr.processedAt}, "updatedAt" = now() WHERE "id" = ${pr.id}`;
    await logAudit({ action: "PAYOUT_STATUS_UPDATE", actorUserId: c.get("portalUser")!.id, organizationId: pr.organizationId,
      resourceId: pr.id, resourceType: "payout_request", before: { status: pr.status }, after: { status: parsed.data.status },
      ip: ipFromHeaders(c.req.raw.headers) });
    return c.json({ ok: true });
  } catch (err) {
    console.error("Admin update payout status error", err);
    return c.json({ error: "Failed to update payout status" }, 500);
  }
});

// ─── Blog admin CRUD ─────────────────────────────────────────────────────────
admin.get("/portal/blog", ...portalAdmin, async (c) => {
  try {
    return c.json(await sql`SELECT * FROM blog_posts ORDER BY "createdAt" DESC`);
  } catch (err) {
    console.error("Blog list (admin) failed", err);
    return c.json({ error: "Failed to fetch blog posts" }, 500);
  }
});

admin.post("/portal/blog", ...portalAdmin, async (c) => {
  const parsed = blogPostSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid post data", details: parsed.error.flatten() }, 400);
  try {
    const d = parsed.data;
    const slug = d.slug || toSlug(d.title);
    const rows = await sql`
      INSERT INTO blog_posts ("id","title","slug","excerpt","body","category","readingTime","updatedAt")
      VALUES (${newId()}, ${d.title}, ${slug}, ${d.excerpt ?? null}, ${d.body}, ${d.category ?? null}, ${d.readingTime ?? null}, now())
      RETURNING *`;
    await logAudit({ action: "BLOG_POST_CREATE", actorUserId: c.get("portalUser")!.id, resourceId: rows[0].id, resourceType: "blog_post",
      after: { title: rows[0].title, slug: rows[0].slug }, ip: ipFromHeaders(c.req.raw.headers) });
    return c.json(rows[0], 201);
  } catch (err) {
    if (isUniqueViolation(err)) return c.json({ error: "A post with that slug already exists" }, 409);
    console.error("Blog create failed", err);
    return c.json({ error: "Failed to create blog post" }, 500);
  }
});

admin.put("/portal/blog/:id", ...portalAdmin, async (c) => {
  const parsed = blogPostSchema.partial().safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid post data", details: parsed.error.flatten() }, 400);
  try {
    const id = c.req.param("id");
    const existing = await sql`SELECT "title","slug" FROM blog_posts WHERE "id" = ${id} LIMIT 1`;
    if (!existing.length) return c.json({ error: "Post not found" }, 404);
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["title", "slug", "excerpt", "body", "category", "readingTime"] as const) {
      if (parsed.data[k] !== undefined) updateData[k] = parsed.data[k];
    }
    const rows = await sql`UPDATE blog_posts SET ${sql(updateData)} WHERE "id" = ${id} RETURNING *`;
    await logAudit({ action: "BLOG_POST_UPDATE", actorUserId: c.get("portalUser")!.id, resourceId: id, resourceType: "blog_post",
      before: { title: existing[0].title, slug: existing[0].slug }, after: { title: rows[0].title, slug: rows[0].slug },
      ip: ipFromHeaders(c.req.raw.headers) });
    return c.json(rows[0]);
  } catch (err) {
    if (isUniqueViolation(err)) return c.json({ error: "A post with that slug already exists" }, 409);
    console.error("Blog update failed", err);
    return c.json({ error: "Failed to update blog post" }, 500);
  }
});

admin.delete("/portal/blog/:id", ...portalAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await sql`SELECT "title","slug","published" FROM blog_posts WHERE "id" = ${id} LIMIT 1`;
    if (!existing.length) return c.json({ error: "Post not found" }, 404);
    await sql`DELETE FROM blog_posts WHERE "id" = ${id}`;
    await logAudit({ action: "BLOG_POST_DELETE", actorUserId: c.get("portalUser")!.id, resourceId: id, resourceType: "blog_post",
      before: { title: existing[0].title, slug: existing[0].slug, published: existing[0].published }, ip: ipFromHeaders(c.req.raw.headers) });
    return c.json({ ok: true });
  } catch (err) {
    console.error("Blog delete failed", err);
    return c.json({ error: "Failed to delete blog post" }, 500);
  }
});

admin.post("/portal/blog/:id/publish", ...portalAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await sql`SELECT "published","publishedAt" FROM blog_posts WHERE "id" = ${id} LIMIT 1`;
    if (!existing.length) return c.json({ error: "Post not found" }, 404);
    const nextPublished = !existing[0].published;
    const publishedAt = nextPublished && !existing[0].publishedAt ? new Date() : existing[0].publishedAt;
    const rows = await sql`UPDATE blog_posts SET "published" = ${nextPublished}, "publishedAt" = ${publishedAt}, "updatedAt" = now() WHERE "id" = ${id} RETURNING *`;
    await logAudit({ action: "BLOG_POST_PUBLISH", actorUserId: c.get("portalUser")!.id, resourceId: id, resourceType: "blog_post",
      before: { published: existing[0].published }, after: { published: rows[0].published, publishedAt: rows[0].publishedAt },
      ip: ipFromHeaders(c.req.raw.headers) });
    return c.json(rows[0]);
  } catch (err) {
    console.error("Blog publish toggle failed", err);
    return c.json({ error: "Failed to toggle publish state" }, 500);
  }
});

// POST /api/admin/portal/blog/:id/image — multipart upload to Supabase Storage.
admin.post("/portal/blog/:id/image", ...portalAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const form = await c.req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) return c.json({ error: "No image file provided" }, 400);
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      return c.json({ error: "Only JPEG, PNG, WebP and GIF images are allowed" }, 400);
    }
    if (file.size > 5 * 1024 * 1024) return c.json({ error: "Image exceeds the 5 MB size limit" }, 400);
    const existing = await sql`SELECT "id" FROM blog_posts WHERE "id" = ${id} LIMIT 1`;
    if (!existing.length) return c.json({ error: "Post not found" }, 404);

    const safe = file.name.replace(/[^a-z0-9._-]/gi, "_").toLowerCase();
    const objectPath = `${Date.now()}-${safe}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await supabaseAdmin.storage.from(BLOG_BUCKET).upload(objectPath, bytes, {
      contentType: file.type, upsert: false,
    });
    if (upErr) throw upErr;
    const { data } = supabaseAdmin.storage.from(BLOG_BUCKET).getPublicUrl(objectPath);
    const imageUrl = data.publicUrl;
    await sql`UPDATE blog_posts SET "imageUrl" = ${imageUrl}, "updatedAt" = now() WHERE "id" = ${id}`;
    return c.json({ imageUrl });
  } catch (err) {
    console.error("Blog image upload failed", err);
    return c.json({ error: "Failed to upload image" }, 500);
  }
});

// ─── Legacy admin-key routes ───────────────────────────────────────────────────
admin.get("/overview", requireAdminKey, async (c) => {
  try {
    const [a, b, e, l] = await Promise.all([
      sql`SELECT count(*) FROM ads`,
      sql`SELECT count(*) FROM ads WHERE "isActive" = true`,
      sql`SELECT count(*) FROM ad_events`,
      sql`SELECT count(*) FROM leads`,
    ]);
    return c.json({ totalAds: num(a), activeAds: num(b), totalEvents: num(e), totalLeads: num(l) });
  } catch (err) {
    console.error("Overview fetch failed", err);
    return c.json({ error: "Failed to fetch overview" }, 500);
  }
});

admin.get("/ads", requireAdminKey, async (c) => {
  try {
    return c.json(await sql`SELECT * FROM ads ORDER BY "updatedAt" DESC LIMIT 200`);
  } catch (err) {
    console.error("Ad list failed", err);
    return c.json({ error: "Failed to fetch ads" }, 500);
  }
});

admin.post("/ads", requireAdminKey, async (c) => {
  const parsed = adminCreateAdSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid ad payload", details: parsed.error.flatten() }, 400);
  try {
    if (parsed.data.imageUrl) {
      try {
        await validateImageUrl(parsed.data.imageUrl);
      } catch (imgErr) {
        return c.json({ error: `Image validation failed: ${(imgErr as Error).message}` }, 400);
      }
    }
    const d = parsed.data;
    const rows = await sql`
      INSERT INTO ads ("id","title","description","ctaText","clickUrl","advertiser","imageUrl","topics","format","weight","isActive","updatedAt")
      VALUES (${newId()}, ${d.title}, ${d.description}, ${d.ctaText}, ${d.clickUrl}, ${d.advertiser}, ${d.imageUrl ?? null},
              ${d.topics}::text[], ${d.format}, ${d.weight}, ${d.isActive}, now())
      RETURNING *`;
    return c.json(rows[0], 201);
  } catch (err) {
    console.error("Ad create failed", err);
    return c.json({ error: "Failed to create ad" }, 500);
  }
});

admin.patch("/ads/:id", requireAdminKey, async (c) => {
  const parsed = adminUpdateAdSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid ad update payload", details: parsed.error.flatten() }, 400);
  try {
    const id = c.req.param("id");
    const { topics, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    let rows = await sql`UPDATE ads SET ${sql(updateData)} WHERE "id" = ${id} RETURNING *`;
    if (topics !== undefined) {
      rows = await sql`UPDATE ads SET "topics" = ${topics}::text[], "updatedAt" = now() WHERE "id" = ${id} RETURNING *`;
    }
    if (!rows.length) return c.json({ error: "Failed to update ad" }, 500);
    return c.json(rows[0]);
  } catch (err) {
    console.error("Ad update failed", err);
    return c.json({ error: "Failed to update ad" }, 500);
  }
});

admin.get("/events", requireAdminKey, async (c) => {
  const limit = Number(c.req.query("limit") || 100);
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 300) : 100;
  try {
    const rows = await sql`
      SELECT e.*, CASE WHEN a."id" IS NOT NULL THEN json_build_object('id', a."id", 'title', a."title", 'advertiser', a."advertiser") ELSE NULL END AS ad
      FROM ad_events e LEFT JOIN ads a ON a."id" = e."adId"
      ORDER BY e."createdAt" DESC LIMIT ${take}`;
    return c.json(rows);
  } catch (err) {
    console.error("Event list failed", err);
    return c.json({ error: "Failed to fetch events" }, 500);
  }
});

admin.get("/leads", requireAdminKey, async (c) => {
  try {
    return c.json(await sql`SELECT * FROM leads ORDER BY "createdAt" DESC LIMIT 200`);
  } catch (err) {
    console.error("Lead list failed", err);
    return c.json({ error: "Failed to fetch leads" }, 500);
  }
});

export default admin;
