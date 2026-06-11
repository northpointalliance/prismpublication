// Verbatim port of summarizeBotMetrics from server/src/helpers.ts (pure function).
export interface BotMetricsResult {
  requests7d: number;
  fillRate7d: number;
  revenueTodayCents: number;
  sdkErrors: number;
  impressions: number;
  clicks: number;
}

// Accepts postgres.js Row arrays (loosely typed) as well as plain event objects.
type MetricEvent = { eventType: string; amount?: number | null; createdAt: Date | string; metadata?: unknown };
type BotHint = { requests7d?: number; fillRateHint?: number; sdkErrorsHint?: number } | null | undefined;

// deno-lint-ignore no-explicit-any
export const summarizeBotMetrics = (events: any[] = [], bot: BotHint): BotMetricsResult => {
  const _events = events as MetricEvent[];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let impressions = 0;
  let clicks = 0;
  let revenueTodayCents = 0;
  let metadataRequests = Number(bot?.requests7d || 0);
  let metadataFillRate = Number(bot?.fillRateHint || 0);
  let metadataErrors = Number(bot?.sdkErrorsHint || 0);
  let metadataSeen = false;

  for (const event of _events) {
    if (event.eventType === "impression") impressions += 1;
    if (event.eventType === "click") clicks += 1;
    if (event.eventType === "revenue" && new Date(event.createdAt) >= todayStart) {
      revenueTodayCents += Math.max(Number(event.amount || 0), 0);
    }
    if (!metadataSeen && event.metadata && typeof event.metadata === "object") {
      metadataSeen = true;
      const meta = event.metadata as Record<string, unknown>;
      metadataRequests = Number(meta.requests7d || metadataRequests || 0);
      metadataFillRate = Number(meta.fillRate || metadataFillRate || 0);
      metadataErrors = Number(meta.sdkErrors || metadataErrors || 0);
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
