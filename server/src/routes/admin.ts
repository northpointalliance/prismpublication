import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { prisma } from "../db.js";
import { adminCreateAdSchema, adminUpdateAdSchema, leadSchema } from "../schemas.js";
import { requirePortalUser, requireAdminPortalUser, requireAdminKey } from "../portal.js";
import {
  getPayPalConfig,
  getPayPalToken,
  sendPayPalPayout,
  getPlatformFeePct,
  PAYPAL_CLIENT_ID_KEY,
  PAYPAL_CLIENT_SECRET_KEY,
  PAYPAL_MODE_KEY,
  PLATFORM_FEE_KEY,
} from "../paypal.js";
import { enqueuePayoutProcess } from "../queue.js";
import { logger } from "../logger.js";
import { logAudit } from "../audit.js";
import { validateImageUrl } from "../image-validation.js";
import {
  CPM_TEXT_KEY,
  CPM_CARD_KEY,
  CPM_BANNER_KEY,
  DEFAULT_CPM_TEXT,
  DEFAULT_CPM_CARD,
  DEFAULT_CPM_BANNER,
} from "../config.js";

// ─── Blog image upload setup ──────────────────────────────────────────────────

const __adminDirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__adminDirname, "../../../public/uploads/blog");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const blogImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9._-]/gi, "_").toLowerCase();
    cb(null, `${Date.now()}-${safe}`);
  },
});

const uploadBlogImage = multer({
  storage: blogImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed"));
    }
  },
});

// ─── Blog schema + helpers ────────────────────────────────────────────────────

const blogPostSchema = z.object({
  title:       z.string().min(1).max(200),
  slug:        z.string().min(1).max(200).optional(),
  excerpt:     z.string().max(500).optional(),
  body:        z.string().min(1),
  category:    z.string().max(100).optional(),
  readingTime: z.number().int().min(1).max(60).optional(),
});

const toSlug = (title: string): string =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const router = express.Router();

// ─── Portal admin routes (Supabase auth + admin workspace) ────────────────────

router.get("/portal/overview", requirePortalUser, requireAdminPortalUser, async (_req: Request, res: Response) => {
  try {
    const [campaignsPending, activeAds, totalEvents, totalLeads] = await Promise.all([
      prisma.ad.count({ where: { isActive: false } }),
      prisma.ad.count({ where: { isActive: true } }),
      prisma.adEvent.count(),
      prisma.lead.count(),
    ]);

    return res.json({
      campaignsPending,
      botReviewsPending: 0,
      riskAlerts: 0,
      incidentsOpen: 0,
      activeAds,
      totalEvents,
      totalLeads,
    });
  } catch (err) {
    logger.error("Admin portal overview failed", err);
    return res.status(500).json({ error: "Failed to load admin portal overview" });
  }
});

router.get("/portal/ads/review", requirePortalUser, requireAdminPortalUser, async (_req: Request, res: Response) => {
  try {
    const pending = await prisma.ad.findMany({
      where: { isActive: false, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const active = await prisma.ad.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return res.json({ pending, active });
  } catch (err) {
    logger.error("Admin ad review list failed", err);
    return res.status(500).json({ error: "Failed to load ad review queue" });
  }
});

router.post("/portal/ads/:id/approve", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  try {
    const ad = await prisma.ad.findUnique({ where: { id: req.params.id } });
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    await prisma.ad.update({ where: { id: req.params.id }, data: { isActive: true } });
    await logAudit({
      action: "AD_APPROVE",
      actorUserId: (req as any).portalUser?.id,
      resourceId: req.params.id,
      resourceType: "ad",
      before: { isActive: false },
      after: { isActive: true },
      req,
    });
    return res.json({ ok: true });
  } catch (err) {
    logger.error("Ad approve failed", err);
    return res.status(500).json({ error: "Failed to approve ad" });
  }
});

router.post("/portal/ads/:id/reject", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  try {
    const ad = await prisma.ad.findUnique({ where: { id: req.params.id } });
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    // Soft-delete for audit trail: rejected ads are kept but marked deleted + inactive
    await prisma.ad.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), isActive: false } });
    await logAudit({
      action: "AD_REJECT",
      actorUserId: (req as any).portalUser?.id,
      resourceId: req.params.id,
      resourceType: "ad",
      before: { isActive: ad.isActive },
      after: { isActive: false, deletedAt: new Date().toISOString() },
      req,
    });
    return res.json({ ok: true });
  } catch (err) {
    logger.error("Ad reject failed", err);
    return res.status(500).json({ error: "Failed to reject ad" });
  }
});

