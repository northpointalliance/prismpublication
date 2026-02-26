import "dotenv/config";
import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();

const port = Number(process.env.PORT || 8787);
const corsOrigin = process.env.API_CORS_ORIGIN || "http://localhost:8080";
const sdkApiKey = process.env.BOTGRID_API_KEY || "local-demo-key";
const adminApiKey = process.env.ADMIN_API_KEY || "local-admin-key";

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
app.use(express.json());

const leadSchema = z.object({
  role: z.enum(["publisher", "advertiser", "demo", "general"]).default("general"),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  company: z.string().trim().max(160).optional(),
  message: z.string().trim().max(4000).optional(),
  source: z.string().trim().max(120).optional(),
});

const adRequestSchema = z.object({
  botId: z.string().trim().min(2).max(120),
  context: z
    .object({
      topic: z.string().trim().max(120).optional(),
      userId: z.string().trim().max(120).optional(),
    })
    .passthrough()
    .optional()
    .default({}),
  position: z.enum(["inline", "sidebar", "floating"]).default("inline"),
  format: z.enum(["text", "card", "banner"]).default("card"),
});

const trackEventSchema = z.object({
  adId: z.string().trim().min(3).max(120),
  userId: z.string().trim().max(120).optional(),
  botId: z.string().trim().min(2).max(120),
  timestamp: z.number().int().optional(),
  amount: z.number().int().nonnegative().optional(),
  topic: z.string().trim().max(120).optional(),
  metadata: z.record(z.any()).optional(),
});

const adminCreateAdSchema = z.object({
  title: z.string().trim().min(4).max(140),
  description: z.string().trim().min(8).max(400),
  ctaText: z.string().trim().min(2).max(60),
  clickUrl: z.string().trim().url().max(500),
  advertiser: z.string().trim().min(2).max(120),
  imageUrl: z.string().trim().url().max(500).optional(),
  topics: z.array(z.string().trim().min(1).max(60)).default([]),
  format: z.enum(["text", "card", "banner"]).default("card"),
  weight: z.number().int().min(1).max(100).default(1),
  isActive: z.boolean().default(true),
});

const adminUpdateAdSchema = adminCreateAdSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required",
);

const syncUserSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(120).optional(),
});

const selectWorkspaceSchema = z.object({
  workspaceId: z.string().trim().min(3).max(120),
});

const createWorkspaceSchema = z.object({
  type: z.enum(["advertiser", "publisher"]),
  name: z.string().trim().min(2).max(120).optional(),
});

const getBearerToken = (authorizationHeader = "") =>
  authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7).trim() : "";

const requireSdkKey = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token || token !== sdkApiKey) {
    return res.status(401).json({ error: "Unauthorized SDK key" });
  }
  return next();
};

const requireAdminKey = (req, res, next) => {
  const suppliedKey = String(req.headers["x-admin-key"] || "");
  if (!suppliedKey || suppliedKey !== adminApiKey) {
    return res.status(401).json({ error: "Unauthorized admin key" });
  }
  return next();
};

const normalizeTopic = (value = "") => value.toLowerCase().trim();

const weightedPick = (items) => {
  if (!items.length) return null;
  const totalWeight = items.reduce((acc, item) => acc + Math.max(item.weight || 1, 1), 0);
  let cursor = Math.random() * totalWeight;
  for (const item of items) {
    cursor -= Math.max(item.weight || 1, 1);
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
};

const toSdkAd = (ad) => ({
  id: ad.id,
  title: ad.title,
  description: ad.description,
  ctaText: ad.ctaText,
  clickUrl: ad.clickUrl,
  imageUrl: ad.imageUrl || undefined,
  advertiser: ad.advertiser,
  tags: ad.topics || [],
});

const roleToWorkspaceCopy = {
  advertiser: {
    title: "Advertiser",
    description: "Create campaigns, upload creatives, and manage budget controls.",
  },
  publisher: {
    title: "Bot Developer",
    description: "Manage bots, SDK keys, placements, and monetization performance.",
  },
  admin: {
    title: "Platform Admin",
    description: "Operate moderation, risk, finance, and platform-wide controls.",
  },
};

const mapMembershipRoleToPortalRole = (role) => {
  if (role.startsWith("advertiser_")) return "advertiser";
  if (role.startsWith("publisher_")) return "publisher";
  return "admin";
};

const readUserEmail = (req) =>
  String(req.headers["x-user-email"] || req.query.email || "").trim().toLowerCase();

const buildEntryContextByUserId = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });

  if (!user) return null;

  const workspaces = user.memberships.map((membership) => {
    const role = mapMembershipRoleToPortalRole(membership.role);
    const copy = roleToWorkspaceCopy[role];
    return {
      id: membership.organization.id,
      orgId: membership.organization.id,
      role,
      title: copy.title,
      description: copy.description,
    };
  });

  const defaultWorkspaceId =
    user.defaultOrganizationId && workspaces.some((item) => item.orgId === user.defaultOrganizationId)
      ? user.defaultOrganizationId
      : workspaces[0]?.orgId || null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    workspaces,
    defaultWorkspaceId,
  };
};

