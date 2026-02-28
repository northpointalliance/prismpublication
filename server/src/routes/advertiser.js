import express from "express";
import { prisma } from "../db.js";
import { advertiserCampaignCreateSchema, advertiserCampaignUpdateSchema } from "../schemas.js";
import { requirePortalUser, requireAdvertiserWorkspace } from "../portal.js";
import { seedWorkspaceMockData } from "../seed.js";
import { logger } from "../logger.js";
import { validateImageUrl } from "../image-validation.js";

const router = express.Router();

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get("/dashboard", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Advertiser workspace required" });

    await seedWorkspaceMockData({ organization: workspace.organization });

    const advertiserKey = `org:${workspace.organization.id}`;
    const campaigns = await prisma.ad.findMany({
      where: { advertiser: advertiserKey, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const campaignIds = campaigns.map((c) => c.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const events = campaignIds.length
      ? await prisma.adEvent.findMany({
          where: { adId: { in: campaignIds }, createdAt: { gte: sevenDaysAgo } },
          select: { adId: true, eventType: true, amount: true, createdAt: true },
        })
      : [];

    const statsByCampaignId = new Map();
    let totalImpressions = 0;
    let totalClicks = 0;
    let spendTodayCents = 0;

    for (const event of events) {
      const key = event.adId || "";
      if (!statsByCampaignId.has(key)) {
        statsByCampaignId.set(key, { impressions: 0, clicks: 0, spendCents: 0 });
      }
      const current = statsByCampaignId.get(key);
      if (event.eventType === "impression") { current.impressions += 1; totalImpressions += 1; }
      if (event.eventType === "click") { current.clicks += 1; totalClicks += 1; }
      if (event.eventType === "revenue") {
        const value = Math.max(Number(event.amount || 0), 0);
        current.spendCents += value;
        if (event.createdAt >= todayStart) spendTodayCents += value;
      }
    }

    const payloadCampaigns = campaigns.map((campaign) => {
      const stats = statsByCampaignId.get(campaign.id) || { impressions: 0, clicks: 0, spendCents: 0 };
      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.isActive ? "Live" : "Review",
        format: campaign.format,
        weight: campaign.weight,
        impressions7d: stats.impressions,
        clicks7d: stats.clicks,
        ctr7d: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
        spend7dCents: stats.spendCents,
      };
    });

    const ctr7d = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const pendingReview = payloadCampaigns.filter((c) => c.status === "Review").length;
    const activeCampaigns = payloadCampaigns.filter((c) => c.status === "Live").length;

    return res.json({
      summary: { activeCampaigns, pendingReview, spendTodayCents, ctr7d },
      campaigns: payloadCampaigns,
    });
  } catch (err) {
    logger.error("Advertiser dashboard failed", err);
    return res.status(500).json({ error: "Failed to load advertiser dashboard" });
  }
});

// ─── Campaigns ────────────────────────────────────────────────────────────────

router.get("/campaigns", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Advertiser workspace required" });

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const cursor = req.query.cursor || undefined;

    const advertiserKey = `org:${workspace.organization.id}`;
    const campaigns = await prisma.ad.findMany({
      where: { advertiser: advertiserKey, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = campaigns.length > limit;
    const items = hasMore ? campaigns.slice(0, limit) : campaigns;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return res.json({ items, nextCursor, hasMore });
  } catch (err) {
    logger.error("Advertiser campaign list failed", err);
    return res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

router.post("/campaigns", requirePortalUser, async (req, res) => {
  const parsed = advertiserCampaignCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid campaign payload", details: parsed.error.flatten() });
  }

  try {
    if (parsed.data.imageUrl) {
      try {
        await validateImageUrl(parsed.data.imageUrl);
      } catch (imgErr) {
        return res.status(400).json({ error: `Image validation failed: ${imgErr.message}` });
      }
    }

    const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Advertiser workspace required" });

    const advertiserKey = `org:${workspace.organization.id}`;
    const endsAt = parsed.data.durationDays
      ? new Date(Date.now() + parsed.data.durationDays * 86_400_000)
      : undefined;

    const campaign = await prisma.ad.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        ctaText: parsed.data.ctaText,
        clickUrl: parsed.data.clickUrl,
        imageUrl: parsed.data.imageUrl,
        advertiser: advertiserKey,
        topics: parsed.data.topics,
        format: parsed.data.format,
        weight: parsed.data.weight,
        isActive: parsed.data.isActive ?? false,
        dailyBudgetCents: parsed.data.dailyBudgetCents,
        lifetimeBudgetCents: parsed.data.lifetimeBudgetCents,
        endsAt,
      },
    });
    return res.status(201).json(campaign);
  } catch (err) {
    logger.error("Advertiser campaign create failed", err);
    return res.status(500).json({ error: "Failed to create campaign" });
  }
});

router.patch("/campaigns/:id", requirePortalUser, async (req, res) => {
  const parsed = advertiserCampaignUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid campaign update payload", details: parsed.error.flatten() });
  }

  try {
    if (parsed.data.imageUrl) {
      try {
        await validateImageUrl(parsed.data.imageUrl);
      } catch (imgErr) {
        return res.status(400).json({ error: `Image validation failed: ${imgErr.message}` });
      }
    }

    const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Advertiser workspace required" });

    const advertiserKey = `org:${workspace.organization.id}`;
    const existing = await prisma.ad.findFirst({
      where: { id: req.params.id, advertiser: advertiserKey, deletedAt: null },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Campaign not found" });

    const updateData = { ...parsed.data };
    if (parsed.data.durationDays !== undefined) {
      updateData.endsAt = new Date(Date.now() + parsed.data.durationDays * 86_400_000);
    }
    delete updateData.durationDays;

    const campaign = await prisma.ad.update({ where: { id: existing.id }, data: updateData });
    return res.json(campaign);
  } catch (err) {
    logger.error("Advertiser campaign update failed", err);
    return res.status(500).json({ error: "Failed to update campaign" });
  }
});

router.delete("/campaigns/:id", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Advertiser workspace required" });

    const advertiserKey = `org:${workspace.organization.id}`;
    const existing = await prisma.ad.findFirst({
      where: { id: req.params.id, advertiser: advertiserKey, deletedAt: null },
      select: { id: true, title: true },
    });

    if (!existing) return res.status(404).json({ error: "Campaign not found" });

    await prisma.ad.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return res.json({ success: true, deleted: { id: existing.id, title: existing.title } });
  } catch (err) {
    logger.error("Advertiser campaign delete failed", err);
    return res.status(500).json({ error: "Failed to delete campaign" });
  }
});

export default router;
