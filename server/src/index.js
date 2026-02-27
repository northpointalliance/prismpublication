import "dotenv/config";
import crypto from "node:crypto";
import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  getMembershipRolePriority,
  isAdminMembershipRole,
  isRoleCompatibleWithOrganizationType,
  mapMembershipRoleToPortalRole,
} from "./portal-roles.js";
import { createIpRateLimiter } from "./rate-limit.js";
import { getBearerToken, secureEqual } from "./security-utils.js";

const app = express();
const prisma = new PrismaClient();

const port = Number(process.env.PORT || 8787);
const corsOrigin = process.env.API_CORS_ORIGIN || "http://localhost:8080";
const isProduction = process.env.NODE_ENV === "production";
const allowInsecureDevAuth = process.env.ALLOW_INSECURE_DEV_AUTH === "true";
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || "";
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const sdkApiKey = process.env.PRISM_API_KEY || process.env.BOTGRID_API_KEY || "";
const adminApiKey = process.env.ADMIN_API_KEY || "";

if (!sdkApiKey || !adminApiKey) {
  throw new Error("PRISM_API_KEY (or legacy BOTGRID_API_KEY) and ADMIN_API_KEY are required.");
}
if (isProduction && allowInsecureDevAuth) {
  throw new Error("ALLOW_INSECURE_DEV_AUTH must be false in production.");
}

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
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

const authRateLimiter = createIpRateLimiter({ prefix: "auth", windowMs: 10 * 60 * 1000, maxRequests: 180 });
const adminRateLimiter = createIpRateLimiter({ prefix: "admin", windowMs: 10 * 60 * 1000, maxRequests: 240 });
const demoRateLimiter = createIpRateLimiter({ prefix: "demo", windowMs: 10 * 60 * 1000, maxRequests: 240 });
const leadRateLimiter = createIpRateLimiter({ prefix: "lead", windowMs: 10 * 60 * 1000, maxRequests: 60 });

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (_err) {
      return false;
    }
  }, "URL must use http or https protocol.");

const metadataScalarSchema = z.union([z.string().max(280), z.number(), z.boolean(), z.null()]);
const metadataValueSchema = z.union([metadataScalarSchema, z.array(metadataScalarSchema).max(30)]);

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
  metadata: z.record(z.string().max(120), metadataValueSchema).optional(),
});

const demoAdRequestSchema = adRequestSchema.omit({ botId: true });
const demoTrackEventSchema = trackEventSchema.omit({ botId: true, amount: true, metadata: true });

const adminCreateAdSchema = z.object({
  title: z.string().trim().min(4).max(140),
  description: z.string().trim().min(8).max(400),
  ctaText: z.string().trim().min(2).max(60),
  clickUrl: httpUrlSchema,
  advertiser: z.string().trim().min(2).max(120),
  imageUrl: httpUrlSchema.optional(),
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
  type: z.enum(["advertiser", "publisher", "admin"]),
  name: z.string().trim().min(2).max(120).optional(),
});

const advertiserCampaignCreateSchema = z.object({
  title: z.string().trim().min(4).max(140),
  description: z.string().trim().min(8).max(400),
  ctaText: z.string().trim().min(2).max(60),
  clickUrl: httpUrlSchema,
  imageUrl: httpUrlSchema.optional(),
  topics: z.array(z.string().trim().min(1).max(60)).default([]),
  format: z.enum(["text", "card", "banner"]).default("card"),
  weight: z.number().int().min(1).max(100).default(1),
  isActive: z.boolean().optional(),
});

const advertiserCampaignUpdateSchema = advertiserCampaignCreateSchema
  .pick({
    title: true,
    description: true,
    ctaText: true,
    clickUrl: true,
    imageUrl: true,
    topics: true,
    format: true,
    weight: true,
    isActive: true,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

const publisherBotCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  environment: z.enum(["development", "staging", "production"]).default("production"),
  health: z.enum(["healthy", "warning", "degraded"]).default("healthy"),
  placementPolicy: z.record(z.string().max(120), metadataValueSchema).optional(),
});

const publisherBotUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    environment: z.enum(["development", "staging", "production"]).optional(),
    health: z.enum(["healthy", "warning", "degraded"]).optional(),
    isActive: z.boolean().optional(),
    placementPolicy: z.record(z.string().max(120), metadataValueSchema).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