router.get("/platform-settings", requirePortalUser, requireAdminPortalUser, async (_req: Request, res: Response) => {
  try {
    const [feePct, cfg, cpmText, cpmCard, cpmBanner] = await Promise.all([
      getPlatformFeePct(),
      getPayPalConfig(),
      prisma.platformSettings.findUnique({ where: { key: CPM_TEXT_KEY } }),
      prisma.platformSettings.findUnique({ where: { key: CPM_CARD_KEY } }),
      prisma.platformSettings.findUnique({ where: { key: CPM_BANNER_KEY } }),
    ]);
    const masked = cfg.clientId ? cfg.clientId.slice(0, 6) + "…" + cfg.clientId.slice(-4) : null;
    return res.json({
      platformFeePct: feePct,
      paypalMode: cfg.mode,
      paypalEnabled: cfg.enabled,
      paypalClientIdMasked: masked,
      paypalFromDb: cfg.fromDb,
      cpmTextCents:   parseInt(cpmText?.value   ?? String(DEFAULT_CPM_TEXT),   10),
      cpmCardCents:   parseInt(cpmCard?.value   ?? String(DEFAULT_CPM_CARD),   10),
      cpmBannerCents: parseInt(cpmBanner?.value ?? String(DEFAULT_CPM_BANNER), 10),
    });
  } catch (err) {
    logger.error("Get platform settings error", err);
    return res.status(500).json({ error: "Failed to fetch platform settings" });
  }
});