const requirePortalUser = async (req, res, next) => {
  const email = readUserEmail(req);
  if (!email) {
    return res.status(401).json({ error: "Missing x-user-email header" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "User not provisioned. Call /api/auth/sync-user first." });
  }

  req.portalUser = user;
  return next();
};

const resolvePortalWorkspace = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });

  if (!user || !user.memberships.length) return null;

  const selectedMembership =
    user.memberships.find((membership) => membership.organizationId === user.defaultOrganizationId) ||
    user.memberships[0];

  return {
    user,
    organization: selectedMembership.organization,
    membership: selectedMembership,
  };
};

const seedAdvertiserWorkspaceMockData = async ({ organization }) => {
  const advertiserKey = `org:${organization.id}`;
  const existingCount = await prisma.ad.count({
    where: { advertiser: advertiserKey },
  });
  if (existingCount > 0) return;

  const templates = [
    {
      title: "AI Writing Assistant Launch",
      description: "Promote your AI writing assistant in high-intent productivity conversations.",
      ctaText: "Start Free Trial",
      clickUrl: "https://example.com/ai-writing-assistant",
      imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978",
      topics: ["ai", "productivity", "writing"],
      format: "card",
      weight: 3,
      isActive: true,
      impressionCount: 28,
      clickCount: 7,
      revenueCents: 21450,
    },
    {
      title: "Cloud Security Webinar",
      description: "Drive qualified security buyers to your next zero-trust webinar.",
      ctaText: "Reserve Seat",
      clickUrl: "https://example.com/cloud-security-webinar",
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
      topics: ["security", "cloud", "devops"],
      format: "card",
      weight: 2,
      isActive: false,
      impressionCount: 12,
      clickCount: 2,
      revenueCents: 6900,
    },
    {
      title: "CRM Migration Suite",
      description: "Capture migration-ready teams evaluating CRM automation workflows.",
      ctaText: "Book Demo",
      clickUrl: "https://example.com/crm-migration-suite",
      imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0",
      topics: ["crm", "sales", "automation"],
      format: "card",
      weight: 2,
      isActive: true,
      impressionCount: 24,
      clickCount: 5,
      revenueCents: 17300,
    },
  ];

  for (const [index, template] of templates.entries()) {
    const ad = await prisma.ad.create({
      data: {
        title: template.title,
        description: template.description,
        ctaText: template.ctaText,
        clickUrl: template.clickUrl,
        imageUrl: template.imageUrl,
        advertiser: advertiserKey,
        topics: template.topics,
        format: template.format,
        weight: template.weight,
        isActive: template.isActive,
      },
    });

    const events = [];
    for (let i = 0; i < template.impressionCount; i += 1) {
      events.push({
        adId: ad.id,
        eventType: "impression",
        botId: `orgbot_${organization.id}_seed_${index + 1}`,
        topic: template.topics[0],
      });
    }
    for (let i = 0; i < template.clickCount; i += 1) {
      events.push({
        adId: ad.id,
        eventType: "click",
        botId: `orgbot_${organization.id}_seed_${index + 1}`,
        topic: template.topics[0],
      });
    }
    events.push({
      adId: ad.id,
      eventType: "revenue",
      botId: `orgbot_${organization.id}_seed_${index + 1}`,
      topic: template.topics[0],
      amount: template.revenueCents,
    });

    await prisma.adEvent.createMany({ data: events });
  }
};

