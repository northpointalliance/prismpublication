import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { advertiserCampaignCreateSchema, advertiserCampaignUpdateSchema } from "../../_shared/validation.ts";
import { requirePortalUser, requireAdvertiserWorkspace } from "../../_shared/portal.ts";
import { validateImageUrl } from "../../_shared/image-validation.ts";

// Mounted at /api/advertiser. Ports server/src/routes/advertiser.ts.
// Dashboard aggregation rewritten from in-memory loops to SQL GROUP BY (Edge 2s-CPU fix).
const advertiser = new Hono<Env>();
const DAY_MS = 86_400_000;

// GET /api/advertiser/dashboard
advertiser.get("/dashboard", requirePortalUser, async (c) => {
  try {
    const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
    // NOTE: seedWorkspaceMockData (demo data) not yet ported.
    const advertiserKey = `org:${workspace.organization.id}`;
    const campaigns = await sql`
      SELECT * FROM ads WHERE "advertiser" = ${advertiserKey} AND "deletedAt" IS NULL
      ORDER BY "updatedAt" DESC LIMIT 50`;
    const ids = campaigns.map((r) => r.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const statRows = ids.length
      ? await sql`
          SELECT "adId",
            count(*) FILTER (WHERE "eventType" = 'impression') AS impressions,
            count(*) FILTER (WHERE "eventType" = 'click') AS clicks,
            coalesce(sum(GREATEST("amount", 0)) FILTER (WHERE "eventType" = 'revenue'), 0) AS spend_cents,
            coalesce(sum(GREATEST("amount", 0)) FILTER (WHERE "eventType" = 'revenue' AND "createdAt" >= ${todayStart}), 0) AS spend_today_cents
          FROM ad_events
          WHERE "adId" = ANY(${ids}) AND "createdAt" >= ${sevenDaysAgo}
          GROUP BY "adId"`
      : [];
    const byId = new Map(statRows.map((r) => [r.adId, r]));

    let totalImpressions = 0, totalClicks = 0, spendTodayCents = 0;
    const payloadCampaigns = campaigns.map((campaign) => {
      const s = byId.get(campaign.id);
      const impressions = Number(s?.impressions || 0);
      const clicks = Number(s?.clicks || 0);
      const spendCents = Number(s?.spend_cents || 0);
      totalImpressions += impressions;
      totalClicks += clicks;
      spendTodayCents += Number(s?.spend_today_cents || 0);
      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.isActive ? "Live" : "Review",
        format: campaign.format,
        weight: campaign.weight,
        impressions7d: impressions,
        clicks7d: clicks,
        ctr7d: impressions > 0 ? (clicks / impressions) * 100 : 0,
        spend7dCents: spendCents,
      };
    });

    const ctr7d = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const pendingReview = payloadCampaigns.filter((x) => x.status === "Review").length;
    const activeCampaigns = payloadCampaigns.filter((x) => x.status === "Live").length;
    return c.json({ summary: { activeCampaigns, pendingReview, spendTodayCents, ctr7d }, campaigns: payloadCampaigns });
  } catch (err) {
    console.error("Advertiser dashboard failed", err);
    return c.json({ error: "Failed to load advertiser dashboard" }, 500);
  }
});

// GET /api/advertiser/campaigns — keyset pagination on (updatedAt, id).
advertiser.get("/campaigns", requirePortalUser, async (c) => {
  try {
    const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 50, 1), 100);
    const cursor = c.req.query("cursor") || undefined;
    const advertiserKey = `org:${workspace.organization.id}`;

    let rows;
    if (cursor) {
      const cur = await sql`SELECT "updatedAt" FROM ads WHERE "id" = ${cursor} LIMIT 1`;
      rows = cur.length
        ? await sql`
            SELECT * FROM ads
            WHERE "advertiser" = ${advertiserKey} AND "deletedAt" IS NULL
              AND ("updatedAt", "id") < (${cur[0].updatedAt}, ${cursor})
            ORDER BY "updatedAt" DESC, "id" DESC LIMIT ${limit + 1}`
        : await sql`
            SELECT * FROM ads WHERE "advertiser" = ${advertiserKey} AND "deletedAt" IS NULL
            ORDER BY "updatedAt" DESC, "id" DESC LIMIT ${limit + 1}`;
    } else {
      rows = await sql`
        SELECT * FROM ads WHERE "advertiser" = ${advertiserKey} AND "deletedAt" IS NULL
        ORDER BY "updatedAt" DESC, "id" DESC LIMIT ${limit + 1}`;
    }
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    return c.json({ items, nextCursor, hasMore });
  } catch (err) {
    console.error("Advertiser campaign list failed", err);
    return c.json({ error: "Failed to fetch campaigns" }, 500);
  }
});

