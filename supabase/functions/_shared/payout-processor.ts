// Payout processor — ported from the processPayout worker in server/src/index.ts (Prisma -> SQL).
import { sql } from "./db.ts";
import { sendPayPalPayout } from "./paypal.ts";
import { logAudit } from "./audit.ts";

export async function processPayout(payoutRequestId: string): Promise<void> {
  const pr = (await sql`SELECT "id","status","paypalEmail","amountCents","organizationId" FROM payout_requests WHERE "id" = ${payoutRequestId} LIMIT 1`)[0];
  if (!pr) throw new Error(`Payout request ${payoutRequestId} not found`);
  if (pr.status !== "pending") throw new Error(`Payout ${payoutRequestId} is not pending (status: ${pr.status})`);

  const senderItemId = `admin_${pr.id}`;
  // deno-lint-ignore no-explicit-any
  const paypalResult = await sendPayPalPayout({
    recipientEmail: pr.paypalEmail,
    amountCents: pr.amountCents,
    senderItemId,
    note: "Prism Ad Network publisher earnings payout",
  }) as Record<string, any>;

  const batchId = paypalResult?.batch_header?.payout_batch_id ?? senderItemId;
  await sql`UPDATE payout_requests SET "status" = 'processing', "paypalBatchId" = ${batchId}, "processedAt" = now(), "updatedAt" = now() WHERE "id" = ${pr.id}`;

  await logAudit({
    action: "PAYOUT_PROCESS",
    organizationId: pr.organizationId, resourceId: pr.id, resourceType: "payout_request",
    before: { status: "pending" }, after: { status: "processing" },
  });
}