const publisherCreateSdkKeySchema = z.object({
  label: z.string().trim().min(2).max(60).default("Primary"),
});

const hashSecret = (value = "") => crypto.createHash("sha256").update(String(value)).digest("hex");

const createSdkToken = () => `bgsk_${crypto.randomBytes(20).toString("hex")}`;

const createBotPublicId = ({ organizationId, name }) => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `orgbot_${organizationId}_${baseSlug || "bot"}_${suffix}`;
};

const toPublicSdkKey = (key) => ({
  id: key.id,
  label: key.label,
  prefix: key.prefix,
  last4: key.last4,
  createdAt: key.createdAt,
  revokedAt: key.revokedAt,
});

const requireSdkKey = async (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized SDK key" });
  }

  if (secureEqual(token, sdkApiKey)) {
    req.sdkAuth = { mode: "master" };
    return next();
  }

  try {
    const tokenHash = hashSecret(token);
    const sdkKey = await prisma.botSdkKey.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { bot: true },
    });

    if (!sdkKey?.bot) {
      return res.status(401).json({ error: "Unauthorized SDK key" });
    }

    req.sdkAuth = {
      mode: "bot",
      botId: sdkKey.bot.id,
      botPublicId: sdkKey.bot.publicId,
      keyId: sdkKey.id,
    };
    return next();
  } catch (err) {
    console.error("SDK auth failed", err);
    return res.status(500).json({ error: "Failed to validate SDK key" });
  }
};

const ensureSdkBotScope = (req, botId) => {
  if (req.sdkAuth?.mode !== "bot") return { ok: true };
  if (req.sdkAuth.botPublicId !== botId) {
    return { ok: false, status: 403, error: "SDK key is not authorized for this botId" };
  }
  return { ok: true };
};

const requireAdvertiserWorkspace = async (userId) => {
  const workspace = await resolvePortalWorkspace(userId);
  if (!workspace || workspace.organization.type !== "advertiser") {
    return null;
  }
  return workspace;
};

const requirePublisherWorkspace = async (userId) => {
  const workspace = await resolvePortalWorkspace(userId);
  if (!workspace || workspace.organization.type !== "publisher") {
    return null;
  }
  return workspace;
};

const summarizeBotMetrics = (events = [], bot) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let impressions = 0;
  let clicks = 0;
  let revenueTodayCents = 0;
  let metadataRequests = Number(bot?.requests7d || 0);
  let metadataFillRate = Number(bot?.fillRateHint || 0);
  let metadataErrors = Number(bot?.sdkErrorsHint || 0);
  let metadataSeen = false;

  for (const event of events) {
    if (event.eventType === "impression") impressions += 1;
    if (event.eventType === "click") clicks += 1;
    if (event.eventType === "revenue" && event.createdAt >= todayStart) {
      revenueTodayCents += Math.max(Number(event.amount || 0), 0);
    }

    if (!metadataSeen && event.metadata && typeof event.metadata === "object") {
      metadataSeen = true;
      metadataRequests = Number(event.metadata.requests7d || metadataRequests || 0);
      metadataFillRate = Number(event.metadata.fillRate || metadataFillRate || 0);
      metadataErrors = Number(event.metadata.sdkErrors || metadataErrors || 0);
    }
  }

  const computedRequests = metadataRequests > 0 ? metadataRequests : Math.max(impressions, 1);
  const computedFillRate = metadataFillRate > 0 ? metadataFillRate : (impressions / computedRequests) * 100;

  return {
    requests7d: computedRequests,
    fillRate7d: Math.max(0, Math.min(computedFillRate, 100)),
    revenueTodayCents,
    sdkErrors: Math.max(0, metadataErrors),
    impressions,
    clicks,
  };
};

