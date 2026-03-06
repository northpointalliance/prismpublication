import { logger } from "./logger.js";

const REDIS_URL = process.env.REDIS_URL || "";

// ─── Types ───────────────────────────────────────────────────────────────────

type WebhookEventBody = Record<string, any>;

// ─── Processor functions (set by startWorkers) ───────────────────────────────

let webhookProcessor: ((event: WebhookEventBody) => Promise<void>) | null = null;
let payoutProcessor: ((payoutRequestId: string) => Promise<void>) | null = null;

// ─── Redis-backed queues (only when REDIS_URL is set) ────────────────────────

let webhookQueue: import("bullmq").Queue | null = null;
let payoutQueue: import("bullmq").Queue | null = null;

let webhookWorker: import("bullmq").Worker | null = null;
let payoutWorker: import("bullmq").Worker | null = null;

const redisAvailable = Boolean(REDIS_URL);

async function initQueues() {
  if (!REDIS_URL) return;

  const { Queue } = await import("bullmq");
  const { default: Redis } = await import("ioredis");

  // Cast to any to work around ioredis version mismatch between top-level and bullmq's bundled types
  const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null }) as any;

  webhookQueue = new Queue("webhook-processing", { connection });
  payoutQueue = new Queue("payout-processing", { connection });

  logger.info("queue: BullMQ queues initialized", { redis: REDIS_URL.replace(/\/\/.*@/, "//<redacted>@") });
}

// ─── Enqueue helpers ─────────────────────────────────────────────────────────

export async function enqueueWebhookProcess(eventBody: WebhookEventBody): Promise<void> {
  if (webhookQueue) {
    await webhookQueue.add("process-webhook", { eventBody }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
    logger.info("queue: webhook event enqueued", { eventId: eventBody.id, eventType: eventBody.event_type });
    return;
  }

  // Fallback: execute inline (no Redis)
  if (!webhookProcessor) {
    logger.warn("queue: no webhook processor registered — dropping event", { eventId: eventBody.id });
    return;
  }
  await webhookProcessor(eventBody);
}

export async function enqueuePayoutProcess(payoutRequestId: string): Promise<void> {
  if (payoutQueue) {
    await payoutQueue.add("process-payout", { payoutRequestId }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
    logger.info("queue: payout enqueued", { payoutRequestId });
    return;
  }

  // Fallback: execute inline (no Redis)
  if (!payoutProcessor) {
    logger.warn("queue: no payout processor registered — dropping job", { payoutRequestId });
    return;
  }
  await payoutProcessor(payoutRequestId);
}

// ─── Worker startup ──────────────────────────────────────────────────────────

export interface WorkerProcessors {
  processWebhook: (event: WebhookEventBody) => Promise<void>;
  processPayout: (payoutRequestId: string) => Promise<void>;
}

/**
 * Register processor functions and, if Redis is available, start BullMQ workers.
 * Must be called once at server startup.
 */
export async function startWorkers(processors: WorkerProcessors): Promise<void> {
  webhookProcessor = processors.processWebhook;
  payoutProcessor = processors.processPayout;

  if (!REDIS_URL) {
    logger.info("queue: REDIS_URL not set — jobs will execute inline (no background workers)");
    return;
  }

  await initQueues();

  const { Worker } = await import("bullmq");
  const { default: Redis } = await import("ioredis");

  // Cast to any to work around ioredis version mismatch between top-level and bullmq's bundled types
  const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null }) as any;

  webhookWorker = new Worker(
    "webhook-processing",
    async (job) => {
      logger.info("worker: processing webhook job", { jobId: job.id, eventId: job.data.eventBody?.id });
      await processors.processWebhook(job.data.eventBody);
    },
    { connection, concurrency: 5 },
  );

  payoutWorker = new Worker(
    "payout-processing",
    async (job) => {
      logger.info("worker: processing payout job", { jobId: job.id, payoutRequestId: job.data.payoutRequestId });
      await processors.processPayout(job.data.payoutRequestId);
    },
    { connection, concurrency: 2 },
  );

  webhookWorker.on("failed", (job, err) => {
    logger.error("worker: webhook job failed", { jobId: job?.id, err: String(err) });
  });

  payoutWorker.on("failed", (job, err) => {
    logger.error("worker: payout job failed", { jobId: job?.id, err: String(err) });
  });

  logger.info("queue: BullMQ workers started");
}

/**
 * Gracefully close workers and queues. Call during shutdown.
 */
export async function closeWorkers(): Promise<void> {
  await webhookWorker?.close();
  await payoutWorker?.close();
  await webhookQueue?.close();
  await payoutQueue?.close();
}

export { redisAvailable };
