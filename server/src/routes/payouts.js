import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requirePortalUser, requirePublisherWorkspace } from "../portal.js";
import { getPayPalConfig, sendPayPalPayout, getPlatformFeePct } from "../paypal.js";
import { logger } from "../logger.js";
import { logAudit } from "../audit.js";
import { calcPublisherAvailable, checkWithdrawMinimum } from "../money-utils.js";

const router = express.Router();

router.get("/balance", requirePortalUser, async (req, res) => {
  const workspace = await requirePublisherWorkspace(req.portalUser.id);
  if (!workspace) return res.status(403).json({ error: "Publisher workspace required" });

  try {
    const org = await prisma.organization.findUnique({
      where: { id: workspace.organization.id },
      select: { paypalEmail: true },
    });

    const bots = await prisma.publisherBot.findMany({
      where: { organizationId: workspace.organization.id, isActive: true },
      select: { id: true },
    });
    const botIds = bots.map((b) => b.id);

    const revenueAgg = await prisma.adEvent.aggregate({
      where: { eventType: "revenue", botId: { in: botIds } },
      _sum: { amount: true },
    });
    const paidAgg = await prisma.payoutRequest.aggregate({
      where: { organizationId: workspace.organization.id, status: { in: ["paid", "processing"] } },
      _sum: { amountCents: true },
    });

    const totalEarnedCents = revenueAgg._sum.amount ?? 0;
    const totalPaidCents = paidAgg._sum.amountCents ?? 0;
    const feePct = await getPlatformFeePct();
    const { grossAvailableCents, availableCents } = calcPublisherAvailable(totalEarnedCents, totalPaidCents, feePct);

    const recentPayouts = await prisma.payoutRequest.findMany({
      where: { organizationId: workspace.organization.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return res.json({
      totalEarnedCents,
      totalPaidCents,
      grossAvailableCents,
      availableCents,
      platformFeePct: feePct,
      paypalEmail: org?.paypalEmail ?? null,
      recentPayouts,
    });
  } catch (err) {
    logger.error("Payout balance error", err);
    return res.status(500).json({ error: "Failed to fetch payout balance" });
  }
});

router.put("/paypal-email", requirePortalUser, async (req, res) => {
  const workspace = await requirePublisherWorkspace(req.portalUser.id);
  if (!workspace) return res.status(403).json({ error: "Publisher workspace required" });

  const parsed = z.object({ paypalEmail: z.string().trim().email().max(200) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid PayPal email" });

  try {
    await prisma.organization.update({
      where: { id: workspace.organization.id },
      data: { paypalEmail: parsed.data.paypalEmail },
    });
    return res.json({ ok: true });
  } catch (err) {
    logger.error("Save PayPal email error", err);
    return res.status(500).json({ error: "Failed to save PayPal email" });
  }
});

router.post("/withdraw", requirePortalUser, async (req, res) => {
  const workspace = await requirePublisherWorkspace(req.portalUser.id);
  if (!workspace) return res.status(403).json({ error: "Publisher workspace required" });

  try {
    const org = await prisma.organization.findUnique({
      where: { id: workspace.organization.id },
      select: { paypalEmail: true },
    });
    if (!org?.paypalEmail) {
      return res.status(400).json({ error: "No PayPal email on file. Save one first." });
    }

    // Guard: block if a payout is already pending or processing
    const inflight = await prisma.payoutRequest.findFirst({
      where: { organizationId: workspace.organization.id, status: { in: ["pending", "processing"] } },
      select: { id: true, status: true },
    });
    if (inflight) {
      return res.status(409).json({
        error: "A payout is already in progress. Wait for it to complete before requesting another.",
        inflightStatus: inflight.status,
      });
    }

    const bots = await prisma.publisherBot.findMany({
      where: { organizationId: workspace.organization.id, isActive: true },
      select: { id: true },
    });
    const botIds = bots.map((b) => b.id);

    const revenueAgg = await prisma.adEvent.aggregate({
      where: { eventType: "revenue", botId: { in: botIds } },
      _sum: { amount: true },
    });
    const paidAgg = await prisma.payoutRequest.aggregate({
      where: { organizationId: workspace.organization.id, status: { in: ["paid", "processing"] } },
      _sum: { amountCents: true },
    });

    const feePct = await getPlatformFeePct();
    const { grossAvailableCents, availableCents } = calcPublisherAvailable(
      revenueAgg._sum.amount ?? 0,
      paidAgg._sum.amountCents ?? 0,
      feePct,
    );
    const minCheck = checkWithdrawMinimum(grossAvailableCents);
    if (!minCheck.ok) {
      return res.status(400).json({ error: "Minimum withdrawal is $1.00. Not enough available balance." });
    }
    const available = availableCents;
    if (available < 1) {
      return res.status(400).json({ error: "Amount after platform fee is too small to process." });
    }

    const senderItemId = `payout_${workspace.organization.id}_${Date.now()}`;
    let payoutRequest;

    const ppCfg = await getPayPalConfig();
    if (ppCfg.enabled) {
      const paypalResult = await sendPayPalPayout({
        recipientEmail: org.paypalEmail,
        amountCents: available,
        senderItemId,
        note: "Prism Ad Network publisher earnings payout",
      });
      payoutRequest = await prisma.payoutRequest.create({
        data: {
          organizationId: workspace.organization.id,
          amountCents: available,
          paypalEmail: org.paypalEmail,
          paypalBatchId: paypalResult?.batch_header?.payout_batch_id ?? senderItemId,
          status: "processing",
        },
      });
    } else {
      payoutRequest = await prisma.payoutRequest.create({
        data: {
          organizationId: workspace.organization.id,
          amountCents: available,
          paypalEmail: org.paypalEmail,
          status: "pending",
        },
      });
    }

    logger.info("payout submitted", {
      orgId: workspace.organization.id,
      amountCents: available,
      paypalEnabled: ppCfg.enabled,
      payoutId: payoutRequest.id,
    });
    await logAudit({
      action: "PAYOUT_REQUEST",
      actorUserId: req.portalUser?.id,
      organizationId: workspace.organization.id,
      resourceId: payoutRequest.id,
      resourceType: "payout_request",
      after: { amountCents: available, paypalEmail: org.paypalEmail, status: payoutRequest.status },
      req,
    });
    return res.json({ ok: true, payout: payoutRequest });
  } catch (err) {
    logger.error("Withdraw error", err);
    return res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

export default router;