const ensureSeedPublisherBotRecords = async ({ organizationId, seedBots }) => {
  for (const bot of seedBots) {
    const existing = await prisma.publisherBot.findFirst({
      where: {
        organizationId,
        publicId: bot.id,
      },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.publisherBot.create({
      data: {
        organizationId,
        name: bot.name,
        publicId: bot.id,
        environment: bot.environment,
        health: bot.health,
        requests7d: bot.requests7d,
        fillRateHint: bot.fillRate,
        sdkErrorsHint: bot.health === "warning" ? 1 : 0,
      },
    });
  }
};

const createPublisherSdkKey = async ({ botId, label, revokeExisting = false }) => {
  const token = createSdkToken();
  const tokenHash = hashSecret(token);
  const prefix = token.slice(0, 10);
  const last4 = token.slice(-4);

  const created = await prisma.$transaction(async (tx) => {
    if (revokeExisting) {
      await tx.botSdkKey.updateMany({
        where: {
          botId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    return tx.botSdkKey.create({
      data: {
        botId,
        label,
        tokenHash,
        prefix,
        last4,
      },
    });
  });

  return {
    ...toPublicSdkKey(created),
    token,
  };
};

const requireAdminKey = (req, res, next) => {
  const suppliedKey = String(req.headers["x-admin-key"] || "");
  if (!suppliedKey || !secureEqual(suppliedKey, adminApiKey)) {
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

const sdkTrackEventTypes = new Set(["impression", "click", "revenue"]);
const demoTrackEventTypes = new Set(["impression", "click"]);

const selectAdForRequest = async ({ format, topic = "" }) => {
  const activeAds = await prisma.ad.findMany({
    where: {
      isActive: true,
      OR: [{ format }, { format: "card" }],
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  if (!activeAds.length) {
    return null;
  }

  const normalizedTopic = normalizeTopic(topic);
  const topicMatched = normalizedTopic
    ? activeAds.filter((ad) => ad.topics.some((value) => normalizeTopic(value).includes(normalizedTopic)))
    : activeAds;

  return weightedPick(topicMatched.length ? topicMatched : activeAds);
};

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

const readUserEmail = (req) => String(req.headers["x-user-email"] || "").trim().toLowerCase();

let insecureAuthWarningShown = false;
let missingSupabaseVerificationWarningShown = false;
const verifySupabaseToken = async (token) => {
  if (!supabaseUrl || !supabasePublishableKey || !token) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const payload = await response.json();
    return {
      id: String(payload.id || ""),
      email: String(payload.email || "").trim().toLowerCase(),
    };
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const validatePortalSession = async (req, expectedEmail = "") => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    if (!allowInsecureDevAuth) {
      return { ok: false, status: 401, error: "Missing bearer token" };
    }
    if (!insecureAuthWarningShown) {
      insecureAuthWarningShown = true;
      console.warn("Security warning: insecure dev auth is enabled. Set ALLOW_INSECURE_DEV_AUTH=false.");
    }
    return { ok: true, sessionEmail: null };
  }

  const canVerifyToken = Boolean(supabaseUrl && supabasePublishableKey);
  if (!canVerifyToken) {
    if (!allowInsecureDevAuth) {
      return { ok: false, status: 500, error: "Supabase token verification is not configured" };
    }
    if (!missingSupabaseVerificationWarningShown) {
      missingSupabaseVerificationWarningShown = true;
      console.warn(
        "Security warning: token verification skipped because SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY are not set.",
      );
    }
    return { ok: true, sessionEmail: null };
  }

  const verifiedUser = await verifySupabaseToken(token);
  if (!verifiedUser?.email) {
    return { ok: false, status: 401, error: "Invalid bearer token" };
  }
  if (expectedEmail && verifiedUser.email !== expectedEmail) {
    return { ok: false, status: 403, error: "Token user mismatch" };
  }

  return { ok: true, sessionEmail: verifiedUser.email };
};

const selectBestMembershipPerOrganization = (memberships = []) => {
  const byOrganizationId = new Map();

  for (const membership of memberships) {
    if (!membership?.organization) continue;
    if (!isRoleCompatibleWithOrganizationType(membership.role, membership.organization.type)) continue;

    const orgId = membership.organization.id;
    const current = byOrganizationId.get(orgId);
    if (!current || getMembershipRolePriority(membership.role) > getMembershipRolePriority(current.role)) {
      byOrganizationId.set(orgId, membership);
    }
  }

  return [...byOrganizationId.values()];
};

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

  const memberships = selectBestMembershipPerOrganization(user.memberships);
  const workspaces = memberships.flatMap((membership) => {
    const role = mapMembershipRoleToPortalRole(membership.role);
    if (!role) return [];
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

  const validation = await validatePortalSession(req, email);
  if (!validation.ok) {
    return res.status(validation.status).json({ error: validation.error });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "User not provisioned. Call /api/auth/sync-user first." });
  }

  req.portalUser = user;
  return next();
};

app.use("/api/auth", authRateLimiter);
app.use("/api/me", authRateLimiter);
app.use("/api/admin", adminRateLimiter);
app.use("/api/demo", demoRateLimiter);
app.use("/api/leads", leadRateLimiter);

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

  const memberships = selectBestMembershipPerOrganization(user.memberships);
  if (!memberships.length) return null;

  const selectedMembership =
    memberships.find((membership) => membership.organizationId === user.defaultOrganizationId) || memberships[0];

  return {
    user,
    organization: selectedMembership.organization,
    membership: selectedMembership,
  };
};

const requireAdminPortalUser = async (req, res, next) => {
  const workspace = await resolvePortalWorkspace(req.portalUser.id);
  if (!workspace || workspace.organization.type !== "admin" || !isAdminMembershipRole(workspace.membership.role)) {
    return res.status(403).json({ error: "Admin workspace required" });
  }
  req.portalWorkspace = workspace;
  return next();
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

  await ensureSeedPublisherBotRecords({ organizationId: organization.id, seedBots: bots });

  const existingEvents = await prisma.adEvent.count({
    where: {
      botId: {
        startsWith: botPrefix,
      },
    },
  });
  if (existingEvents > 0) return;

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
  const validation = await validatePortalSession(req, email);
  if (!validation.ok) {
    return res.status(validation.status).json({ error: validation.error });
  }

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
      : type === "publisher"
        ? `${req.portalUser.name} Bot Developer Workspace`
        : `${req.portalUser.name} Admin Workspace`;

  if (type === "admin") {
    const suppliedKey = String(req.headers["x-admin-key"] || "");
    if (!suppliedKey || !secureEqual(suppliedKey, adminApiKey)) {
      return res.status(401).json({ error: "Unauthorized admin key for admin workspace bootstrap" });
    }
  }

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
        role:
          type === "advertiser"
            ? "advertiser_owner"
            : type === "publisher"
              ? "publisher_owner"
              : "super_admin",
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
    const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
    if (!workspace) {
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
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Bot developer workspace required" });
    }

    await seedWorkspaceMockData({ organization: workspace.organization });

    const bots = await prisma.publisherBot.findMany({
      where: {
        organizationId: workspace.organization.id,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        sdkKeys: {
          where: { revokedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            label: true,
            prefix: true,
            last4: true,
            createdAt: true,
            revokedAt: true,
          },
        },
      },
    });

    const botIds = bots.map((bot) => bot.publicId);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const events = botIds.length
      ? await prisma.adEvent.findMany({
          where: {
            botId: { in: botIds },
            createdAt: { gte: sevenDaysAgo },
          },
          orderBy: { createdAt: "desc" },
          select: {
            botId: true,
            eventType: true,
            amount: true,
            createdAt: true,
            metadata: true,
          },
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
      summary: {
        registeredBots: payloadBots.length,
        fillRate7d: weightedFillRate,
        revenueTodayCents,
        sdkErrors,
      },
      bots: payloadBots,
    });
  } catch (err) {
    console.error("Publisher dashboard failed", err);
    return res.status(500).json({ error: "Failed to load publisher dashboard" });
  }
});

app.get("/api/advertiser/campaigns", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Advertiser workspace required" });
    }

    const advertiserKey = `org:${workspace.organization.id}`;
    const campaigns = await prisma.ad.findMany({
      where: { advertiser: advertiserKey },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return res.json(campaigns);
  } catch (err) {
    console.error("Advertiser campaign list failed", err);
    return res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

app.post("/api/advertiser/campaigns", requirePortalUser, async (req, res) => {
  const parsed = advertiserCampaignCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid campaign payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Advertiser workspace required" });
    }

    const advertiserKey = `org:${workspace.organization.id}`;
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
      },
    });
    return res.status(201).json(campaign);
  } catch (err) {
    console.error("Advertiser campaign create failed", err);
    return res.status(500).json({ error: "Failed to create campaign" });
  }
});

app.patch("/api/advertiser/campaigns/:id", requirePortalUser, async (req, res) => {
  const parsed = advertiserCampaignUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid campaign update payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Advertiser workspace required" });
    }

    const advertiserKey = `org:${workspace.organization.id}`;
    const existing = await prisma.ad.findFirst({
      where: {
        id: req.params.id,
        advertiser: advertiserKey,
      },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const campaign = await prisma.ad.update({
      where: { id: existing.id },
      data: parsed.data,
    });
    return res.json(campaign);
  } catch (err) {
    console.error("Advertiser campaign update failed", err);
    return res.status(500).json({ error: "Failed to update campaign" });
  }
});

app.get("/api/publisher/bots", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Bot developer workspace required" });
    }

    await seedWorkspaceMockData({ organization: workspace.organization });

    const bots = await prisma.publisherBot.findMany({
      where: { organizationId: workspace.organization.id },
      orderBy: { updatedAt: "desc" },
      include: {
        sdkKeys: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            label: true,
            prefix: true,
            last4: true,
            createdAt: true,
            revokedAt: true,
          },
        },
      },
    });

    return res.json(
      bots.map((bot) => ({
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
    );
  } catch (err) {
    console.error("Publisher bot list failed", err);
    return res.status(500).json({ error: "Failed to fetch bots" });
  }
});

app.post("/api/publisher/bots", requirePortalUser, async (req, res) => {
  const parsed = publisherBotCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid bot payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Bot developer workspace required" });
    }

    const bot = await prisma.publisherBot.create({
      data: {
        organizationId: workspace.organization.id,
        name: parsed.data.name,
        publicId: createBotPublicId({
          organizationId: workspace.organization.id,
          name: parsed.data.name,
        }),
        environment: parsed.data.environment,
        health: parsed.data.health,
        placementPolicy: parsed.data.placementPolicy,
      },
    });

    const initialSdkKey = await createPublisherSdkKey({
      botId: bot.id,
      label: "Primary",
    });

    return res.status(201).json({
      bot: {
        id: bot.id,
        botId: bot.publicId,
        name: bot.name,
        environment: bot.environment,
        health: bot.health,
        isActive: bot.isActive,
      },
      initialSdkKey,
    });
  } catch (err) {
    console.error("Publisher bot create failed", err);
    return res.status(500).json({ error: "Failed to create bot" });
  }
});

