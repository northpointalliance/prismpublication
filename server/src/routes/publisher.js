import express from "express";
import { prisma } from "../db.js";
import {
  publisherBotCreateSchema,
  publisherBotUpdateSchema,
  publisherCreateSdkKeySchema,
} from "../schemas.js";
import { requirePortalUser, requirePublisherWorkspace } from "../portal.js";
import { createPublisherSdkKey, toPublicSdkKey, summarizeBotMetrics, createBotPublicId } from "../helpers.js";
import { seedWorkspaceMockData } from "../seed.js";
import { logger } from "../logger.js";

const router = express.Router();

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get("/dashboard", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Bot developer workspace required" });

    await seedWorkspaceMockData({ organization: workspace.organization });

    const bots = await prisma.publisherBot.findMany({
      where: { organizationId: workspace.organization.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        sdkKeys: {
          where: { revokedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, label: true, prefix: true, last4: true, createdAt: true, revokedAt: true },
        },
      },
    });

    const botIds = bots.map((bot) => bot.publicId);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const events = botIds.length
      ? await prisma.adEvent.findMany({
          where: { botId: { in: botIds }, createdAt: { gte: sevenDaysAgo } },
          orderBy: { createdAt: "desc" },
          select: { botId: true, eventType: true, amount: true, createdAt: true, metadata: true },
          take: 3000,
        })
      : [];

    const eventsByBotId = new Map();
    for (const event of events) {
      if (!eventsByBotId.has(event.botId)) eventsByBotId.set(event.botId, []);
      eventsByBotId.get(event.botId).push(event);
    }

    const payloadBots = bots.map((bot) => {
      const botEvents = eventsByBotId.get(bot.publicId) || [];
      const metrics = summarizeBotMetrics(botEvents, bot);
      const newestKey = bot.sdkKeys[0] || null;
      return {
        id: bot.id,
        botId: bot.publicId,
        name: bot.name,
        environment: bot.environment,
        health: bot.health,
        requests7d: metrics.requests7d,
        fillRate7d: metrics.fillRate7d,
        revenueTodayCents: metrics.revenueTodayCents,
        sdkErrors: metrics.sdkErrors,
        isActive: bot.isActive,
        activeKeyCount: bot.sdkKeys.length,
        lastKeyPrefix: newestKey?.prefix || null,
        lastKeyCreatedAt: newestKey?.createdAt || null,
      };
    });

    const totalRequests = payloadBots.reduce((acc, bot) => acc + bot.requests7d, 0);
    const weightedFillRate =
      totalRequests > 0
        ? payloadBots.reduce((acc, bot) => acc + bot.fillRate7d * bot.requests7d, 0) / totalRequests
        : 0;
    const revenueTodayCents = payloadBots.reduce((acc, bot) => acc + bot.revenueTodayCents, 0);
    const sdkErrors = payloadBots.reduce((acc, bot) => acc + bot.sdkErrors, 0);

    return res.json({
      summary: { registeredBots: payloadBots.length, fillRate7d: weightedFillRate, revenueTodayCents, sdkErrors },
      bots: payloadBots,
    });
  } catch (err) {
    logger.error("Publisher dashboard failed", err);
    return res.status(500).json({ error: "Failed to load publisher dashboard" });
  }
});

// ─── Bots ─────────────────────────────────────────────────────────────────────

router.get("/bots", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Bot developer workspace required" });

    await seedWorkspaceMockData({ organization: workspace.organization });

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const cursor = req.query.cursor || undefined;

    const bots = await prisma.publisherBot.findMany({
      where: { organizationId: workspace.organization.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sdkKeys: {
          orderBy: { createdAt: "desc" },
          select: { id: true, label: true, prefix: true, last4: true, createdAt: true, revokedAt: true },
        },
      },
    });

    const hasMore = bots.length > limit;
    const pageBots = hasMore ? bots.slice(0, limit) : bots;
    const nextCursor = hasMore ? pageBots[pageBots.length - 1].id : null;

    return res.json({
      items: pageBots.map((bot) => ({
        id: bot.id,
        botId: bot.publicId,
        name: bot.name,
        environment: bot.environment,
        health: bot.health,
        isActive: bot.isActive,
        requests7dHint: bot.requests7d,
        fillRateHint: bot.fillRateHint,
        sdkErrorsHint: bot.sdkErrorsHint,
        sdkKeys: bot.sdkKeys.map((key) => toPublicSdkKey(key)),
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt,
      })),
      nextCursor,
      hasMore,
    });
  } catch (err) {
    logger.error("Publisher bot list failed", err);
    return res.status(500).json({ error: "Failed to fetch bots" });
  }
});