router.put("/platform-settings/rates", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  const parsed = z
    .object({
      cpmTextCents:   z.number().int().min(100).max(1_000_000).optional(),
      cpmCardCents:   z.number().int().min(100).max(1_000_000).optional(),
      cpmBannerCents: z.number().int().min(100).max(1_000_000).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid rate values" });

  const { cpmTextCents, cpmCardCents, cpmBannerCents } = parsed.data;
  if (cpmTextCents === undefined && cpmCardCents === undefined && cpmBannerCents === undefined) {
    return res.status(400).json({ error: "Provide at least one rate to update" });
  }

  try {
    const upserts: Promise<any>[] = [];
    if (cpmTextCents !== undefined) {
      upserts.push(
        prisma.platformSettings.upsert({
          where: { key: CPM_TEXT_KEY },
          update: { value: String(cpmTextCents) },
          create: { key: CPM_TEXT_KEY, value: String(cpmTextCents) },
        }),
      );
    }
    if (cpmCardCents !== undefined) {
      upserts.push(
        prisma.platformSettings.upsert({
          where: { key: CPM_CARD_KEY },
          update: { value: String(cpmCardCents) },
          create: { key: CPM_CARD_KEY, value: String(cpmCardCents) },
        }),
      );
    }
    if (cpmBannerCents !== undefined) {
      upserts.push(
        prisma.platformSettings.upsert({
          where: { key: CPM_BANNER_KEY },
          update: { value: String(cpmBannerCents) },
          create: { key: CPM_BANNER_KEY, value: String(cpmBannerCents) },
        }),
      );
    }
    await Promise.all(upserts);

    await logAudit({
      action: "RATE_TABLE_UPDATE",
      actorUserId: (req as any).portalUser?.id,
      resourceType: "platform_settings",
      after: { cpmTextCents, cpmCardCents, cpmBannerCents },
      req,
    });

    return res.json({
      cpmTextCents:   cpmTextCents   ?? DEFAULT_CPM_TEXT,
      cpmCardCents:   cpmCardCents   ?? DEFAULT_CPM_CARD,
      cpmBannerCents: cpmBannerCents ?? DEFAULT_CPM_BANNER,
    });
  } catch (err) {
    logger.error("Update CPM rates error", err);
    return res.status(500).json({ error: "Failed to update CPM rates" });
  }
});

router.put("/platform-settings/paypal", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  const parsed = z
    .object({
      clientId: z.string().trim().min(1).max(500).optional(),
      clientSecret: z.string().trim().min(1).max(500).optional(),
      mode: z.enum(["sandbox", "live"]).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid PayPal settings" });

  const { clientId, clientSecret, mode } = parsed.data;
  if (!clientId && !clientSecret && !mode) {
    return res.status(400).json({ error: "Provide at least one field to update" });
  }

  try {
    const upserts: Promise<any>[] = [];
    if (clientId !== undefined) {
      upserts.push(
        prisma.platformSettings.upsert({
          where: { key: PAYPAL_CLIENT_ID_KEY },
          update: { value: clientId },
          create: { key: PAYPAL_CLIENT_ID_KEY, value: clientId },
        }),
      );
    }
    if (clientSecret !== undefined) {
      upserts.push(
        prisma.platformSettings.upsert({
          where: { key: PAYPAL_CLIENT_SECRET_KEY },
          update: { value: clientSecret },
          create: { key: PAYPAL_CLIENT_SECRET_KEY, value: clientSecret },
        }),
      );
    }
    if (mode !== undefined) {
      upserts.push(
        prisma.platformSettings.upsert({
          where: { key: PAYPAL_MODE_KEY },
          update: { value: mode },
          create: { key: PAYPAL_MODE_KEY, value: mode },
        }),
      );
    }
    await Promise.all(upserts);
    await logAudit({
      action: "PAYPAL_CONFIG_UPDATE",
      actorUserId: (req as any).portalUser?.id,
      resourceType: "platform_settings",
      after: { clientIdUpdated: clientId !== undefined, secretUpdated: clientSecret !== undefined, modeUpdated: mode !== undefined, mode },
      req,
    });
    return res.json({ ok: true });
  } catch (err) {
    logger.error("Update PayPal config error", err);
    return res.status(500).json({ error: "Failed to update PayPal config" });
  }
});

router.post("/platform-settings/paypal/test", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  try {
    const cfg = await getPayPalConfig();
    if (!cfg.enabled) {
      return res.status(400).json({ ok: false, error: "No PayPal credentials configured" });
    }
    await getPayPalToken(cfg);
    return res.json({ ok: true, mode: cfg.mode });
  } catch (err) {
    logger.error("PayPal connection test failed", err);
    return res.status(200).json({ ok: false, error: "Authentication failed — check your Client ID and Secret" });
  }
});

router.put("/platform-settings/fee", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  const parsed = z.object({ platformFeePct: z.number().min(0).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Fee must be between 0 and 100" });

  try {
    const oldFeePct = await getPlatformFeePct();
    await prisma.platformSettings.upsert({
      where: { key: PLATFORM_FEE_KEY },
      update: { value: String(parsed.data.platformFeePct) },
      create: { key: PLATFORM_FEE_KEY, value: String(parsed.data.platformFeePct) },
    });
    await logAudit({
      action: "PLATFORM_FEE_UPDATE",
      actorUserId: (req as any).portalUser?.id,
      resourceType: "platform_settings",
      before: { platformFeePct: oldFeePct },
      after: { platformFeePct: parsed.data.platformFeePct },
      req,
    });
    return res.json({ ok: true, platformFeePct: parsed.data.platformFeePct });
  } catch (err) {
    logger.error("Update fee error", err);
    return res.status(500).json({ error: "Failed to update fee" });
  }
});

router.get("/wallet-transactions", requirePortalUser, requireAdminPortalUser, async (_req: Request, res: Response) => {
  try {
    const transactions = await prisma.walletTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { organization: { select: { id: true, name: true, type: true } } },
    });
    return res.json(transactions);
  } catch (err) {
    logger.error("Admin wallet transactions error", err);
    return res.status(500).json({ error: "Failed to fetch wallet transactions" });
  }
});

router.get("/payout-requests", requirePortalUser, requireAdminPortalUser, async (_req: Request, res: Response) => {
  try {
    const payouts = await prisma.payoutRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { organization: { select: { id: true, name: true } } },
    });
    return res.json(payouts);
  } catch (err) {
    logger.error("Admin payout requests error", err);
    return res.status(500).json({ error: "Failed to fetch payout requests" });
  }
});

