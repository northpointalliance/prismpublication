// PayPal webhook event handlers — ported from server/src/routes/webhooks.ts (Prisma -> SQL).
import { sql } from "./db.ts";
import { newId } from "./ids.ts";
import { logAudit } from "./audit.ts";

// deno-lint-ignore no-explicit-any
type Event = Record<string, any>;

export async function handleCaptureReversed(event: Event): Promise<void> {
  const resource = event.resource || {};
  const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id;
  if (!orderId) return;

  const existing = (await sql`
    SELECT "id","organizationId","amountCents" FROM wallet_transactions
    WHERE "paypalOrderId" = ${orderId} AND "type" = 'topup' LIMIT 1`)[0];
  if (!existing) return;

  const already = (await sql`
    SELECT "id" FROM wallet_transactions WHERE "paypalOrderId" = ${orderId} AND "type" = 'refund' LIMIT 1`)[0];
  if (already) return;

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO wallet_transactions ("id","organizationId","type","amountCents","paypalOrderId","description","createdAt")
      VALUES (${newId()}, ${existing.organizationId}, 'refund', ${-existing.amountCents}, ${orderId},
              ${`PayPal capture reversed — order ${orderId}`}, now())`;
    await tx`UPDATE organizations SET "walletBalanceCents" = "walletBalanceCents" - ${existing.amountCents}, "updatedAt" = now()
             WHERE "id" = ${existing.organizationId}`;
  });

  await logAudit({
    action: "PAYPAL_WEBHOOK_CAPTURE_REVERSED",
    organizationId: existing.organizationId,
    resourceId: orderId,
    resourceType: "wallet",
    before: { type: "topup", amountCents: existing.amountCents },
    after: { reversed: true },
  });
}

const findPayoutByBatch = async (event: Event) => {
  const batchId = event.resource?.payout_batch_id || event.resource?.payout_item?.sender_item_id;
  if (!batchId) return null;
  return (await sql`SELECT "id","status","organizationId","processedAt" FROM payout_requests WHERE "paypalBatchId" = ${batchId} LIMIT 1`)[0] || null;
};

export async function handlePayoutSucceeded(event: Event): Promise<void> {
  const pr = await findPayoutByBatch(event);
  if (!pr || pr.status === "paid") return;
  await sql`UPDATE payout_requests SET "status" = 'paid', "processedAt" = ${pr.processedAt ?? new Date()}, "updatedAt" = now() WHERE "id" = ${pr.id}`;
  await logAudit({
    action: "PAYPAL_WEBHOOK_PAYOUT_SETTLED",
    organizationId: pr.organizationId, resourceId: pr.id, resourceType: "payout_request",
    before: { status: pr.status }, after: { status: "paid" },
  });
}

export async function handlePayoutFailed(event: Event): Promise<void> {
  const pr = await findPayoutByBatch(event);
  if (!pr || pr.status === "failed") return;
  await sql`UPDATE payout_requests SET "status" = 'failed', "updatedAt" = now() WHERE "id" = ${pr.id}`;
  await logAudit({
    action: "PAYPAL_WEBHOOK_PAYOUT_SETTLED",
    organizationId: pr.organizationId, resourceId: pr.id, resourceType: "payout_request",
    before: { status: pr.status }, after: { status: "failed" },
  });
}

// Dispatcher (mirrors the processWebhook switch in server/src/index.ts).
export async function processWebhook(event: Event): Promise<void> {
  switch (event?.event_type) {
    case "PAYMENT.CAPTURE.DENIED":
    case "PAYMENT.CAPTURE.REVERSED":
      await handleCaptureReversed(event);
      break;
    case "PAYOUT_ITEM.SUCCEEDED":
      await handlePayoutSucceeded(event);
      break;
    case "PAYOUT_ITEM.FAILED":
      await handlePayoutFailed(event);
      break;
    default:
      console.log("worker: unhandled/acknowledged webhook event", { eventType: event?.event_type });
      break;
  }
}