app.patch("/api/publisher/bots/:id", requirePortalUser, async (req, res) => {
  const parsed = publisherBotUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid bot update payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Bot developer workspace required" });
    }

    const existing = await prisma.publisherBot.findFirst({
      where: {
        id: req.params.id,
        organizationId: workspace.organization.id,
      },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Bot not found" });
    }

    const updated = await prisma.publisherBot.update({
      where: { id: existing.id },
      data: parsed.data,
    });
    return res.json(updated);
  } catch (err) {
    console.error("Publisher bot update failed", err);
    return res.status(500).json({ error: "Failed to update bot" });
  }
});

app.delete("/api/publisher/bots/:id", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Bot developer workspace required" });
    }

    const existing = await prisma.publisherBot.findFirst({
      where: {
        id: req.params.id,
        organizationId: workspace.organization.id,
      },
      select: { id: true, name: true, publicId: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Bot not found" });
    }

    await prisma.publisherBot.delete({
      where: { id: existing.id },
    });

    return res.json({
      success: true,
      deleted: {
        id: existing.id,
        name: existing.name,
        botId: existing.publicId,
      },
    });
  } catch (err) {
    console.error("Publisher bot delete failed", err);
    return res.status(500).json({ error: "Failed to delete bot" });
  }
});

app.post("/api/publisher/bots/:id/keys", requirePortalUser, async (req, res) => {
  const parsed = publisherCreateSdkKeySchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid key payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Bot developer workspace required" });
    }

    const bot = await prisma.publisherBot.findFirst({
      where: {
        id: req.params.id,
        organizationId: workspace.organization.id,
      },
      select: { id: true, publicId: true, name: true },
    });
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    const key = await createPublisherSdkKey({
      botId: bot.id,
      label: parsed.data.label,
      revokeExisting: true,
    });
    return res.status(201).json({
      botId: bot.publicId,
      key,
    });
  } catch (err) {
    console.error("Publisher key create failed", err);
    return res.status(500).json({ error: "Failed to create SDK key" });
  }
});