router.post("/payout-requests/:id/process", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  const cfg = await getPayPalConfig();
  if (!cfg.enabled) return res.status(503).json({ error: "PayPal not configured on this server" });

  try {
    const payoutReq = await prisma.payoutRequest.findUnique({ where: { id: req.params.id } });
    if (!payoutReq) return res.status(404).json({ error: "Payout request not found" });
    if (payoutReq.status !== "pending") {
      return res.status(400).json({ error: "Only pending requests can be processed" });
    }

    await enqueuePayoutProcess(payoutReq.id);

    return res.json({ ok: true });
  } catch (err) {
    logger.error("Admin process payout error", err);
    return res.status(500).json({ error: "PayPal payout failed" });
  }
});

router.put("/payout-requests/:id/status", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  const parsed = z.object({ status: z.enum(["pending", "processing", "paid", "failed"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid status value" });

  try {
    const payoutReq = await prisma.payoutRequest.findUnique({ where: { id: req.params.id } });
    if (!payoutReq) return res.status(404).json({ error: "Payout request not found" });

    await prisma.payoutRequest.update({
      where: { id: payoutReq.id },
      data: {
        status: parsed.data.status,
        processedAt:
          parsed.data.status === "paid" && !payoutReq.processedAt ? new Date() : payoutReq.processedAt,
      },
    });
    await logAudit({
      action: "PAYOUT_STATUS_UPDATE",
      actorUserId: (req as any).portalUser?.id,
      organizationId: payoutReq.organizationId,
      resourceId: payoutReq.id,
      resourceType: "payout_request",
      before: { status: payoutReq.status },
      after: { status: parsed.data.status },
      req,
    });

    return res.json({ ok: true });
  } catch (err) {
    logger.error("Admin update payout status error", err);
    return res.status(500).json({ error: "Failed to update payout status" });
  }
});

// ─── Blog admin CRUD routes ───────────────────────────────────────────────────

// GET /api/admin/portal/blog — list all posts including drafts
router.get("/portal/blog", requirePortalUser, requireAdminPortalUser, async (_req: Request, res: Response) => {
  try {
    const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
    return res.json(posts);
  } catch (err) {
    logger.error("Blog list (admin) failed", err);
    return res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// POST /api/admin/portal/blog — create a new post
router.post("/portal/blog", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  const parsed = blogPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid post data", details: parsed.error.flatten() });

  try {
    const slug = parsed.data.slug || toSlug(parsed.data.title);
    const post = await prisma.blogPost.create({
      data: {
        title:       parsed.data.title,
        slug,
        excerpt:     parsed.data.excerpt,
        body:        parsed.data.body,
        category:    parsed.data.category,
        readingTime: parsed.data.readingTime,
      },
    });
    await logAudit({
      action: "BLOG_POST_CREATE",
      actorUserId: (req as any).portalUser?.id,
      resourceId: post.id,
      resourceType: "blog_post",
      after: { title: post.title, slug: post.slug },
      req,
    });
    return res.status(201).json(post);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "A post with that slug already exists" });
    logger.error("Blog create failed", err);
    return res.status(500).json({ error: "Failed to create blog post" });
  }
});

// PUT /api/admin/portal/blog/:id — update an existing post
router.put("/portal/blog/:id", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  const parsed = blogPostSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid post data", details: parsed.error.flatten() });

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Post not found" });

    const updateData: Record<string, any> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.slug !== undefined) updateData.slug = parsed.data.slug;
    if (parsed.data.excerpt !== undefined) updateData.excerpt = parsed.data.excerpt;
    if (parsed.data.body !== undefined) updateData.body = parsed.data.body;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.readingTime !== undefined) updateData.readingTime = parsed.data.readingTime;

    const post = await prisma.blogPost.update({ where: { id: req.params.id }, data: updateData });
    await logAudit({
      action: "BLOG_POST_UPDATE",
      actorUserId: (req as any).portalUser?.id,
      resourceId: post.id,
      resourceType: "blog_post",
      before: { title: existing.title, slug: existing.slug },
      after: { title: post.title, slug: post.slug },
      req,
    });
    return res.json(post);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "A post with that slug already exists" });
    logger.error("Blog update failed", err);
    return res.status(500).json({ error: "Failed to update blog post" });
  }
});

// DELETE /api/admin/portal/blog/:id — hard delete
router.delete("/portal/blog/:id", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Post not found" });

    await prisma.blogPost.delete({ where: { id: req.params.id } });
    await logAudit({
      action: "BLOG_POST_DELETE",
      actorUserId: (req as any).portalUser?.id,
      resourceId: req.params.id,
      resourceType: "blog_post",
      before: { title: existing.title, slug: existing.slug, published: existing.published },
      req,
    });
    return res.json({ ok: true });
  } catch (err) {
    logger.error("Blog delete failed", err);
    return res.status(500).json({ error: "Failed to delete blog post" });
  }
});

