import express from "express";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { logAudit } from "../audit.js";
import { getPayPalConfig, getPayPalToken } from "../paypal.js";
import { paypalWebhookId } from "../config.js";

const router = express.Router();

// ─── PayPal webhook signature verification ────────────────────────────────────

/**
 * Verify the webhook payload using PayPal's verify-webhook-signature endpoint.
 * This fetches and validates the transmission cert on PayPal's side.
 *
 * @param {import("express").Request} req
 * @returns {Promise<boolean>}
 */
async function verifyPayPalSignature(req) {
  const transmissionId = req.headers["paypal-transmission-id"];
  const transmissionTime = req.headers["paypal-transmission-time"];
  const certUrl = req.headers["paypal-cert-url"];
  const transmissionSig = req.headers["paypal-transmission-sig"];
  const authAlgo = req.headers["paypal-auth-algo"];

  if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !authAlgo) {
    logger.warn("paypal-webhook: missing signature headers");
    return false;
  }

  // Reject cert URLs that don't originate from PayPal (security guard)
  if (!certUrl.startsWith("https://api.paypal.com/") && !certUrl.startsWith("https://api.sandbox.paypal.com/")) {
    logger.warn("paypal-webhook: cert URL not from PayPal", { certUrl });
    return false;
  }

  if (!paypalWebhookId) {
    logger.warn("paypal-webhook: PAYPAL_WEBHOOK_ID not configured — cannot verify signature");
    return false;
  }

  try {
    const cfg = await getPayPalConfig();
    const token = await getPayPalToken(cfg);

    const verifyRes = await fetch(`${cfg.base}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: paypalWebhookId,
        webhook_event: req.body,
      }),
    });

    if (!verifyRes.ok) {
      logger.warn("paypal-webhook: verification API call failed", { status: verifyRes.status });
      return false;
    }

    const result = await verifyRes.json();
    return result.verification_status === "SUCCESS";
  } catch (err) {
    logger.error("paypal-webhook: signature verification error", { err: String(err) });
    return false;
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────

/**
 * PAYMENT.CAPTURE.DENIED / PAYMENT.CAPTURE.REVERSED
 *
 * If we already credited the wallet for this order, issue a refund transaction
 * and decrement the balance to reverse it.
 */
async function handleCaptureReversed(event) {
  const resource = event.resource || {};
  const orderId =
    resource.supplementary_data?.related_ids?.order_id ||
    resource.id; // fallback — may not always be the order ID

  if (!orderId) {
    logger.warn("paypal-webhook: capture reversed — no orderId in event", { eventId: event.id });
    return;
  }

  const existing = await prisma.walletTransaction.findFirst({
    where: { paypalOrderId: orderId, type: "topup" },
  });

  if (!existing) {
    logger.info("paypal-webhook: capture reversed — no matching topup found, skipping", { orderId });
    return;
  }

  // Prevent double-reversal
  const alreadyReversed = await prisma.walletTransaction.findFirst({
    where: { paypalOrderId: orderId, type: "refund" },
  });
  if (alreadyReversed) {
    logger.info("paypal-webhook: capture reversal already processed", { orderId });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.walletTransaction.create({
      data: {
        organizationId: existing.organizationId,
        type: "refund",
        amountCents: -existing.amountCents,
        paypalOrderId: orderId,
        description: `PayPal capture reversed — order ${orderId}`,
      },
    });
    await tx.organization.update({
      where: { id: existing.organizationId },
      data: { walletBalanceCents: { decrement: existing.amountCents } },
    });
  });

  await logAudit({
    action: "PAYPAL_WEBHOOK_CAPTURE_REVERSED",
    organizationId: existing.organizationId,
    resourceId: orderId,
    resourceType: "wallet",
    before: { type: "topup", amountCents: existing.amountCents },
    after: { reversed: true },
  });

  logger.info("paypal-webhook: capture reversed — wallet decremented", {
    orderId,
    orgId: existing.organizationId,
    amountCents: existing.amountCents,
  });
}

/**
 * PAYOUT_ITEM.SUCCEEDED
 *
 * Mark the matching PayoutRequest as paid.
 */
async function handlePayoutSucceeded(event) {
  const batchId = event.resource?.payout_batch_id || event.resource?.payout_item?.sender_item_id;
  if (!batchId) {
    logger.warn("paypal-webhook: payout succeeded — no batchId in event", { eventId: event.id });
    return;
  }

  const payoutReq = await prisma.payoutRequest.findFirst({
    where: { paypalBatchId: batchId },
  });
  if (!payoutReq) {
    logger.info("paypal-webhook: payout succeeded — no matching request found", { batchId });
    return;
  }
  if (payoutReq.status === "paid") {
    logger.info("paypal-webhook: payout already marked paid", { batchId });
    return;
  }

  await prisma.payoutRequest.update({
    where: { id: payoutReq.id },
    data: { status: "paid", processedAt: payoutReq.processedAt ?? new Date() },
  });

  await logAudit({
    action: "PAYPAL_WEBHOOK_PAYOUT_SETTLED",
    organizationId: payoutReq.organizationId,
    resourceId: payoutReq.id,
    resourceType: "payout_request",
    before: { status: payoutReq.status },
    after: { status: "paid" },
  });

  logger.info("paypal-webhook: payout marked paid", { batchId, payoutId: payoutReq.id });
}

/**
 * PAYOUT_ITEM.FAILED
 *
 * Mark the matching PayoutRequest as failed.
 */
async function handlePayoutFailed(event) {
  const batchId = event.resource?.payout_batch_id || event.resource?.payout_item?.sender_item_id;
  if (!batchId) {
    logger.warn("paypal-webhook: payout failed — no batchId in event", { eventId: event.id });
    return;
  }

  const payoutReq = await prisma.payoutRequest.findFirst({
    where: { paypalBatchId: batchId },
  });
  if (!payoutReq) {
    logger.info("paypal-webhook: payout failed — no matching request found", { batchId });
    return;
  }
  if (payoutReq.status === "failed") {
    logger.info("paypal-webhook: payout already marked failed", { batchId });
    return;
  }

  await prisma.payoutRequest.update({
    where: { id: payoutReq.id },
    data: { status: "failed" },
  });

  await logAudit({
    action: "PAYPAL_WEBHOOK_PAYOUT_SETTLED",
    organizationId: payoutReq.organizationId,
    resourceId: payoutReq.id,
    resourceType: "payout_request",
    before: { status: payoutReq.status },
    after: { status: "failed" },
  });

  logger.warn("paypal-webhook: payout marked failed", { batchId, payoutId: payoutReq.id });
}

// ─── Webhook endpoint ─────────────────────────────────────────────────────────

router.post("/paypal", async (req, res) => {
  const valid = await verifyPayPalSignature(req);
  if (!valid) {
    logger.warn("paypal-webhook: rejected — invalid or unverifiable signature", {
      eventId: req.body?.id,
      eventType: req.body?.event_type,
    });
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  const eventType = req.body?.event_type;
  logger.info("paypal-webhook: received", { eventId: req.body?.id, eventType });

  try {
    switch (eventType) {
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REVERSED":
        await handleCaptureReversed(req.body);
        break;

      case "PAYOUT_ITEM.SUCCEEDED":
        await handlePayoutSucceeded(req.body);
        break;

      case "PAYOUT_ITEM.FAILED":
        await handlePayoutFailed(req.body);
        break;

      case "PAYMENT.CAPTURE.COMPLETED":
        // Capture was already processed synchronously during capture-order.
        // Acknowledge without action.
        logger.info("paypal-webhook: capture completed — acknowledged", { eventId: req.body?.id });
        break;

      default:
        logger.info("paypal-webhook: unhandled event type", { eventType });
        break;
    }
  } catch (err) {
    logger.error("paypal-webhook: handler error", { eventType, err: String(err) });
    // Return 500 so PayPal retries the webhook
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  return res.json({ received: true });
});

export default router;
