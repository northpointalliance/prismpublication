import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { createBotPublicId } from "../../_shared/crypto.ts";
import { publisherBotCreateSchema, publisherBotUpdateSchema, publisherCreateSdkKeySchema } from "../../_shared/validation.ts";
import { requirePortalUser, requirePublisherWorkspace } from "../../_shared/portal.ts";
import { createPublisherSdkKey, toPublicSdkKey } from "../../_shared/sdk-keys.ts";
import { summarizeBotMetrics } from "../../_shared/bot-metrics.ts";

// Mounted at /api/publisher. Ports server/src/routes/publisher.ts.
// NOTE: bot metrics use a metadata-derived summary, so events are summarized in JS (mirrors Express).
// Data volumes are small; if a single bot exceeds tens of thousands of events, move to SQL aggregation.
const publisher = new Hono<Env>();
const DAY_MS = 86_400_000;

const fetchActiveKeysByBot = async (botDbIds: string[], onlyActive: boolean) => {
  if (!botDbIds.length) return new Map<string, Record<string, unknown>[]>();
  const rows = onlyActive
    ? await sql`SELECT "id","botId","label","prefix","last4","createdAt","revokedAt" FROM bot_sdk_keys
                WHERE "botId" = ANY(${botDbIds}) AND "revokedAt" IS NULL ORDER BY "createdAt" DESC`
    : await sql`SELECT "id","botId","label","prefix","last4","createdAt","revokedAt" FROM bot_sdk_keys
                WHERE "botId" = ANY(${botDbIds}) ORDER BY "createdAt" DESC`;
  const byBot = new Map<string, Record<string, unknown>[]>();
  for (const k of rows) {
    if (!byBot.has(k.botId)) byBot.set(k.botId, []);
    byBot.get(k.botId)!.push(k);
  }
  return byBot;
};

// GET /api/publisher/dashboard
publisher.get("/dashboard", requirePortalUser, async (c) => {
  try {
    const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Bot developer workspace required" }, 403);
    const bots = await sql`
      SELECT * FROM publisher_bots WHERE "organizationId" = ${workspace.organization.id} AND "deletedAt" IS NULL
      ORDER BY "updatedAt" DESC`;
    const keysByBot = await fetchActiveKeysByBot(bots.map((b) => b.id), true);
    const publicIds = bots.map((b) => b.publicId);
    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
    const events = publicIds.length
      ? await sql`
          SELECT "botId","eventType","amount","createdAt","metadata" FROM ad_events
          WHERE "botId" = ANY(${publicIds}) AND "createdAt" >= ${sevenDaysAgo}
          ORDER BY "createdAt" DESC LIMIT 3000`
      : [];
    // deno-lint-ignore no-explicit-any
    const evByBot = new Map<string, any[]>();
    for (const e of events) {
      if (!evByBot.has(e.botId)) evByBot.set(e.botId, []);
      evByBot.get(e.botId)!.push(e);
    }

    const payloadBots = bots.map((bot) => {
      const metrics = summarizeBotMetrics(evByBot.get(bot.publicId) || [], bot);
      const keys = keysByBot.get(bot.id) || [];
      const newestKey = keys[0] || null;
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
        activeKeyCount: keys.length,
        lastKeyPrefix: (newestKey?.prefix as string) || null,
        lastKeyCreatedAt: (newestKey?.createdAt as Date) || null,
      };
    });

    const totalRequests = payloadBots.reduce((a, b) => a + b.requests7d, 0);
    const weightedFillRate = totalRequests > 0
      ? payloadBots.reduce((a, b) => a + b.fillRate7d * b.requests7d, 0) / totalRequests
      : 0;
    const revenueTodayCents = payloadBots.reduce((a, b) => a + b.revenueTodayCents, 0);
    const sdkErrors = payloadBots.reduce((a, b) => a + b.sdkErrors, 0);
    return c.json({
      summary: { registeredBots: payloadBots.length, fillRate7d: weightedFillRate, revenueTodayCents, sdkErrors },
      bots: payloadBots,
    });
  } catch (err) {
    console.error("Publisher dashboard failed", err);
    return c.json({ error: "Failed to load publisher dashboard" }, 500);
  }
});