const seedPublisherWorkspaceMockData = async ({ organization }) => {
  const botPrefix = `orgbot_${organization.id}_`;
  const existingEvents = await prisma.adEvent.count({
    where: {
      botId: {
        startsWith: botPrefix,
      },
    },
  });
  if (existingEvents > 0) return;

  const bots = [
    {
      id: `${botPrefix}support-copilot`,
      name: "Support Copilot",
      environment: "production",
      health: "healthy",
      requests7d: 42100,
      fillRate: 74.2,
      revenueTodayCents: 4822,
      impressionCount: 32,
      clickCount: 8,
    },
    {
      id: `${botPrefix}sales-assistant`,
      name: "Sales Assistant",
      environment: "staging",
      health: "warning",
      requests7d: 9300,
      fillRate: 61.4,
      revenueTodayCents: 2108,
      impressionCount: 20,
      clickCount: 4,
    },
    {
      id: `${botPrefix}onboarding-guide`,
      name: "Onboarding Guide",
      environment: "production",
      health: "healthy",
      requests7d: 31700,
      fillRate: 69.8,
      revenueTodayCents: 3640,
      impressionCount: 27,
      clickCount: 6,
    },
  ];

  for (const bot of bots) {
    const events = [];
    for (let i = 0; i < bot.impressionCount; i += 1) {
      events.push({
        eventType: "impression",
        botId: bot.id,
        topic: "ai",
        metadata: {
          botName: bot.name,
          environment: bot.environment,
          health: bot.health,
          requests7d: bot.requests7d,
          fillRate: bot.fillRate,
          sdkErrors: bot.health === "warning" ? 1 : 0,
        },
      });
    }
    for (let i = 0; i < bot.clickCount; i += 1) {
      events.push({
        eventType: "click",
        botId: bot.id,
        topic: "ai",
      });
    }
    events.push({
      eventType: "revenue",
      botId: bot.id,
      topic: "ai",
      amount: bot.revenueTodayCents,
      metadata: {
        botName: bot.name,
        environment: bot.environment,
        health: bot.health,
        requests7d: bot.requests7d,
        fillRate: bot.fillRate,
        sdkErrors: bot.health === "warning" ? 1 : 0,
      },
    });
    await prisma.adEvent.createMany({ data: events });
  }
};

const seedWorkspaceMockData = async ({ organization }) => {
  if (organization.type === "advertiser") {
    await seedAdvertiserWorkspaceMockData({ organization });
    return;
  }
  if (organization.type === "publisher") {
    await seedPublisherWorkspaceMockData({ organization });
  }
};

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (_err) {
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});

app.post("/api/auth/sync-user", async (req, res) => {
  const parsed = syncUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid sync payload",
      details: parsed.error.flatten(),
    });
  }

  const email = parsed.data.email.toLowerCase();
  const fallbackName = email.split("@")[0] || "Portal User";
  const name = parsed.data.name?.trim() || fallbackName;

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });

    const entry = await buildEntryContextByUserId(user.id);
    return res.json(entry);
  } catch (err) {
    console.error("User sync failed", err);
    return res.status(500).json({ error: "Failed to sync user" });
  }
});

app.post("/api/me/create-workspace", requirePortalUser, async (req, res) => {
  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid workspace create payload",
      details: parsed.error.flatten(),
    });
  }

  const { type, name } = parsed.data;
  const defaultName =
    type === "advertiser"
      ? `${req.portalUser.name} Advertiser Workspace`
      : `${req.portalUser.name} Bot Developer Workspace`;

  try {
    const organization = await prisma.organization.create({
      data: {
        name: name || defaultName,
        type,
      },
    });

    await prisma.organizationMember.create({
      data: {
        userId: req.portalUser.id,
        organizationId: organization.id,
        role: type === "advertiser" ? "advertiser_owner" : "publisher_owner",
      },
    });

    await prisma.user.update({
      where: { id: req.portalUser.id },
      data: {
        defaultOrganizationId: organization.id,
      },
    });

    await seedWorkspaceMockData({ organization });

    const entry = await buildEntryContextByUserId(req.portalUser.id);
    return res.status(201).json(entry);
  } catch (err) {
    console.error("Create workspace failed", err);
    return res.status(500).json({ error: "Failed to create workspace" });
  }
});

