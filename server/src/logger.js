const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevelValue = LEVELS[LOG_LEVEL] ?? 1;

const serializeMeta = (meta) => {
  if (!meta) return {};
  if (meta instanceof Error) {
    return { err: meta.message, stack: meta.stack };
  }
  if (typeof meta === "object") {
    const out = {};
    for (const [k, v] of Object.entries(meta)) {
      out[k] = v instanceof Error ? { message: v.message, stack: v.stack } : v;
    }
    return out;
  }
  return { meta };
};

const log = (level, msg, rawMeta) => {
  if ((LEVELS[level] ?? 1) < currentLevelValue) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...serializeMeta(rawMeta),
  };
  const line = JSON.stringify(entry) + "\n";
  if (level === "error" || level === "warn") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
};

export const logger = {
  debug: (msg, meta) => log("debug", msg, meta),
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta),
};