// GET /api/publisher/bots — keyset pagination on (updatedAt, id), with all sdk keys.
publisher.get("/bots", requirePortalUser, async (c) => {
  try {
    const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Bot developer workspace required" }, 403);
    const orgId = workspace.organization.id;
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 50, 1), 100);
    const cursor = c.req.query("cursor") || undefined;

    let bots;
    if (cursor) {
      const cur = await sql`SELECT "updatedAt" FROM publisher_bots WHERE "id" = ${cursor} AND "organizationId" = ${orgId} LIMIT 1`;
      bots = cur.length
        ? await sql`SELECT * FROM publisher_bots WHERE "organizationId" = ${orgId} AND "deletedAt" IS NULL
                    AND ("updatedAt","id") < (${cur[0].updatedAt}, ${cursor})
                    ORDER BY "updatedAt" DESC, "id" DESC LIMIT ${limit + 1}`
        : await sql`SELECT * FROM publisher_bots WHERE "organizationId" = ${orgId} AND "deletedAt" IS NULL
                    ORDER BY "updatedAt" DESC, "id" DESC LIMIT ${limit + 1}`;
    } else {
      bots = await sql`SELECT * FROM publisher_bots WHERE "organizationId" = ${orgId} AND "deletedAt" IS NULL
                       ORDER BY "updatedAt" DESC, "id" DESC LIMIT ${limit + 1}`;
    }
    const hasMore = bots.length > limit;
    const pageBots = hasMore ? bots.slice(0, limit) : bots;
    const nextCursor = hasMore ? pageBots[pageBots.length - 1].id : null;
    const keysByBot = await fetchActiveKeysByBot(pageBots.map((b) => b.id), false);

    return c.json({
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
        sdkKeys: (keysByBot.get(bot.id) || []).map(toPublicSdkKey),
        placementPolicy: bot.placementPolicy ?? null,
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt,
      })),
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error("Publisher bot list failed", err);
    return c.json({ error: "Failed to fetch bots" }, 500);
  }
});

// POST /api/publisher/bots — create bot + initial SDK key.
publisher.post("/bots", requirePortalUser, async (c) => {
  const parsed = publisherBotCreateSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid bot payload", details: parsed.error.flatten() }, 400);
  try {
    const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Bot developer workspace required" }, 403);
    const orgId = workspace.organization.id;
    const d = parsed.data;
    const publicId = createBotPublicId({ organizationId: orgId, name: d.name });
    const rows = await sql`
      INSERT INTO publisher_bots ("id","organizationId","name","publicId","environment","health","placementPolicy","updatedAt")
      VALUES (${newId()}, ${orgId}, ${d.name}, ${publicId}, ${d.environment}, ${d.health},
              ${d.placementPolicy ? sql.json(d.placementPolicy) : null}, now())
      RETURNING *`;
    const bot = rows[0];
    const initialSdkKey = await createPublisherSdkKey({ botId: bot.id, label: "Primary" });
    return c.json({
      bot: { id: bot.id, botId: bot.publicId, name: bot.name, environment: bot.environment, health: bot.health, isActive: bot.isActive },
      initialSdkKey,
    }, 201);
  } catch (err) {
    console.error("Publisher bot create failed", err);
    return c.json({ error: "Failed to create bot" }, 500);
  }
});

// PATCH /api/publisher/bots/:id
publisher.patch("/bots/:id", requirePortalUser, async (c) => {
  const parsed = publisherBotUpdateSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid bot update payload", details: parsed.error.flatten() }, 400);
  try {
    const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Bot developer workspace required" }, 403);
    const existing = await sql`
      SELECT "id" FROM publisher_bots WHERE "id" = ${c.req.param("id")} AND "organizationId" = ${workspace.organization.id} AND "deletedAt" IS NULL LIMIT 1`;
    if (!existing.length) return c.json({ error: "Bot not found" }, 404);
    // placementPolicy (jsonb) handled separately; the rest go through the dynamic update.
    const { placementPolicy, ...scalars } = parsed.data;
    const updateData: Record<string, unknown> = { ...scalars, updatedAt: new Date() };
    let rows = await sql`UPDATE publisher_bots SET ${sql(updateData)} WHERE "id" = ${existing[0].id} RETURNING *`;
    if (placementPolicy !== undefined) {
      rows = await sql`UPDATE publisher_bots SET "placementPolicy" = ${placementPolicy ? sql.json(placementPolicy) : null}, "updatedAt" = now()
                       WHERE "id" = ${existing[0].id} RETURNING *`;
    }
    return c.json(rows[0]);
  } catch (err) {
    console.error("Publisher bot update failed", err);
    return c.json({ error: "Failed to update bot" }, 500);
  }
});

