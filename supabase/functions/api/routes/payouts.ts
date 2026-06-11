import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { requirePortalUser, requirePublisherWorkspace } from "../../_shared/portal.ts";
import { getPayPalConfig, sendPayPalPayout, getPlatformFeePct } from "../../_shared/paypal.ts";
import { calcPublisherAvailable, checkWithdrawMinimum } from "../../_shared/money.ts";
import { logAudit, ipFromHeaders } from "../../_shared/audit.ts";

// Mounted at /api/payouts. Ports server/src/routes/payouts.ts.
const payouts = new Hono<Env>();

const activeBotIds = async (orgId: string): Promise<string[]> => {
  const rows = await sql`SELECT "id" FROM publisher_bots WHERE "organizationId" = ${orgId} AND "isActive" = true`;
  return rows.map((r) => r.id);
};
const sumRevenue = async (botIds: string[]): Promise<number> => {
  if (!botIds.length) return 0;
  const rows = await sql`SELECT coalesce(sum("amount"), 0) AS total FROM ad_events WHERE "eventType" = 'revenue' AND "botId" = ANY(${botIds})`;
  return Number(rows[0].total) || 0;
};
const sumPaid = async (orgId: string): Promise<number> => {
  const rows = await sql`SELECT coalesce(sum("amountCents"), 0) AS total FROM payout_requests
    WHERE "organizationId" = ${orgId} AND "status" IN ('paid', 'processing')`;
  return Number(rows[0].total) || 0;
};

// GET /api/payouts/balance
payouts.get("/balance", requirePortalUser, async (c) => {
  const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
  if (!workspace) return c.json({ error: "Publisher workspace required" }, 403);
  try {
    const orgId = workspace.organization.id;
    const orgRows = await sql`SELECT "paypalEmail" FROM organizations WHERE "id" = ${orgId} LIMIT 1`;
    const totalEarnedCents = await sumRevenue(await activeBotIds(orgId));
    const totalPaidCents = await sumPaid(orgId);
    const feePct = await getPlatformFeePct();
    const { grossAvailableCents, availableCents } = calcPublisherAvailable(totalEarnedCents, totalPaidCents, feePct);
    const recentPayouts = await sql`SELECT * FROM payout_requests WHERE "organizationId" = ${orgId} ORDER BY "createdAt" DESC LIMIT 10`;
    return c.json({
      totalEarnedCents,
      totalPaidCents,
      grossAvailableCents,
      availableCents,
      platformFeePct: feePct,
      paypalEmail: orgRows[0]?.paypalEmail ?? null,
      recentPayouts,
    });
  } catch (err) {
    console.error("Payout balance error", err);
    return c.json({ error: "Failed to fetch payout balance" }, 500);
  }
});

// PUT /api/payouts/paypal-email
payouts.put("/paypal-email", requirePortalUser, async (c) => {
  const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
  if (!workspace) return c.json({ error: "Publisher workspace required" }, 403);
  const parsed = z.object({ paypalEmail: z.string().trim().email().max(200) }).safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid PayPal email" }, 400);
  try {
    await sql`UPDATE organizations SET "paypalEmail" = ${parsed.data.paypalEmail}, "updatedAt" = now() WHERE "id" = ${workspace.organization.id}`;
    return c.json({ ok: true });
  } catch (err) {
    console.error("Save PayPal email error", err);
    return c.json({ error: "Failed to save PayPal email" }, 500);
  }
});

// POST /api/payouts/withdraw
payouts.post("/withdraw", requirePortalUser, async (c) => {
  const workspace = await requirePublisherWorkspace(c.get("portalUser")!.id);
  if (!workspace) return c.json({ error: "Publisher workspace required" }, 403);
  const orgId = workspace.organization.id;
  try {
    const orgRows = await sql`SELECT "paypalEmail" FROM organizations WHERE "id" = ${orgId} LIMIT 1`;
    const paypalEmail = orgRows[0]?.paypalEmail;
    if (!paypalEmail) return c.json({ error: "No PayPal email on file. Save one first." }, 400);

    const inflight = await sql`SELECT "id","status" FROM payout_requests
      WHERE "organizationId" = ${orgId} AND "status" IN ('pending', 'processing') LIMIT 1`;
    if (inflight.length) {
      return c.json({
        error: "A payout is already in progress. Wait for it to complete before requesting another.",
        inflightStatus: inflight[0].status,
      }, 409);
    }

    const feePct = await getPlatformFeePct();
    const { grossAvailableCents, availableCents } = calcPublisherAvailable(
      await sumRevenue(await activeBotIds(orgId)),
      await sumPaid(orgId),
      feePct,
    );
    if (!checkWithdrawMinimum(grossAvailableCents).ok) {
      return c.json({ error: "Minimum withdrawal is $1.00. Not enough available balance." }, 400);
    }
    const available = availableCents;
    if (available < 1) return c.json({ error: "Amount after platform fee is too small to process." }, 400);

    const senderItemId = `payout_${orgId}_${Date.now()}`;
    const ppCfg = await getPayPalConfig();
    let payoutRow;
    if (ppCfg.enabled) {
      const paypalResult = await sendPayPalPayout({
        recipientEmail: paypalEmail,
        amountCents: available,
        senderItemId,
        note: "Prism Ad Network publisher earnings payout",
      }) as Record<string, any>;
      const batchId = paypalResult?.batch_header?.payout_batch_id ?? senderItemId;
      const rows = await sql`
        INSERT INTO payout_requests ("id","organizationId","amountCents","paypalEmail","paypalBatchId","status","updatedAt")
        VALUES (${newId()}, ${orgId}, ${available}, ${paypalEmail}, ${batchId}, 'processing', now()) RETURNING *`;
      payoutRow = rows[0];
    } else {
      const rows = await sql`
        INSERT INTO payout_requests ("id","organizationId","amountCents","paypalEmail","status","updatedAt")
        VALUES (${newId()}, ${orgId}, ${available}, ${paypalEmail}, 'pending', now()) RETURNING *`;
      payoutRow = rows[0];
    }

    await logAudit({
      action: "PAYOUT_REQUEST",
      actorUserId: c.get("portalUser")!.id,
      organizationId: orgId,
      resourceId: payoutRow.id,
      resourceType: "payout_request",
      after: { amountCents: available, paypalEmail, status: payoutRow.status },
      ip: ipFromHeaders(c.req.raw.headers),
    });
    return c.json({ ok: true, payout: payoutRow });
  } catch (err) {
    console.error("Withdraw error", err);
    return c.json({ error: "Failed to process withdrawal" }, 500);
  }
});

export default payouts;