app.get("/api/advertiser/dashboard", requirePortalUser, async (req, res) => {
  try {
    const workspace = await resolvePortalWorkspace(req.portalUser.id);
    if (!workspace || workspace.organization.type !== "advertiser") {
      return res.status(403).json({ error: "Advertiser workspace required" });
    }

    await seedWorkspaceMockData({ organization: workspace.organization });

    const advertiserKey = `org:${workspace.organization.id}`;
    const campaigns = await prisma.ad.findMany({
      where: { advertiser: advertiserKey },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const campaignIds = campaigns.map((campaign) => campaign.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const events = campaignIds.length
      ? await prisma.adEvent.findMany({
          where: {
            adId: { in: campaignIds },
            createdAt: { gte: sevenDaysAgo },
          },
          select: {
            adId: true,
            eventType: true,
            amount: true,
            createdAt: true,
          },
        })
      : [];

    const statsByCampaignId = new Map();
    let totalImpressions = 0;
    let totalClicks = 0;
    let spendTodayCents = 0;

    for (const event of events) {
      const key = event.adId || "";
      if (!statsByCampaignId.has(key)) {
        statsByCampaignId.set(key, {
          impressions: 0,
          clicks: 0,
          spendCents: 0,
        });
      }
      const current = statsByCampaignId.get(key);

      if (event.eventType === "impression") {
        current.impressions += 1;
        totalImpressions += 1;
      }
      if (event.eventType === "click") {
        current.clicks += 1;
        totalClicks += 1;
      }
      if (event.eventType === "revenue") {
        const value = Math.max(Number(event.amount || 0), 0);
        current.spendCents += value;
        if (event.createdAt >= todayStart) {
          spendTodayCents += value;
        }
      }
    }

    const payloadCampaigns = campaigns.map((campaign) => {
      const stats = statsByCampaignId.get(campaign.id) || {
        impressions: 0,
        clicks: 0,
        spendCents: 0,
      };
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
    const pendingReview = payloadCampaigns.filter((campaign) => campaign.status === "Review").length;
    const activeCampaigns = payloadCampaigns.filter((campaign) => campaign.status === "Live").length;

    return res.json({
      summary: {
        activeCampaigns,
        pendingReview,
        spendTodayCents,
        ctr7d,
      },
      campaigns: payloadCampaigns,
    });
  } catch (err) {
    console.error("Advertiser dashboard failed", err);
    return res.status(500).json({ error: "Failed to load advertiser dashboard" });
  }
});

app.get("/api/publisher/dashboard", requirePortalUser, async (req, res) => {
  try {
    const workspace = await resolvePortalWorkspace(req.portalUser.id);
    if (!workspace || workspace.organization.type !== "publisher") {
      return res.status(403).json({ error: "Bot developer workspace required" });
    }

    await seedWorkspaceMockData({ organization: workspace.organization });

    const botPrefix = `orgbot_${workspace.organization.id}_`;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const events = await prisma.adEvent.findMany({
      where: {
        botId: {
          startsWith: botPrefix,
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        botId: true,
        eventType: true,
        amount: true,
        createdAt: true,
        metadata: true,
      },
      take: 1200,
    });

    const botMap = new Map();
    for (const event of events) {
      const key = event.botId;
      if (!botMap.has(key)) {
        botMap.set(key, {
          botId: key,
          name: key.replace(botPrefix, "").replaceAll("-", " "),
          environment: "production",
          health: "healthy",
          requests7d: 0,
          impressions: 0,
          clicks: 0,
          revenueTodayCents: 0,
          fillRate: 0,
          sdkErrors: 0,
          metadataSeen: false,
        });
      }
      const current = botMap.get(key);

      if (event.eventType === "impression") {
        current.impressions += 1;
      } else if (event.eventType === "click") {
        current.clicks += 1;
      } else if (event.eventType === "revenue" && event.createdAt >= todayStart) {
        current.revenueTodayCents += Math.max(Number(event.amount || 0), 0);
      }

      if (!current.metadataSeen && event.metadata && typeof event.metadata === "object") {
        const metadata = event.metadata;
        current.name = String(metadata.botName || current.name);
        current.environment = String(metadata.environment || current.environment);
        current.health = String(metadata.health || current.health);
        current.requests7d = Number(metadata.requests7d || current.requests7d || 0);
        current.fillRate = Number(metadata.fillRate || current.fillRate || 0);
        current.sdkErrors = Number(metadata.sdkErrors || current.sdkErrors || 0);
        current.metadataSeen = true;
      }
    }

    const bots = [...botMap.values()].map((bot) => {
      const estimatedRequests = bot.requests7d > 0 ? bot.requests7d : Math.max(bot.impressions, 1);
      const computedFillRate = bot.fillRate > 0 ? bot.fillRate : (bot.impressions / estimatedRequests) * 100;
      return {
        botId: bot.botId,
        name: bot.name,
        environment: bot.environment,
        health: bot.health,
        requests7d: estimatedRequests,
        fillRate7d: Math.max(0, Math.min(computedFillRate, 100)),
        revenueTodayCents: bot.revenueTodayCents,
        sdkErrors: bot.sdkErrors,
      };
    });

    const totalRequests = bots.reduce((acc, bot) => acc + bot.requests7d, 0);
    const weightedFillRate =
      totalRequests > 0
        ? bots.reduce((acc, bot) => acc + bot.fillRate7d * bot.requests7d, 0) / totalRequests
        : 0;
    const revenueTodayCents = bots.reduce((acc, bot) => acc + bot.revenueTodayCents, 0);
    const sdkErrors = bots.reduce((acc, bot) => acc + bot.sdkErrors, 0);

    return res.json({
      summary: {
        registeredBots: bots.length,
        fillRate7d: weightedFillRate,
        revenueTodayCents,
        sdkErrors,
      },
      bots,
    });
  } catch (err) {
    console.error("Publisher dashboard failed", err);
    return res.status(500).json({ error: "Failed to load publisher dashboard" });
  }
});

app.get("/api/me/entry-context", requirePortalUser, async (req, res) => {
  try {
    const entry = await buildEntryContextByUserId(req.portalUser.id);
    return res.json(entry);
  } catch (err) {
    console.error("Entry context failed", err);
    return res.status(500).json({ error: "Failed to fetch entry context" });
  }
});

app.get("/api/me/organizations", requirePortalUser, async (req, res) => {
  try {
    const entry = await buildEntryContextByUserId(req.portalUser.id);
    return res.json({ workspaces: entry?.workspaces || [] });
  } catch (err) {
    console.error("Organization list failed", err);
    return res.status(500).json({ error: "Failed to fetch organizations" });
  }
});

app.post("/api/me/default-workspace", requirePortalUser, async (req, res) => {
  const parsed = selectWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid workspace payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.portalUser.id,
        organizationId: parsed.data.workspaceId,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Workspace not accessible for this user" });
    }

    await prisma.user.update({
      where: { id: req.portalUser.id },
      data: {
        defaultOrganizationId: parsed.data.workspaceId,
      },
    });

    const entry = await buildEntryContextByUserId(req.portalUser.id);
    return res.json(entry);
  } catch (err) {
    console.error("Default workspace update failed", err);
    return res.status(500).json({ error: "Failed to set default workspace" });
  }
});

app.post("/api/me/switch-organization", requirePortalUser, async (req, res) => {
  const parsed = selectWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid switch payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.portalUser.id,
        organizationId: parsed.data.workspaceId,
      },
      include: { organization: true },
    });

    if (!membership) {
      return res.status(403).json({ error: "Organization not accessible for this user" });
    }

    const role = mapMembershipRoleToPortalRole(membership.role);
    return res.json({
      workspaceId: membership.organizationId,
      role,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        type: membership.organization.type,
      },
    });
  } catch (err) {
    console.error("Organization switch failed", err);
    return res.status(500).json({ error: "Failed to switch organization" });
  }
});

