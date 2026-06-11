import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { requirePortalUser, requireAdvertiserWorkspace } from "../../_shared/portal.ts";
import { getPayPalConfig, createPayPalOrder, capturePayPalOrder } from "../../_shared/paypal.ts";
import { parsePayPalCaptureCents, checkWalletSpend } from "../../_shared/money.ts";
import { logAudit, ipFromHeaders } from "../../_shared/audit.ts";

// Mounted at /api/wallet. Ports server/src/routes/wallet.ts.
const wallet = new Hono<Env>();

// GET /api/wallet/paypal/config — public (client id is not a secret).
wallet.get("/paypal/config", async (c) => {
  try {
    const cfg = await getPayPalConfig();
    return c.json({ clientId: cfg.enabled ? cfg.clientId : null, currency: "USD" });
  } catch {
    return c.json({ clientId: null, currency: "USD" });
  }
});

// GET /api/wallet/balance
wallet.get("/balance", requirePortalUser, async (c) => {
  const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
  if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
  try {
    const orgId = workspace.organization.id;
    const orgRows = await sql`SELECT "walletBalanceCents" FROM organizations WHERE "id" = ${orgId} LIMIT 1`;
    const transactions = await sql`
      SELECT * FROM wallet_transactions WHERE "organizationId" = ${orgId} ORDER BY "createdAt" DESC LIMIT 20`;
    return c.json({ walletBalanceCents: orgRows[0]?.walletBalanceCents ?? 0, transactions });
  } catch (err) {
    console.error("Wallet balance error", err);
    return c.json({ error: "Failed to fetch wallet balance" }, 500);
  }
});

// POST /api/wallet/paypal/create-order
wallet.post("/paypal/create-order", requirePortalUser, async (c) => {
  const cfg = await getPayPalConfig();
  if (!cfg.enabled) return c.json({ error: "PayPal not configured on this server" }, 503);
  const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
  if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
  const parsed = z.object({ amountCents: z.number().int().min(100).max(1_000_000) }).safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Amount must be between $1 and $10,000" }, 400);
  try {
    const order = await createPayPalOrder({ amountCents: parsed.data.amountCents });
    return c.json({ orderID: order.id });
  } catch (err) {
    console.error("PayPal create order error", err);
    return c.json({ error: "Failed to create PayPal order" }, 500);
  }
});

// POST /api/wallet/paypal/capture-order
wallet.post("/paypal/capture-order", requirePortalUser, async (c) => {
  const cfg = await getPayPalConfig();
  if (!cfg.enabled) return c.json({ error: "PayPal not configured on this server" }, 503);
  const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
  if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
  const parsed = z.object({ orderID: z.string().trim().min(5).max(120) }).safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Missing orderID" }, 400);
  const orgId = workspace.organization.id;
  try {
    // Idempotency guard.
    const existing = await sql`SELECT "amountCents" FROM wallet_transactions WHERE "paypalOrderId" = ${parsed.data.orderID} LIMIT 1`;
    if (existing.length) {
      const orgRows = await sql`SELECT "walletBalanceCents" FROM organizations WHERE "id" = ${orgId} LIMIT 1`;
      return c.json({ amountCents: existing[0].amountCents, newBalanceCents: orgRows[0]?.walletBalanceCents ?? 0 });
    }

    const capture = await capturePayPalOrder(parsed.data.orderID) as Record<string, any>;
    const captured = capture?.purchase_units?.[0]?.payments?.captures?.[0];
    if (!captured || captured.status !== "COMPLETED") return c.json({ error: "PayPal payment not completed" }, 400);
    const amountCents = parsePayPalCaptureCents(captured);
    if (!amountCents) return c.json({ error: "Could not determine payment amount" }, 400);

    const newBalance: number = await sql.begin(async (tx) => {
      await tx`
        INSERT INTO wallet_transactions ("id","organizationId","type","amountCents","paypalOrderId","description","createdAt")
        VALUES (${newId()}, ${orgId}, 'topup', ${amountCents}, ${parsed.data.orderID},
                ${`PayPal top-up — order ${parsed.data.orderID}`}, now())`;
      const rows = await tx`
        UPDATE organizations SET "walletBalanceCents" = "walletBalanceCents" + ${amountCents}, "updatedAt" = now()
        WHERE "id" = ${orgId} RETURNING "walletBalanceCents"`;
      return rows[0].walletBalanceCents;
    });

    await logAudit({
      action: "WALLET_TOPUP",
      actorUserId: c.get("portalUser")!.id,
      organizationId: orgId,
      resourceType: "wallet",
      before: { walletBalanceCents: newBalance - amountCents },
      after: { walletBalanceCents: newBalance, paypalOrderId: parsed.data.orderID },
      ip: ipFromHeaders(c.req.raw.headers),
    });
    return c.json({ amountCents, newBalanceCents: newBalance });
  } catch (err) {
    console.error("PayPal capture error", err);
    return c.json({ error: "Failed to capture PayPal payment" }, 500);
  }
});

// POST /api/wallet/spend
wallet.post("/spend", requirePortalUser, async (c) => {
  const workspace = await requireAdvertiserWorkspace(c.get("portalUser")!.id);
  if (!workspace) return c.json({ error: "Advertiser workspace required" }, 403);
  const parsed = z.object({
    amountCents: z.number().int().min(1),
    description: z.string().trim().max(200).optional(),
  }).safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: "Invalid spend amount" }, 400);
  const orgId = workspace.organization.id;
  try {
    const orgRows = await sql`SELECT "walletBalanceCents" FROM organizations WHERE "id" = ${orgId} LIMIT 1`;
    const spendCheck = checkWalletSpend(orgRows[0]?.walletBalanceCents ?? 0, parsed.data.amountCents);
    if (!spendCheck.ok) return c.json({ error: "Insufficient wallet balance" }, 400);

    const newBalance: number = await sql.begin(async (tx) => {
      await tx`
        INSERT INTO wallet_transactions ("id","organizationId","type","amountCents","description","createdAt")
        VALUES (${newId()}, ${orgId}, 'spend', ${parsed.data.amountCents},
                ${parsed.data.description ?? "Campaign budget reservation"}, now())`;
      const rows = await tx`
        UPDATE organizations SET "walletBalanceCents" = "walletBalanceCents" - ${parsed.data.amountCents}, "updatedAt" = now()
        WHERE "id" = ${orgId} RETURNING "walletBalanceCents"`;
      return rows[0].walletBalanceCents;
    });
    return c.json({ newBalanceCents: newBalance });
  } catch (err) {
    console.error("Wallet spend error", err);
    return c.json({ error: "Failed to process spend" }, 500);
  }
});

export default wallet;
