import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { adRequestSchema, trackEventSchema } from "../../_shared/validation.ts";
import { requireSdkKey, requireSdkSignature, ensureSdkBotScope } from "../../_shared/sdk-auth.ts";
import { selectAdForRequest, toSdkAd, sdkTrackEventTypes } from "../../_shared/ads.ts";
import { cpmiCents, getPlatformCpmRate } from "../../_shared/money.ts";

// Mounted at /api (so /api/ads + /api/track/:eventType). Ports server/src/routes/sdk.ts.
const sdk = new Hono<Env>();

// POST /api/ads
sdk.post("/ads", requireSdkKey, requireSdkSignature, async (c) => {
  const parsed = adRequestSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ success: false, error: "Invalid ad request", details: parsed.error.flatten() }, 400);
  try {
    const scope = ensureSdkBotScope(c, parsed.data.botId);
    if (!scope.ok) return c.json({ error: scope.error }, (scope.status ?? 403) as 403);
    const selected = await selectAdForRequest({ format: parsed.data.format, topic: parsed.data.context?.topic || "" });
    if (!selected) return c.json({ success: true, data: [] });
    return c.json({ success: true, data: [toSdkAd(selected)] });
  } catch (err) {
    console.error("Ad fetch failed", err);
    return c.json({ success: false, error: "Failed to fetch ads" }, 500);
  }
});

// POST /api/track/:eventType
sdk.post("/track/:eventType", requireSdkKey, requireSdkSignature, async (c) => {
  const eventType = c.req.param("eventType");
  if (!sdkTrackEventTypes.has(eventType)) return c.json({ error: "Invalid event type" }, 400);
  const parsed = trackEventSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid tracking payload", details: parsed.error.flatten() }, 400);
  try {
    const scope = ensureSdkBotScope(c, parsed.data.botId);
    if (!scope.ok) return c.json({ error: scope.error }, (scope.status ?? 403) as 403);
    const d = parsed.data;
    await sql`
      INSERT INTO ad_events ("id","eventType","adId","botId","userId","topic","amount","metadata","createdAt")
      VALUES (${newId()}, ${eventType}, ${d.adId}, ${d.botId}, ${d.userId ?? null}, ${d.topic ?? null},
              ${d.amount ?? null}, ${d.metadata ? sql.json(d.metadata) : null}, now())`;

    // Auto-generate a revenue event for budget-managed ads on each impression.
    if (eventType === "impression") {
      try {
        const adRows = await sql`SELECT "format","dailyBudgetCents","lifetimeBudgetCents" FROM ads WHERE "id" = ${d.adId} LIMIT 1`;
        const ad = adRows[0];
        if (ad && (ad.dailyBudgetCents > 0 || ad.lifetimeBudgetCents > 0)) {
          const cpmCents = await getPlatformCpmRate(ad.format);
          const chargeAmountCents = cpmiCents(cpmCents);
          await sql`
            INSERT INTO ad_events ("id","eventType","adId","botId","amount","metadata","createdAt")
            VALUES (${newId()}, 'revenue', ${d.adId}, ${d.botId}, ${chargeAmountCents},
                    ${sql.json({ source: "auto_cpm", cpmCents })}, now())`;
        }
      } catch (autoErr) {
        console.error("Auto-revenue generation failed", autoErr);
      }
    }
    return c.json({ success: true }, 201);
  } catch (err) {
    console.error("Event track failed", err);
    return c.json({ error: "Failed to track event" }, 500);
  }
});

export default sdk;
