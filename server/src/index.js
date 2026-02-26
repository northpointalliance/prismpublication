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

    const memberships = await prisma.organizationMember.count({
      where: { userId: user.id },
    });

    if (memberships === 0) {
      const [advertiserOrg, publisherOrg] = await Promise.all([
        prisma.organization.create({
          data: {
            name: `${name} Advertiser Workspace`,
            type: "advertiser",
          },
        }),
        prisma.organization.create({
          data: {
            name: `${name} Publisher Workspace`,
            type: "publisher",
          },
        }),
      ]);

      const memberData = [
        {
          userId: user.id,
          organizationId: advertiserOrg.id,
          role: "advertiser_owner",
        },
        {
          userId: user.id,
          organizationId: publisherOrg.id,
          role: "publisher_owner",
        },
      ];

      if (email.includes("admin") || email.includes("owner")) {
        const adminOrg = await prisma.organization.create({
          data: {
            name: "Platform Admin Workspace",
            type: "admin",
          },
        });
        memberData.push({
          userId: user.id,
          organizationId: adminOrg.id,
          role: "admin",
        });
      }

      await prisma.organizationMember.createMany({ data: memberData });
      await prisma.user.update({
        where: { id: user.id },
        data: { defaultOrganizationId: advertiserOrg.id },
      });
    }

    const entry = await buildEntryContextByUserId(user.id);
    return res.json(entry);
  } catch (err) {
    console.error("User sync failed", err);
    return res.status(500).json({ error: "Failed to sync user" });
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
