// Queue enqueue helpers — replace BullMQ with Supabase Queues (pgmq).
// Requires the `pgmq` extension + queues `webhook_processing` and `payout_processing` (control-panel step).
import { sql } from "./db.ts";

// deno-lint-ignore no-explicit-any
export type WebhookEventBody = Record<string, any>;

export const enqueueWebhookProcess = async (eventBody: WebhookEventBody): Promise<void> => {
  await sql`SELECT pgmq.send('webhook_processing', ${sql.json(eventBody)})`;
};

export const enqueuePayoutProcess = async (payoutRequestId: string): Promise<void> => {
  await sql`SELECT pgmq.send('payout_processing', ${sql.json({ payoutRequestId })})`;
};
