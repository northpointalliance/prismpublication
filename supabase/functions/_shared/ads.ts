// Ad selection helpers ported from server/src/helpers.ts (Prisma -> SQL).
import { sql } from "./db.ts";

export const normalizeTopic = (value = ""): string => value.toLowerCase().trim();
export const sdkTrackEventTypes = new Set(["impression", "click", "revenue"]);
export const demoTrackEventTypes = new Set(["impression", "click"]);

// deno-lint-ignore no-explicit-any
export const weightedPick = <T extends { weight?: number | null }>(items: T[]): T | null => {
  if (!items.length) return null;
  const totalWeight = items.reduce((acc, item) => acc + Math.max(item.weight || 1, 1), 0);
  let cursor = Math.random() * totalWeight;
  for (const item of items) {
    cursor -= Math.max(item.weight || 1, 1);
    if (cursor <= 0) return item;
  }
  return items[items.length - 1] ?? null;
};

// deno-lint-ignore no-explicit-any
export const toSdkAd = (ad: any) => ({
  id: ad.id,
  title: ad.title,
  description: ad.description,
  ctaText: ad.ctaText,
  clickUrl: ad.clickUrl,
  imageUrl: ad.imageUrl || undefined,
  advertiser: ad.advertiser,
  tags: ad.topics || [],
});

// deno-lint-ignore no-explicit-any
export const selectAdForRequest = async ({ format, topic = "" }: { format: string; topic?: string }): Promise<any | null> => {
  const activeAds = await sql`
    SELECT * FROM ads
    WHERE "isActive" = true AND "deletedAt" IS NULL AND ("format" = ${format} OR "format" = 'card')
    ORDER BY "updatedAt" DESC LIMIT 200`;
  if (!activeAds.length) return null;

  const now = new Date();
  const notExpired = activeAds.filter((ad) => !ad.endsAt || new Date(ad.endsAt) > now);
  const budgeted = notExpired.filter((ad) => ad.dailyBudgetCents > 0 || ad.lifetimeBudgetCents > 0);
  let eligible = notExpired;

  if (budgeted.length) {
    const ids = budgeted.map((a) => a.id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [today, lifetime] = await Promise.all([
      sql`SELECT "adId", coalesce(sum("amount"), 0) AS spent FROM ad_events
          WHERE "adId" = ANY(${ids}) AND "eventType" = 'revenue' AND "createdAt" >= ${todayStart} GROUP BY "adId"`,
      sql`SELECT "adId", coalesce(sum("amount"), 0) AS spent FROM ad_events
          WHERE "adId" = ANY(${ids}) AND "eventType" = 'revenue' GROUP BY "adId"`,
    ]);
    const todayMap = new Map(today.map((r) => [r.adId, Number(r.spent)]));
    const lifeMap = new Map(lifetime.map((r) => [r.adId, Number(r.spent)]));
    eligible = notExpired.filter((ad) => {
      if (ad.dailyBudgetCents > 0 && (todayMap.get(ad.id) ?? 0) >= ad.dailyBudgetCents) return false;
      if (ad.lifetimeBudgetCents > 0 && (lifeMap.get(ad.id) ?? 0) >= ad.lifetimeBudgetCents) return false;
      return true;
    });
  }

  if (!eligible.length) return null;
  const nt = normalizeTopic(topic);
  const topicMatched = nt
    ? eligible.filter((ad) => (ad.topics || []).some((v: string) => normalizeTopic(v).includes(nt)))
    : eligible;
  return weightedPick(topicMatched.length ? topicMatched : eligible);
};