app.get("/api/publisher/bots/:id/metrics", requirePortalUser, async (req, res) => {
  try {
    const workspace = await requirePublisherWorkspace(req.portalUser.id);
    if (!workspace) {
      return res.status(403).json({ error: "Bot developer workspace required" });
    }

    const bot = await prisma.publisherBot.findFirst({
      where: {
        id: req.params.id,
        organizationId: workspace.organization.id,
      },
      select: {
        id: true,
        publicId: true,
        name: true,
        requests7d: true,
        fillRateHint: true,
        sdkErrorsHint: true,
      },
    });
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const events = await prisma.adEvent.findMany({
      where: {
        botId: bot.publicId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        eventType: true,
        amount: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1200,
    });

    const metrics = summarizeBotMetrics(events, bot);
    return res.json({
      bot: {
        id: bot.id,
        botId: bot.publicId,
        name: bot.name,
      },
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
    console.error("Publisher bot metrics failed", err);
    return res.status(500).json({ error: "Failed to fetch bot metrics" });
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
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId: req.portalUser.id,
        organizationId: parsed.data.workspaceId,
      },
      include: { organization: true },
    });
    const membership = selectBestMembershipPerOrganization(memberships)[0];

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
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId: req.portalUser.id,
        organizationId: parsed.data.workspaceId,
      },
      include: { organization: true },
    });
    const membership = selectBestMembershipPerOrganization(memberships)[0];

    if (!membership) {
      return res.status(403).json({ error: "Organization not accessible for this user" });
    }

    const role = mapMembershipRoleToPortalRole(membership.role);
    if (!role) {
      return res.status(403).json({ error: "Organization role is not valid for portal access" });
    }
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

