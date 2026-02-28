import crypto from "node:crypto";
import { prisma } from "./db.js";

// ─── Crypto helpers ───────────────────────────────────────────────────────────

export const hashSecret = (value = "") => crypto.createHash("sha256").update(String(value)).digest("hex");

export const createSdkToken = () => `bgsk_${crypto.randomBytes(20).toString("hex")}`;

export const createBotPublicId = ({ organizationId, name }) => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `orgbot_${organizationId}_${baseSlug || "bot"}_${suffix}`;
};

export const toPublicSdkKey = (key) => ({
  id: key.id,
  label: key.label,
  prefix: key.prefix,
  last4: key.last4,
  createdAt: key.createdAt,
  revokedAt: key.revokedAt,
});

export const createPublisherSdkKey = async ({ botId, label, revokeExisting = false }) => {
  const token = createSdkToken();
  const tokenHash = hashSecret(token);
  const prefix = token.slice(0, 10);
  const last4 = token.slice(-4);

  const created = await prisma.$transaction(async (tx) => {
    if (revokeExisting) {
      await tx.botSdkKey.updateMany({
        where: { botId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return tx.botSdkKey.create({
      data: { botId, label, tokenHash, prefix, last4 },
    });
  });

  return { ...toPublicSdkKey(created), token };
};

// ─── Ad helpers ───────────────────────────────────────────────────────────────

export const normalizeTopic = (value = "") => value.toLowerCase().trim();

export const weightedPick = (items) => {
  if (!items.length) return null;
  const totalWeight = items.reduce((acc, item) => acc + Math.max(item.weight || 1, 1), 0);
  let cursor = Math.random() * totalWeight;
  for (const item of items) {
    cursor -= Math.max(item.weight || 1, 1);
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
};

export const toSdkAd = (ad) => ({
  id: ad.id,
  title: ad.title,
  description: ad.description,
  ctaText: ad.ctaText,
  clickUrl: ad.clickUrl,
  imageUrl: ad.imageUrl || undefined,
  advertiser: ad.advertiser,
  tags: ad.topics || [],
});

export const sdkTrackEventTypes = new Set(["impression", "click", "revenue"]);
export const demoTrackEventTypes = new Set(["impression", "click"]);

export const selectAdForRequest = async ({ format, topic = "" }) => {
  const activeAds = await prisma.ad.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: [{ format }, { format: "card" }],
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  if (!activeAds.length) return null;

  const normalizedTopic = normalizeTopic(topic);
  const topicMatched = normalizedTopic
    ? activeAds.filter((ad) => ad.topics.some((value) => normalizeTopic(value).includes(normalizedTopic)))
    : activeAds;

  return weightedPick(topicMatched.length ? topicMatched : activeAds);
};

// ─── Publisher bot metrics ────────────────────────────────────────────────────

export const summarizeBotMetrics = (events = [], bot) => {
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
