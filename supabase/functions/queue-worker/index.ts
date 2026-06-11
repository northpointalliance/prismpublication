// queue-worker — drains pgmq queues (webhook_processing, payout_processing). Invoked by pg_cron.
// Deploy with verify_jwt=false; guarded by the x-worker-secret header (= ADMIN_API_KEY).
import { sql } from "../_shared/db.ts";
import { processWebhook } from "../_shared/webhook-handlers.ts";
import { processPayout } from "../_shared/payout-processor.ts";
import { secureEqual } from "../_shared/crypto.ts";
import { adminApiKey } from "../_shared/config.ts";

const VT_SECONDS = 60; // visibility timeout while a message is being processed
const MAX_ATTEMPTS = 5; // archive after this many failed reads
const BATCH = 25; // max messages drained per queue per invocation

// deno-lint-ignore no-explicit-any
const drain = async (queue: string, handle: (msg: any) => Promise<void>): Promise<{ done: number; failed: number }> => {
  let done = 0, failed = 0;
  for (let i = 0; i < BATCH; i++) {
    const rows = await sql`SELECT * FROM pgmq.read(${queue}, ${VT_SECONDS}, 1)`;
    if (!rows.length) break;
    const m = rows[0];
    try {
      await handle(m.message);
      await sql`SELECT pgmq.delete(${queue}, ${m.msg_id}::bigint)`;
      done++;
    } catch (err) {
      console.error(`queue-worker: ${queue} msg ${m.msg_id} failed (read_ct=${m.read_ct})`, String(err));
      failed++;
      if (Number(m.read_ct) >= MAX_ATTEMPTS) {
        await sql`SELECT pgmq.archive(${queue}, ${m.msg_id}::bigint)`;
        console.error(`queue-worker: archived ${queue} msg ${m.msg_id} after ${m.read_ct} attempts`);
      }
      break; // stop this queue; the message stays invisible for VT_SECONDS, then retries
    }
  }
  return { done, failed };
};

Deno.serve(async (req) => {
  const secret = req.headers.get("x-worker-secret") || "";
  if (!adminApiKey || !secureEqual(secret, adminApiKey)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  try {
    const webhook = await drain("webhook_processing", (msg) => processWebhook(msg));
    const payout = await drain("payout_processing", (msg) => processPayout(msg.payoutRequestId));
    return new Response(JSON.stringify({ webhook, payout }), { headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("queue-worker error", String(err));
    return new Response(JSON.stringify({ error: "worker failed" }), { status: 500, headers: { "content-type": "application/json" } });
  }
});