app.post("/api/ads", requireSdkKey, async (req, res) => {
  const parsed = adRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid ad request",
      details: parsed.error.flatten(),
    });
  }

  const { context, format } = parsed.data;
  const topic = normalizeTopic(context.topic);

  try {
    const activeAds = await prisma.ad.findMany({
      where: {
        isActive: true,
        OR: [{ format }, { format: "card" }],
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    if (!activeAds.length) {
      return res.json({ success: true, data: [] });
    }

    const topicMatched = topic
      ? activeAds.filter((ad) => ad.topics.some((value) => normalizeTopic(value).includes(topic)))
      : activeAds;

    const selected = weightedPick(topicMatched.length ? topicMatched : activeAds);
    if (!selected) {
      return res.json({ success: true, data: [] });
    }

    return res.json({ success: true, data: [toSdkAd(selected)] });
  } catch (err) {
    console.error("Ad fetch failed", err);
    return res.status(500).json({ success: false, error: "Failed to fetch ads" });
  }
});

app.post("/api/track/:eventType", requireSdkKey, async (req, res) => {
  const eventType = req.params.eventType;
  if (!["impression", "click", "revenue"].includes(eventType)) {
    return res.status(400).json({ error: "Invalid event type" });
  }

  const parsed = trackEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid tracking payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    await prisma.adEvent.create({
      data: {
        eventType,
        adId: parsed.data.adId,
        botId: parsed.data.botId,
        userId: parsed.data.userId,
        topic: parsed.data.topic,
        amount: parsed.data.amount,
        metadata: parsed.data.metadata,
      },
    });
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Event track failed", err);
    return res.status(500).json({ error: "Failed to track event" });
  }
});

