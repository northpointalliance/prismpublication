import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { advertiserCampaignCreateSchema, advertiserCampaignUpdateSchema } from "../../_shared/validation.ts";
import { requirePortalUser, requireAdvertiserWorkspace } from "../../_shared/portal.ts";
import { validateImageUrl } from "../../_shared/image-validation.ts";
import { logAudit, ipFromHeaders } from "../../_shared/audit.ts";
import { supabaseAdmin, AD_BUCKET } from "../../_shared/storage.ts";

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
      const cur = await sql`SELECT "updatedAt" FROM ads WHERE "id" = ${cursor} AND "advertiser" = ${advertiserKey} LIMIT 1`;
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

// POST /api/advertiser/campaigns/image — multipart upload to Supabase Storage; returns a public URL.
advertiser.post("/campaigns/image", requirePortalUser, async (c) => {
  try {
    const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
    const form = await c.req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) return c.json({ error: "No image file provided" }, 400);
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      return c.json({ error: "Only JPEG, PNG, WebP and GIF images are allowed" }, 400);
    }
    if (file.size > 5 * 1024 * 1024) return c.json({ error: "Image exceeds the 5 MB size limit" }, 400);

    const safe = file.name.replace(/[^a-z0-9._-]/gi, "_").toLowerCase();
    const objectPath = `${workspace.organization.id}/${Date.now()}-${safe}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await supabaseAdmin.storage.from(AD_BUCKET).upload(objectPath, bytes, {
      contentType: file.type, upsert: false,
    });
    if (upErr) throw upErr;
    const { data } = supabaseAdmin.storage.from(AD_BUCKET).getPublicUrl(objectPath);
    return c.json({ imageUrl: data.publicUrl });
  } catch (err) {
    console.error("Advertiser image upload failed", err);
    return c.json({ error: "Failed to upload image" }, 500);
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
    const orgId = workspace.organization.id;
    const advertiserKey = `org:${orgId}`;
    const d = parsed.data;
    const endsAt = d.durationDays ? new Date(Date.now() + d.durationDays * DAY_MS) : null;
    const reserveCents = d.lifetimeBudgetCents ?? 0;

    // Create the ad and reserve its lifetime budget from the wallet in ONE transaction so we never
    // end up with an unfunded campaign or a charge without a campaign. The wallet row is locked
    // (FOR UPDATE) so concurrent reservations cannot overdraw.
    const result = await sql.begin(async (tx) => {
      let newBalanceCents: number;
      let prevBalanceCents = 0;
      if (reserveCents > 0) {
        const orgRows = await tx`SELECT "walletBalanceCents" FROM organizations WHERE "id" = ${orgId} FOR UPDATE`;
        prevBalanceCents = orgRows[0]?.walletBalanceCents ?? 0;
        if (prevBalanceCents < reserveCents) return { ok: false as const };
        await tx`
          INSERT INTO wallet_transactions ("id","organizationId","type","amountCents","description","createdAt")
          VALUES (${newId()}, ${orgId}, 'spend', ${reserveCents}, ${`Budget for campaign: ${d.title}`}, now())`;
        const updated = await tx`
          UPDATE organizations SET "walletBalanceCents" = "walletBalanceCents" - ${reserveCents}, "updatedAt" = now()
          WHERE "id" = ${orgId} RETURNING "walletBalanceCents"`;
        newBalanceCents = updated[0].walletBalanceCents;
      } else {
        const orgRows = await tx`SELECT "walletBalanceCents" FROM organizations WHERE "id" = ${orgId} LIMIT 1`;
        newBalanceCents = orgRows[0]?.walletBalanceCents ?? 0;
        prevBalanceCents = newBalanceCents;
      }
      const rows = await tx`
        INSERT INTO ads ("id","title","description","ctaText","clickUrl","imageUrl","advertiser","topics",
          "format","weight","isActive","dailyBudgetCents","lifetimeBudgetCents","endsAt","updatedAt")
        VALUES (${newId()}, ${d.title}, ${d.description}, ${d.ctaText}, ${d.clickUrl}, ${d.imageUrl ?? null},
          ${advertiserKey}, ${d.topics}::text[], ${d.format}, ${d.weight}, ${d.isActive ?? false},
          ${d.dailyBudgetCents}, ${d.lifetimeBudgetCents}, ${endsAt}, now())
        RETURNING *`;
      return { ok: true as const, ad: rows[0], newBalanceCents, prevBalanceCents };
    });

    if (!result.ok) return c.json({ error: "Insufficient wallet balance for campaign budget" }, 400);

    if (reserveCents > 0) {
      await logAudit({
        action: "WALLET_SPEND",
        actorUserId: c.get("portalUser")!.id,
        organizationId: orgId,
        resourceType: "ad",
        resourceId: result.ad.id,
        before: { walletBalanceCents: result.prevBalanceCents },
        after: { walletBalanceCents: result.newBalanceCents, amountCents: reserveCents },
        ip: ipFromHeaders(c.req.raw.headers),
      });
    }
    return c.json({ ...result.ad, walletBalanceCents: result.newBalanceCents }, 201);
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

    // Lifetime budget is the wallet reservation made at create time and is immutable afterwards —
    // never let a PATCH change it, or the reservation would desync from the wallet. Daily budget
    // (pacing only) and the creative fields can still change freely.
    const { durationDays, lifetimeBudgetCents: _ignoredLifetime, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (durationDays !== undefined) updateData.endsAt = new Date(Date.now() + durationDays * DAY_MS);

    const rows = await sql`UPDATE ads SET ${sql(updateData)} WHERE "id" = ${existing[0].id} RETURNING *`;
    return c.json(rows[0]);
  } catch (err) {
    console.error("Advertiser campaign update failed", err);
    return c.json({ error: "Failed to update campaign" }, 500);
  }
});

// DELETE /api/advertiser/campaigns/:id — soft delete + refund the unspent reserved budget.
advertiser.delete("/campaigns/:id", requirePortalUser, async (c) => {
  try {
    const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
    if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
    const orgId = workspace.organization.id;
    const advertiserKey = `org:${orgId}`;
    const existing = await sql`
      SELECT "id","title","lifetimeBudgetCents" FROM ads
      WHERE "id" = ${c.req.param("id")} AND "advertiser" = ${advertiserKey} AND "deletedAt" IS NULL LIMIT 1`;
    if (!existing.length) return c.json({ error: "Campaign not found" }, 404);
    const ad = existing[0];

    // Refund = reserved lifetime budget − what was actually spent on impressions (revenue events).
    // Done in one transaction with the wallet locked so the soft-delete and credit are atomic.
    const result = await sql.begin(async (tx) => {
      // The conditional soft-delete is the atomic gate: only the txn that actually flips deletedAt
      // (one of N concurrent deletes) proceeds to refund. A second concurrent delete blocks on the
      // row lock, then matches 0 rows after the first commits → no double-refund.
      const deleted = await tx`
        UPDATE ads SET "deletedAt" = now(), "isActive" = false, "updatedAt" = now()
        WHERE "id" = ${ad.id} AND "deletedAt" IS NULL
        RETURNING "lifetimeBudgetCents"`;
      if (!deleted.length) return { refundCents: 0, walletBalanceCents: null as number | null, prevBalanceCents: 0 };

      const spentRows = await tx`
        SELECT coalesce(sum("amount"), 0) AS spent FROM ad_events
        WHERE "adId" = ${ad.id} AND "eventType" = 'revenue'`;
      const spentCents = Number(spentRows[0]?.spent ?? 0);
      const refundCents = Math.max(0, (deleted[0].lifetimeBudgetCents ?? 0) - spentCents);

      let walletBalanceCents: number | null = null;
      let prevBalanceCents = 0;
      if (refundCents > 0) {
        const orgRows = await tx`SELECT "walletBalanceCents" FROM organizations WHERE "id" = ${orgId} FOR UPDATE`;
        prevBalanceCents = orgRows[0]?.walletBalanceCents ?? 0;
        await tx`
          INSERT INTO wallet_transactions ("id","organizationId","type","amountCents","description","createdAt")
          VALUES (${newId()}, ${orgId}, 'refund', ${refundCents}, ${`Refund — deleted campaign: ${ad.title}`}, now())`;
        const updated = await tx`
          UPDATE organizations SET "walletBalanceCents" = "walletBalanceCents" + ${refundCents}, "updatedAt" = now()
          WHERE "id" = ${orgId} RETURNING "walletBalanceCents"`;
        walletBalanceCents = updated[0].walletBalanceCents;
      }
      return { refundCents, walletBalanceCents, prevBalanceCents };
    });

    if (result.refundCents > 0) {
      await logAudit({
        action: "WALLET_REFUND",
        actorUserId: c.get("portalUser")!.id,
        organizationId: orgId,
        resourceType: "ad",
        resourceId: ad.id,
        before: { walletBalanceCents: result.prevBalanceCents },
        after: { walletBalanceCents: result.walletBalanceCents, refundedCents: result.refundCents },
        ip: ipFromHeaders(c.req.raw.headers),
      });
    }
    return c.json({
      success: true,
      deleted: { id: ad.id, title: ad.title },
      refundedCents: result.refundCents,
      walletBalanceCents: result.walletBalanceCents,
    });
  } catch (err) {
    console.error("Advertiser campaign delete failed", err);
    return c.json({ error: "Failed to delete campaign" }, 500);
  }
});

export default advertiser;
