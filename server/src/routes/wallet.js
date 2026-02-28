import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requirePortalUser, requireAdvertiserWorkspace } from "../portal.js";
import { getPayPalConfig, createPayPalOrder, capturePayPalOrder } from "../paypal.js";
import { logger } from "../logger.js";
import { logAudit } from "../audit.js";
import { parsePayPalCaptureCents, checkWalletSpend } from "../money-utils.js";

const router = express.Router();

router.get("/balance", requirePortalUser, async (req, res) => {
  const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
  if (!workspace) return res.status(403).json({ error: "Advertiser workspace required" });

  try {
    const org = await prisma.organization.findUnique({
      where: { id: workspace.organization.id },
      select: { walletBalanceCents: true },
    });
    const transactions = await prisma.walletTransaction.findMany({
      where: { organizationId: workspace.organization.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return res.json({ walletBalanceCents: org?.walletBalanceCents ?? 0, transactions });
  } catch (err) {
    logger.error("Wallet balance error", err);
    return res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});

router.post("/paypal/create-order", requirePortalUser, async (req, res) => {
  const cfg = await getPayPalConfig();
  if (!cfg.enabled) return res.status(503).json({ error: "PayPal not configured on this server" });

  const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
  if (!workspace) return res.status(403).json({ error: "Advertiser workspace required" });

  const parsed = z
    .object({ amountCents: z.number().int().min(100).max(1_000_000) })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Amount must be between $1 and $10,000" });

  try {
    const order = await createPayPalOrder({ amountCents: parsed.data.amountCents });
    return res.json({ orderID: order.id });
  } catch (err) {
    logger.error("PayPal create order error", err);
    return res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

router.post("/paypal/capture-order", requirePortalUser, async (req, res) => {
  const cfg = await getPayPalConfig();
  if (!cfg.enabled) return res.status(503).json({ error: "PayPal not configured on this server" });

  const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
  if (!workspace) return res.status(403).json({ error: "Advertiser workspace required" });

  const parsed = z.object({ orderID: z.string().trim().min(5).max(120) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Missing orderID" });

  try {
    // Idempotency guard: if this orderID was already captured, return the existing result
    const existingTx = await prisma.walletTransaction.findFirst({
      where: { paypalOrderId: parsed.data.orderID },
    });
    if (existingTx) {
      const org = await prisma.organization.findUnique({
        where: { id: workspace.organization.id },
        select: { walletBalanceCents: true },
      });
      return res.json({ amountCents: existingTx.amountCents, newBalanceCents: org?.walletBalanceCents ?? 0 });
    }

    const capture = await capturePayPalOrder(parsed.data.orderID);
    const captured = capture?.purchase_units?.[0]?.payments?.captures?.[0];
    if (!captured || captured.status !== "COMPLETED") {
      return res.status(400).json({ error: "PayPal payment not completed" });
    }

    const amountCents = parsePayPalCaptureCents(captured);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          organizationId: workspace.organization.id,
          type: "topup",
          amountCents,
          paypalOrderId: parsed.data.orderID,
          description: `PayPal top-up — order ${parsed.data.orderID}`,
        },
      });
      return tx.organization.update({
        where: { id: workspace.organization.id },
        data: { walletBalanceCents: { increment: amountCents } },
        select: { walletBalanceCents: true },
      });
    });

    logger.info("wallet topup", { orderId: parsed.data.orderID, amountCents, orgId: workspace.organization.id });
    await logAudit({
      action: "WALLET_TOPUP",
      actorUserId: req.portalUser?.id,
      organizationId: workspace.organization.id,
      resourceType: "wallet",
      before: { walletBalanceCents: updated.walletBalanceCents - amountCents },
      after: { walletBalanceCents: updated.walletBalanceCents, paypalOrderId: parsed.data.orderID },
      req,
    });
    return res.json({ amountCents, newBalanceCents: updated.walletBalanceCents });
  } catch (err) {
    logger.error("PayPal capture error", err);
    return res.status(500).json({ error: "Failed to capture PayPal payment" });
  }
});

router.post("/spend", requirePortalUser, async (req, res) => {
  const workspace = await requireAdvertiserWorkspace(req.portalUser.id);
  if (!workspace) return res.status(403).json({ error: "Advertiser workspace required" });

  const parsed = z
    .object({ amountCents: z.number().int().min(1), description: z.string().trim().max(200).optional() })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid spend amount" });

  try {
    const org = await prisma.organization.findUnique({
      where: { id: workspace.organization.id },
      select: { walletBalanceCents: true },
    });
    const spendCheck = checkWalletSpend(org?.walletBalanceCents ?? 0, parsed.data.amountCents);
    if (!spendCheck.ok) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          organizationId: workspace.organization.id,
          type: "spend",
          amountCents: parsed.data.amountCents,
          description: parsed.data.description ?? "Campaign budget reservation",
        },
      });
      return tx.organization.update({
        where: { id: workspace.organization.id },
        data: { walletBalanceCents: { decrement: parsed.data.amountCents } },
        select: { walletBalanceCents: true },
      });
    });

    return res.json({ newBalanceCents: updated.walletBalanceCents });
  } catch (err) {
    logger.error("Wallet spend error", err);
    return res.status(500).json({ error: "Failed to process spend" });
  }
});

export default router;