app.post("/api/leads", async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const lead = await prisma.lead.create({ data: parsed.data });
    return res.status(201).json({ id: lead.id, status: lead.status });
  } catch (err) {
    console.error("Lead insert failed", err);
    return res.status(500).json({ error: "Failed to store lead" });
  }
});

app.get("/api/leads", async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json(leads);
  } catch (err) {
    console.error("Lead list failed", err);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

app.get("/api/admin/overview", requireAdminKey, async (_req, res) => {
  try {
    const [totalAds, activeAds, totalEvents, totalLeads] = await Promise.all([
      prisma.ad.count(),
      prisma.ad.count({ where: { isActive: true } }),
      prisma.adEvent.count(),
      prisma.lead.count(),
    ]);
    return res.json({ totalAds, activeAds, totalEvents, totalLeads });
  } catch (err) {
    console.error("Overview fetch failed", err);
    return res.status(500).json({ error: "Failed to fetch overview" });
  }
});

app.get("/api/admin/ads", requireAdminKey, async (_req, res) => {
  try {
    const ads = await prisma.ad.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return res.json(ads);
  } catch (err) {
    console.error("Ad list failed", err);
    return res.status(500).json({ error: "Failed to fetch ads" });
  }
});

app.post("/api/admin/ads", requireAdminKey, async (req, res) => {
  const parsed = adminCreateAdSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid ad payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const ad = await prisma.ad.create({ data: parsed.data });
    return res.status(201).json(ad);
  } catch (err) {
    console.error("Ad create failed", err);
    return res.status(500).json({ error: "Failed to create ad" });
  }
});

app.patch("/api/admin/ads/:id", requireAdminKey, async (req, res) => {
  const { id } = req.params;
  const parsed = adminUpdateAdSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid ad update payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const ad = await prisma.ad.update({
      where: { id },
      data: parsed.data,
    });
    return res.json(ad);
  } catch (err) {
    console.error("Ad update failed", err);
    return res.status(500).json({ error: "Failed to update ad" });
  }
});

app.get("/api/admin/events", requireAdminKey, async (req, res) => {
  const limit = Number(req.query.limit || 100);
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 300) : 100;

  try {
    const events = await prisma.adEvent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ad: {
          select: { id: true, title: true, advertiser: true },
        },
      },
      take,
    });
    return res.json(events);
  } catch (err) {
    console.error("Event list failed", err);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/api/admin/leads", requireAdminKey, async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return res.json(leads);
  } catch (err) {
    console.error("Lead list failed", err);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

const server = app.listen(port, () => {
  console.log(`Local API listening on http://localhost:${port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
