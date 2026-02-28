import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { adminCreateAdSchema, adminUpdateAdSchema, leadSchema } from "../schemas.js";
import { requirePortalUser, requireAdminPortalUser, requireAdminKey } from "../portal.js";
import {
  getPayPalConfig,
  sendPayPalPayout,
  getPlatformFeePct,
  PAYPAL_CLIENT_ID_KEY,
  PAYPAL_CLIENT_SECRET_KEY,
  PAYPAL_MODE_KEY,
  PLATFORM_FEE_KEY,
} from "../paypal.js";
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

const router = express.Router();

// ─── Portal admin routes (Supabase auth + admin workspace) ────────────────────

router.get("/portal/overview", requirePortalUser, requireAdminPortalUser, async (_req, res) => {
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

router.get("/portal/ads/review", requirePortalUser, requireAdminPortalUser, async (_req, res) => {
  try {
    const pending = await prisma.ad.findMany({
      where: { isActive: false },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const active = await prisma.ad.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return res.json({ pending, active });
  } catch (err) {
    logger.error("Admin ad review list failed", err);
    return res.status(500).json({ error: "Failed to load ad review queue" });
  }
});

router.post("/portal/ads/:id/approve", requirePortalUser, requireAdminPortalUser, async (req, res) => {
  try {
    const ad = await prisma.ad.findUnique({ where: { id: req.params.id } });
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    await prisma.ad.update({ where: { id: req.params.id }, data: { isActive: true } });
    await logAudit({
      action: "AD_APPROVE",
      actorUserId: req.portalUser?.id,
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

router.post("/portal/ads/:id/reject", requirePortalUser, requireAdminPortalUser, async (req, res) => {
  try {
    const ad = await prisma.ad.findUnique({ where: { id: req.params.id } });
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    // Soft-delete for audit trail: rejected ads are kept but marked deleted + inactive
    await prisma.ad.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), isActive: false } });
    await logAudit({
      action: "AD_REJECT",
      actorUserId: req.portalUser?.id,
      resourceId: req.params.id,
      resourceType: "ad",
      before: { isActive: true },
      after: { isActive: false, deletedAt: new Date().toISOString() },
      req,
    });
    return res.json({ ok: true });
  } catch (err) {
    logger.error("Ad reject failed", err);
    return res.status(500).json({ error: "Failed to reject ad" });
  }
});

router.get("/platform-settings", requirePortalUser, requireAdminPortalUser, async (_req, res) => {
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

router.put("/platform-settings/rates", requirePortalUser, requireAdminPortalUser, async (req, res) => {
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
    const upserts = [];
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
      actorUserId: req.portalUser?.id,
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

router.put("/platform-settings/paypal", requirePortalUser, requireAdminPortalUser, async (req, res) => {
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
    const upserts = [];
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
      actorUserId: req.portalUser?.id,
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

router.put("/platform-settings/fee", requirePortalUser, requireAdminPortalUser, async (req, res) => {
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
      actorUserId: req.portalUser?.id,
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

router.get("/wallet-transactions", requirePortalUser, requireAdminPortalUser, async (_req, res) => {
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

router.get("/payout-requests", requirePortalUser, requireAdminPortalUser, async (_req, res) => {
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

router.post("/payout-requests/:id/process", requirePortalUser, requireAdminPortalUser, async (req, res) => {
  const cfg = await getPayPalConfig();
  if (!cfg.enabled) return res.status(503).json({ error: "PayPal not configured on this server" });

  try {
    const payoutReq = await prisma.payoutRequest.findUnique({ where: { id: req.params.id } });
    if (!payoutReq) return res.status(404).json({ error: "Payout request not found" });
    if (payoutReq.status !== "pending") {
      return res.status(400).json({ error: "Only pending requests can be processed" });
    }

    const senderItemId = `admin_${payoutReq.id}`;
    const paypalResult = await sendPayPalPayout({
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
      actorUserId: req.portalUser?.id,
      organizationId: payoutReq.organizationId,
      resourceId: payoutReq.id,
      resourceType: "payout_request",
      before: { status: "pending" },
      after: { status: "processing" },
      req,
    });

    return res.json({ ok: true });
  } catch (err) {
    logger.error("Admin process payout error", err);
    return res.status(500).json({ error: "PayPal payout failed" });
  }
});

router.put("/payout-requests/:id/status", requirePortalUser, requireAdminPortalUser, async (req, res) => {
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
      actorUserId: req.portalUser?.id,
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

// ─── Legacy admin key routes (for SDK/CLI access) ─────────────────────────────

router.get("/overview", requireAdminKey, async (_req, res) => {
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

router.get("/ads", requireAdminKey, async (_req, res) => {
  try {
    const ads = await prisma.ad.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
    return res.json(ads);
  } catch (err) {
    logger.error("Ad list failed", err);
    return res.status(500).json({ error: "Failed to fetch ads" });
  }
});

router.post("/ads", requireAdminKey, async (req, res) => {
  const parsed = adminCreateAdSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid ad payload", details: parsed.error.flatten() });
  }

  try {
    if (parsed.data.imageUrl) {
      try {
        await validateImageUrl(parsed.data.imageUrl);
      } catch (imgErr) {
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

router.patch("/ads/:id", requireAdminKey, async (req, res) => {
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

router.get("/events", requireAdminKey, async (req, res) => {
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

router.get("/leads", requireAdminKey, async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return res.json(leads);
  } catch (err) {
    logger.error("Lead list failed", err);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

export default router;