// POST /api/advertiser/campaigns
advertiser.post("/campaigns", requirePortalUser, async (c) => {
  const parsed = advertiserCampaignCreateSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid campaign payload", details: parsed.error.flatten() }, 400);
  try {
    if (parsed.data.imageUrl) {
      try {
        await validateImageUrl(parsed.data.imageUrl);
      } catch (imgErr) {
        return c.json({ error: `Image validation failed: ${(imgErr as Error).message}` }, 400);
      }
    }
    const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
    const advertiserKey = `org:${workspace.organization.id}`;
    const d = parsed.data;
    const endsAt = d.durationDays ? new Date(Date.now() + d.durationDays * DAY_MS) : null;
    const rows = await sql`
      INSERT INTO ads ("id","title","description","ctaText","clickUrl","imageUrl","advertiser","topics",
        "format","weight","isActive","dailyBudgetCents","lifetimeBudgetCents","endsAt","updatedAt")
      VALUES (${newId()}, ${d.title}, ${d.description}, ${d.ctaText}, ${d.clickUrl}, ${d.imageUrl ?? null},
        ${advertiserKey}, ${d.topics}::text[], ${d.format}, ${d.weight}, ${d.isActive ?? false},
        ${d.dailyBudgetCents}, ${d.lifetimeBudgetCents}, ${endsAt}, now())
      RETURNING *`;
    return c.json(rows[0], 201);
  } catch (err) {
    console.error("Advertiser campaign create failed", err);
    return c.json({ error: "Failed to create campaign" }, 500);
  }
});

// PATCH /api/advertiser/campaigns/:id
advertiser.patch("/campaigns/:id", requirePortalUser, async (c) => {
  const parsed = advertiserCampaignUpdateSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid campaign update payload", details: parsed.error.flatten() }, 400);
  try {
    if (parsed.data.imageUrl) {
      try {
        await validateImageUrl(parsed.data.imageUrl);
      } catch (imgErr) {
        return c.json({ error: `Image validation failed: ${(imgErr as Error).message}` }, 400);
      }
    }
    const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
    const advertiserKey = `org:${workspace.organization.id}`;
    const existing = await sql`
      SELECT "id" FROM ads WHERE "id" = ${c.req.param("id")} AND "advertiser" = ${advertiserKey} AND "deletedAt" IS NULL LIMIT 1`;
    if (!existing.length) return c.json({ error: "Campaign not found" }, 404);

    const { durationDays, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (durationDays !== undefined) updateData.endsAt = new Date(Date.now() + durationDays * DAY_MS);

    const rows = await sql`UPDATE ads SET ${sql(updateData)} WHERE "id" = ${existing[0].id} RETURNING *`;
    return c.json(rows[0]);
  } catch (err) {
    console.error("Advertiser campaign update failed", err);
    return c.json({ error: "Failed to update campaign" }, 500);
  }
});

// DELETE /api/advertiser/campaigns/:id — soft delete.
advertiser.delete("/campaigns/:id", requirePortalUser, async (c) => {
  try {
    const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
    const advertiserKey = `org:${workspace.organization.id}`;
    const existing = await sql`
      SELECT "id","title" FROM ads WHERE "id" = ${c.req.param("id")} AND "advertiser" = ${advertiserKey} AND "deletedAt" IS NULL LIMIT 1`;
    if (!existing.length) return c.json({ error: "Campaign not found" }, 404);
    await sql`UPDATE ads SET "deletedAt" = now(), "isActive" = false, "updatedAt" = now() WHERE "id" = ${existing[0].id}`;
    return c.json({ success: true, deleted: { id: existing[0].id, title: existing[0].title } });
  } catch (err) {
    console.error("Advertiser campaign delete failed", err);
    return c.json({ error: "Failed to delete campaign" }, 500);
  }
});

export default advertiser;