app.post("/api/demo/ads", async (req, res) => {
  const parsed = demoAdRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid demo ad request",
      details: parsed.error.flatten(),
    });
  }

  try {
    const selected = await selectAdForRequest({
      format: parsed.data.format,
      topic: parsed.data.context?.topic || "",
    });
    if (!selected) {
      return res.json({ success: true, data: [] });
    }

    return res.json({ success: true, data: [toSdkAd(selected)] });
  } catch (err) {
    console.error("Demo ad fetch failed", err);
    return res.status(500).json({ success: false, error: "Failed to fetch demo ads" });
  }
});

app.post("/api/demo/track/:eventType", async (req, res) => {
  const eventType = req.params.eventType;
  if (!demoTrackEventTypes.has(eventType)) {
    return res.status(400).json({ error: "Invalid demo event type" });
  }

  const parsed = demoTrackEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid demo tracking payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    await prisma.adEvent.create({
      data: {
        eventType,
        adId: parsed.data.adId,
        botId: "demo-public",
        userId: parsed.data.userId,
        topic: parsed.data.topic,
        metadata: { source: "public_demo" },
      },
    });
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Demo event track failed", err);
    return res.status(500).json({ error: "Failed to track demo event" });
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

  try {
    const scope = ensureSdkBotScope(req, parsed.data.botId);
    if (!scope.ok) {
      return res.status(scope.status).json({ error: scope.error });
    }

    const selected = await selectAdForRequest({
      format: parsed.data.format,
      topic: parsed.data.context?.topic || "",
    });
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
  if (!sdkTrackEventTypes.has(eventType)) {
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
    const scope = ensureSdkBotScope(req, parsed.data.botId);
    if (!scope.ok) {
      return res.status(scope.status).json({ error: scope.error });
    }

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

app.get("/api/leads", requireAdminKey, async (_req, res) => {
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

app.get("/api/admin/portal/overview", requirePortalUser, requireAdminPortalUser, async (_req, res) => {
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
    console.error("Admin portal overview failed", err);
    return res.status(500).json({ error: "Failed to load admin portal overview" });
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
