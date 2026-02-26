const getUpstashConfig = () => {
  const url = String(process.env.UPSTASH_REDIS_REST_URL || "").trim();
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
};

const unwrapPipelineResult = (entry) => {
  if (entry && typeof entry === "object" && "result" in entry) {
    return entry.result;
  }
  return entry;
};

export const extractClientIp = (req) => {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwarded || String(req.ip || "unknown");
};

export const createMemoryRateLimitStore = ({ maxTrackedKeys = 5000, cleanupEvery = 250 } = {}) => {
  const bucket = new Map();
  let requestsSinceCleanup = 0;

  const cleanupExpired = (now) => {
    for (const [key, value] of bucket.entries()) {
      if (now > value.resetAt) {
        bucket.delete(key);
      }
    }
  };

  return {
    async hit(key, windowMs) {
      const now = Date.now();
      requestsSinceCleanup += 1;
      if (requestsSinceCleanup >= cleanupEvery || bucket.size > maxTrackedKeys) {
        cleanupExpired(now);
        requestsSinceCleanup = 0;
      }

      const existing = bucket.get(key);
      if (!existing || now > existing.resetAt) {
        if (!existing && bucket.size >= maxTrackedKeys) {
          cleanupExpired(now);
          if (bucket.size >= maxTrackedKeys) {
            return {
              count: Number.MAX_SAFE_INTEGER,
              resetAt: now + windowMs,
            };
          }
        }

        bucket.set(key, { count: 1, resetAt: now + windowMs });
        return { count: 1, resetAt: now + windowMs };
      }

      existing.count += 1;
      return { count: existing.count, resetAt: existing.resetAt };
    },
  };
};

export const createUpstashRateLimitStore = ({ url, token, fetchImpl = fetch }) => ({
  async hit(key, windowMs) {
    const windowSec = Math.max(Math.ceil(windowMs / 1000), 1);
    const response = await fetchImpl(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["PTTL", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
    });

    if (!response.ok) {
      throw new Error(`Upstash rate limiter request failed (${response.status})`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload) || payload.length < 2) {
      throw new Error("Upstash rate limiter returned an invalid response");
    }

    const count = Number(unwrapPipelineResult(payload[0]));
    let ttlMs = Number(unwrapPipelineResult(payload[1]));
    if (!Number.isFinite(count)) {
      throw new Error("Upstash rate limiter returned a non-numeric counter");
    }

    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      ttlMs = windowMs;
    }

    return {
      count,
      resetAt: Date.now() + ttlMs,
    };
  },
});

export const createIpRateLimiter = ({ windowMs, maxRequests, prefix = "rl", store, maxTrackedIps = 5000 }) => {
  const memoryStore = createMemoryRateLimitStore({ maxTrackedKeys: maxTrackedIps });
  const config = getUpstashConfig();
  const externalStore = store || (config ? createUpstashRateLimitStore(config) : null);
  let externalStoreHealthy = Boolean(externalStore);
  let warningShown = false;

  return async (req, res, next) => {
    const ip = extractClientIp(req);
    const key = `${prefix}:${ip}`;

    try {
      const activeStore = externalStoreHealthy && externalStore ? externalStore : memoryStore;
      const result = await activeStore.hit(key, windowMs);
      if (result.count > maxRequests) {
        const retryAfterSec = Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1);
        res.setHeader("Retry-After", String(retryAfterSec));
        return res.status(429).json({ error: "Too many requests" });
      }
      return next();
    } catch (err) {
      externalStoreHealthy = false;
      if (!warningShown && externalStore) {
        warningShown = true;
        console.warn("Rate limiter external store failed; using in-memory fallback.", err);
      }

      try {
        const fallbackResult = await memoryStore.hit(key, windowMs);
        if (fallbackResult.count > maxRequests) {
          const retryAfterSec = Math.max(Math.ceil((fallbackResult.resetAt - Date.now()) / 1000), 1);
          res.setHeader("Retry-After", String(retryAfterSec));
          return res.status(429).json({ error: "Too many requests" });
        }
        return next();
      } catch (_fallbackErr) {
        return res.status(429).json({ error: "Too many requests" });
      }
    }
  };
};
