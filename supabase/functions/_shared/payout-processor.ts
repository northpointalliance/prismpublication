// Payout processor — ported from the processPayout worker in server/src/index.ts (Prisma -> SQL).
import { sql } from "./db.ts";
import { sendPayPalPayout } from "./paypal.ts";
import { logAudit } from "./audit.ts";

export async function processPayout(payoutRequestId: string): Promise<void> {
  // Atomically claim the request: only the first delivery flips pending -> processing.
  // This makes the worker idempotent against duplicate queue messages and concurrent workers
  // (no double-send), and it claims BEFORE calling PayPal so a redelivery can't pay twice.
  const pr = (await sql`
    UPDATE payout_requests SET "status" = 'processing', "updatedAt" = now()
    WHERE "id" = ${payoutRequestId} AND "status" = 'pending'
    RETURNING "id","paypalEmail","amountCents","organizationId"`)[0];
  if (!pr) {
    const existing = (await sql`SELECT "status" FROM payout_requests WHERE "id" = ${payoutRequestId} LIMIT 1`)[0];
    if (!existing) throw new Error(`Payout request ${payoutRequestId} not found`);
    // Already claimed/processed by an earlier delivery — nothing to do.
    console.warn(`Payout ${payoutRequestId} already claimed (status: ${existing.status}); skipping`);
    return;
  }

  const senderItemId = `admin_${pr.id}`;
  // deno-lint-ignore no-explicit-any
  let paypalResult: Record<string, any>;
  try {
    paypalResult = await sendPayPalPayout({
      recipientEmail: pr.paypalEmail,
      amountCents: pr.amountCents,
      senderItemId,
      note: "Prism Ad Network publisher earnings payout",
    }) as Record<string, any>;
  } catch (err) {
    // PayPal rejected the payout — mark failed so it isn't stuck "processing" forever
    // and the publisher's inflight guard clears so they can request again.
    await sql`UPDATE payout_requests SET "status" = 'failed', "updatedAt" = now() WHERE "id" = ${pr.id}`;
    await logAudit({
      action: "PAYOUT_PROCESS",
      organizationId: pr.organizationId, resourceId: pr.id, resourceType: "payout_request",
      before: { status: "pending" }, after: { status: "failed", error: String(err) },
    });
    throw err;
  }

  const batchId = paypalResult?.batch_header?.payout_batch_id ?? senderItemId;
  await sql`UPDATE payout_requests SET "paypalBatchId" = ${batchId}, "processedAt" = now(), "updatedAt" = now() WHERE "id" = ${pr.id}`;

  await logAudit({
    action: "PAYOUT_PROCESS",
    organizationId: pr.organizationId, resourceId: pr.id, resourceType: "payout_request",
    before: { status: "pending" }, after: { status: "processing" },
  });
}