router.post("/bots", requirePortalUser, async (req, res) => {
  const parsed = publisherBotCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid bot payload", details: parsed.error.flatten() });
  }

  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Bot developer workspace required" });

    const bot = await prisma.publisherBot.create({
      data: {
        organizationId: workspace.organization.id,
        name: parsed.data.name,
        publicId: createBotPublicId({ organizationId: workspace.organization.id, name: parsed.data.name }),
        environment: parsed.data.environment,
        health: parsed.data.health,
        placementPolicy: parsed.data.placementPolicy,
      },
    });

    const initialSdkKey = await createPublisherSdkKey({ botId: bot.id, label: "Primary" });
    return res.status(201).json({
      bot: { id: bot.id, botId: bot.publicId, name: bot.name, environment: bot.environment, health: bot.health, isActive: bot.isActive },
      initialSdkKey,
    });
  } catch (err) {
    logger.error("Publisher bot create failed", err);
    return res.status(500).json({ error: "Failed to create bot" });
  }
});

router.patch("/bots/:id", requirePortalUser, async (req, res) => {
  const parsed = publisherBotUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid bot update payload", details: parsed.error.flatten() });
  }

  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Bot developer workspace required" });

    const existing = await prisma.publisherBot.findFirst({
      where: { id: req.params.id, organizationId: workspace.organization.id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: "Bot not found" });

    const updated = await prisma.publisherBot.update({ where: { id: existing.id }, data: parsed.data });
    return res.json(updated);
  } catch (err) {
    logger.error("Publisher bot update failed", err);
    return res.status(500).json({ error: "Failed to update bot" });
  }
});

router.delete("/bots/:id", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Bot developer workspace required" });

    const existing = await prisma.publisherBot.findFirst({
      where: { id: req.params.id, organizationId: workspace.organization.id, deletedAt: null },
      select: { id: true, name: true, publicId: true },
    });
    if (!existing) return res.status(404).json({ error: "Bot not found" });

    await prisma.publisherBot.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return res.json({ success: true, deleted: { id: existing.id, name: existing.name, botId: existing.publicId } });
  } catch (err) {
    logger.error("Publisher bot delete failed", err);
    return res.status(500).json({ error: "Failed to delete bot" });
  }
});

router.post("/bots/:id/keys", requirePortalUser, async (req, res) => {
  const parsed = publisherCreateSdkKeySchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid key payload", details: parsed.error.flatten() });
  }

  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Bot developer workspace required" });

    const bot = await prisma.publisherBot.findFirst({
      where: { id: req.params.id, organizationId: workspace.organization.id, deletedAt: null },
      select: { id: true, publicId: true, name: true },
    });
    if (!bot) return res.status(404).json({ error: "Bot not found" });

    const key = await createPublisherSdkKey({ botId: bot.id, label: parsed.data.label, revokeExisting: true });
    return res.status(201).json({ botId: bot.publicId, key });
  } catch (err) {
    logger.error("Publisher key create failed", err);
    return res.status(500).json({ error: "Failed to create SDK key" });
  }
});

router.get("/bots/:id/metrics", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) return res.status(403).json({ error: "Bot developer workspace required" });

    const bot = await prisma.publisherBot.findFirst({
      where: { id: req.params.id, organizationId: workspace.organization.id, deletedAt: null },
      select: { id: true, publicId: true, name: true, requests7d: true, fillRateHint: true, sdkErrorsHint: true },
    });
    if (!bot) return res.status(404).json({ error: "Bot not found" });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const events = await prisma.adEvent.findMany({
      where: { botId: bot.publicId, createdAt: { gte: sevenDaysAgo } },
      select: { eventType: true, amount: true, createdAt: true, metadata: true },
      orderBy: { createdAt: "desc" },
      take: 1200,
    });

    const metrics = summarizeBotMetrics(events, bot);
    return res.json({
      bot: { id: bot.id, botId: bot.publicId, name: bot.name },
      metrics: {
        requests7d: metrics.requests7d,
        fillRate7d: metrics.fillRate7d,
        revenueTodayCents: metrics.revenueTodayCents,
        sdkErrors: metrics.sdkErrors,
        impressions7d: metrics.impressions,
        clicks7d: metrics.clicks,
      },
    });
  } catch (err) {
    logger.error("Publisher bot metrics failed", err);
    return res.status(500).json({ error: "Failed to fetch bot metrics" });
  }
});

export default router;