// POST /api/admin/portal/blog/:id/publish — toggle published state
router.post("/portal/blog/:id/publish", requirePortalUser, requireAdminPortalUser, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Post not found" });

    const nextPublished = !existing.published;
    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        published: nextPublished,
        publishedAt: nextPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });
    await logAudit({
      action: "BLOG_POST_PUBLISH",
      actorUserId: (req as any).portalUser?.id,
      resourceId: post.id,
      resourceType: "blog_post",
      before: { published: existing.published },
      after: { published: post.published, publishedAt: post.publishedAt },
      req,
    });
    return res.json(post);
  } catch (err) {
    logger.error("Blog publish toggle failed", err);
    return res.status(500).json({ error: "Failed to toggle publish state" });
  }
});

// POST /api/admin/portal/blog/:id/image — upload a cover image (multipart/form-data, field: image)
router.post(
  "/portal/blog/:id/image",
  requirePortalUser,
  requireAdminPortalUser,
  uploadBlogImage.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No image file provided" });

      const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
      if (!existing) return res.status(404).json({ error: "Post not found" });

      const imageUrl = `/uploads/blog/${req.file.filename}`;
      await prisma.blogPost.update({ where: { id: req.params.id }, data: { imageUrl } });
      return res.json({ imageUrl });
    } catch (err) {
      logger.error("Blog image upload failed", err);
      return res.status(500).json({ error: "Failed to upload image" });
    }
  },
);

// ─── Legacy admin key routes (for SDK/CLI access) ─────────────────────────────

router.get("/overview", requireAdminKey, async (_req: Request, res: Response) => {
  try {
    const [totalAds, activeAds, totalEvents, totalLeads] = await Promise.all([
      prisma.ad.count(),
      prisma.ad.count({ where: { isActive: true } }),
      prisma.adEvent.count(),
      prisma.lead.count(),
    ]);
    return res.json({ totalAds, activeAds, totalEvents, totalLeads });
  } catch (err) {
    logger.error("Overview fetch failed", err);
    return res.status(500).json({ error: "Failed to fetch overview" });
  }
});

router.get("/ads", requireAdminKey, async (_req: Request, res: Response) => {
  try {
    const ads = await prisma.ad.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
    return res.json(ads);
  } catch (err) {
    logger.error("Ad list failed", err);
    return res.status(500).json({ error: "Failed to fetch ads" });
  }
});

router.post("/ads", requireAdminKey, async (req: Request, res: Response) => {
  const parsed = adminCreateAdSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid ad payload", details: parsed.error.flatten() });
  }

  try {
    if (parsed.data.imageUrl) {
      try {
        await validateImageUrl(parsed.data.imageUrl);
      } catch (imgErr: any) {
        return res.status(400).json({ error: `Image validation failed: ${imgErr.message}` });
      }
    }
    const ad = await prisma.ad.create({ data: parsed.data });
    return res.status(201).json(ad);
  } catch (err) {
    logger.error("Ad create failed", err);
    return res.status(500).json({ error: "Failed to create ad" });
  }
});

router.patch("/ads/:id", requireAdminKey, async (req: Request, res: Response) => {
  const parsed = adminUpdateAdSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid ad update payload", details: parsed.error.flatten() });
  }

  try {
    const ad = await prisma.ad.update({ where: { id: req.params.id }, data: parsed.data });
    return res.json(ad);
  } catch (err) {
    logger.error("Ad update failed", err);
    return res.status(500).json({ error: "Failed to update ad" });
  }
});

router.get("/events", requireAdminKey, async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 100);
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 300) : 100;

  try {
    const events = await prisma.adEvent.findMany({
      orderBy: { createdAt: "desc" },
      include: { ad: { select: { id: true, title: true, advertiser: true } } },
      take,
    });
    return res.json(events);
  } catch (err) {
    logger.error("Event list failed", err);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.get("/leads", requireAdminKey, async (_req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return res.json(leads);
  } catch (err) {
    logger.error("Lead list failed", err);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

export default router;
