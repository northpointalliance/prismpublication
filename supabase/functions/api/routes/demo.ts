import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { demoAdRequestSchema, demoTrackEventSchema } from "../../_shared/validation.ts";
import { selectAdForRequest, toSdkAd, demoTrackEventTypes } from "../../_shared/ads.ts";

// Mounted at /api/demo. Public, no auth. Ports server/src/routes/demo.ts.
const demo = new Hono<Env>();

// POST /api/demo/ads
demo.post("/ads", async (c) => {
  const parsed = demoAdRequestSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ success: false, error: "Invalid demo ad request", details: parsed.error.flatten() }, 400);
  try {
    const selected = await selectAdForRequest({ format: parsed.data.format, topic: parsed.data.context?.topic || "" });
    if (!selected) return c.json({ success: true, data: [] });
    return c.json({ success: true, data: [toSdkAd(selected)] });
  } catch (err) {
    console.error("Demo ad fetch failed", err);
    return c.json({ success: false, error: "Failed to fetch demo ads" }, 500);
  }
});

// POST /api/demo/track/:eventType
demo.post("/track/:eventType", async (c) => {
  const eventType = c.req.param("eventType");
  if (!demoTrackEventTypes.has(eventType)) return c.json({ error: "Invalid demo event type" }, 400);
  const parsed = demoTrackEventSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid demo tracking payload", details: parsed.error.flatten() }, 400);
  try {
    const d = parsed.data;
    await sql`
      INSERT INTO ad_events ("id","eventType","adId","botId","userId","topic","metadata","createdAt")
      VALUES (${newId()}, ${eventType}, ${d.adId}, 'demo-public', ${d.userId ?? null}, ${d.topic ?? null},
              ${sql.json({ source: "public_demo" })}, now())`;
    return c.json({ success: true }, 201);
  } catch (err) {
    console.error("Demo event track failed", err);
    return c.json({ error: "Failed to track demo event" }, 500);
  }
});

export default demo;