// DELETE /api/publisher/bots/:id — soft delete.
publisher.delete("/bots/:id", requirePortalUser, async (c) => {
  try {
    const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Bot developer workspace required" }, 403);
    const existing = await sql`
      SELECT "id","name","publicId" FROM publisher_bots WHERE "id" = ${c.req.param("id")} AND "organizationId" = ${workspace.organization.id} AND "deletedAt" IS NULL LIMIT 1`;
    if (!existing.length) return c.json({ error: "Bot not found" }, 404);
    await sql`UPDATE publisher_bots SET "deletedAt" = now(), "isActive" = false, "updatedAt" = now() WHERE "id" = ${existing[0].id}`;
    return c.json({ success: true, deleted: { id: existing[0].id, name: existing[0].name, botId: existing[0].publicId } });
  } catch (err) {
    console.error("Publisher bot delete failed", err);
    return c.json({ error: "Failed to delete bot" }, 500);
  }
});

// POST /api/publisher/bots/:id/keys — rotate SDK key (revokes existing).
publisher.post("/bots/:id/keys", requirePortalUser, async (c) => {
  const parsed = publisherCreateSdkKeySchema.safeParse((await readJson(c)) || {});
  if (!parsed.success) return c.json({ error: "Invalid key payload", details: parsed.error.flatten() }, 400);
  try {
    const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Bot developer workspace required" }, 403);
    const bot = await sql`
      SELECT "id","publicId","name" FROM publisher_bots WHERE "id" = ${c.req.param("id")} AND "organizationId" = ${workspace.organization.id} AND "deletedAt" IS NULL LIMIT 1`;
    if (!bot.length) return c.json({ error: "Bot not found" }, 404);
    const key = await createPublisherSdkKey({ botId: bot[0].id, label: parsed.data.label, revokeExisting: true });
    return c.json({ botId: bot[0].publicId, key }, 201);
  } catch (err) {
    console.error("Publisher key create failed", err);
    return c.json({ error: "Failed to create SDK key" }, 500);
  }
});

// GET /api/publisher/bots/:id/metrics
publisher.get("/bots/:id/metrics", requirePortalUser, async (c) => {
  try {
    const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Bot developer workspace required" }, 403);
    const botRows = await sql`
      SELECT "id","publicId","name","requests7d","fillRateHint","sdkErrorsHint" FROM publisher_bots
      WHERE "id" = ${c.req.param("id")} AND "organizationId" = ${workspace.organization.id} AND "deletedAt" IS NULL LIMIT 1`;
    if (!botRows.length) return c.json({ error: "Bot not found" }, 404);
    const bot = botRows[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
    const events = await sql`
      SELECT "eventType","amount","createdAt","metadata" FROM ad_events
      WHERE "botId" = ${bot.publicId} AND "createdAt" >= ${sevenDaysAgo}
      ORDER BY "createdAt" DESC LIMIT 1200`;
    const metrics = summarizeBotMetrics(events, bot);
    return c.json({
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
    console.error("Publisher bot metrics failed", err);
    return c.json({ error: "Failed to fetch bot metrics" }, 500);
  }
});

// GET /api/publisher/signals/usage?days=30 — Signals score call metering for the org.
publisher.get("/signals/usage", requirePortalUser, async (c) => {
  try {
    const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Bot developer workspace required" }, 403);
    const days = Math.min(Math.max(Number(c.req.query("days")) || 30, 1), 90);
    const since = new Date(Date.now() - days * DAY_MS);
    const orgId = workspace.organization.id;

    const [totals, byDay, byAction] = await Promise.all([
      sql`
        SELECT count(*)::int AS total,
               coalesce(sum(CASE WHEN "createdAt" >= ${new Date(Date.now() - 7 * DAY_MS)} THEN 1 ELSE 0 END), 0)::int AS last7d,
               coalesce(sum(CASE WHEN "usedLlm" THEN 1 ELSE 0 END), 0)::int AS llmCalls
        FROM signal_events
        WHERE "organizationId" = ${orgId} AND "createdAt" >= ${since}`,
      sql`
        SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, count(*)::int AS count
        FROM signal_events
        WHERE "organizationId" = ${orgId} AND "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1 ASC`,
      sql`
        SELECT "action", count(*)::int AS count
        FROM signal_events
        WHERE "organizationId" = ${orgId} AND "createdAt" >= ${since}
        GROUP BY 1 ORDER BY count DESC`,
    ]);

    return c.json({
      days,
      total: totals[0]?.total ?? 0,
      last7d: totals[0]?.last7d ?? 0,
      llmCalls: totals[0]?.llmCalls ?? 0,
      byDay,
      byAction,
    });
  } catch (err) {
    console.error("Publisher signals usage failed", err);
    return c.json({ error: "Failed to load signals usage" }, 500);
  }
});

export default publisher;
