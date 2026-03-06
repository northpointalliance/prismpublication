import { captureException } from "./sentry.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL: string = process.env.LOG_LEVEL || "info";
const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevelValue: number = LEVELS[LOG_LEVEL as LogLevel] ?? 1;

const serializeMeta = (meta: unknown): Record<string, unknown> => {
  if (!meta) return {};
  if (meta instanceof Error) {
    return { err: meta.message, stack: meta.stack };
  }
  if (typeof meta === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
      out[k] = v instanceof Error ? { message: v.message, stack: v.stack } : v;
    }
    return out;
  }
  return { meta };
};

const log = (level: LogLevel, msg: string, rawMeta?: unknown): void => {
  if ((LEVELS[level] ?? 1) < currentLevelValue) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...serializeMeta(rawMeta),
  };
  const line = JSON.stringify(entry) + "\n";
  if (level === "error") {
    captureException(rawMeta instanceof Error ? rawMeta : new Error(msg));
    process.stderr.write(line);
  } else if (level === "warn") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
};

export const logger = {
  debug: (msg: string, meta?: unknown): void => log("debug", msg, meta),
  info: (msg: string, meta?: unknown): void => log("info", msg, meta),
  warn: (msg: string, meta?: unknown): void => log("warn", msg, meta),
  error: (msg: string, meta?: unknown): void => log("error", msg, meta),
};
