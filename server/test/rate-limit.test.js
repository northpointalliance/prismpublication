import test from "node:test";
import assert from "node:assert/strict";
import {
  createIpRateLimiter,
  createMemoryRateLimitStore,
  createUpstashRateLimitStore,
  extractClientIp,
} from "../src/rate-limit.js";

const createMockResponse = () => {
  const response = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return response;
};

test("extractClientIp uses first x-forwarded-for value when present", () => {
  const req = {
    ip: "127.0.0.1",
    headers: {
      "x-forwarded-for": "203.0.113.7, 198.51.100.10",
    },
  };
  assert.equal(extractClientIp(req), "203.0.113.7");
});

test("memory rate-limit store increments and resets after window", async () => {
  const store = createMemoryRateLimitStore({ maxTrackedKeys: 100, cleanupEvery: 1 });
  const first = await store.hit("ip:a", 20);
  const second = await store.hit("ip:a", 20);
  assert.equal(first.count, 1);
  assert.equal(second.count, 2);

  await new Promise((resolve) => setTimeout(resolve, 30));
  const third = await store.hit("ip:a", 20);
  assert.equal(third.count, 1);
});

test("createIpRateLimiter blocks after threshold", async () => {
  const limiter = createIpRateLimiter({
    windowMs: 1000,
    maxRequests: 2,
    prefix: "test",
    store: createMemoryRateLimitStore({ maxTrackedKeys: 100, cleanupEvery: 1 }),
  });
  const req = { ip: "10.0.0.1", headers: {} };
  const res = createMockResponse();
  let nextCount = 0;
  const next = () => {
    nextCount += 1;
  };

  await limiter(req, res, next);
  await limiter(req, res, next);
  await limiter(req, res, next);

  assert.equal(nextCount, 2);
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.error, "Too many requests");
  assert.ok(Number(res.headers["Retry-After"]) >= 1);
});

test("createIpRateLimiter falls back to memory store if external store fails", async () => {
  const failingStore = {
    async hit() {
      throw new Error("rate store unavailable");
    },
  };
  const limiter = createIpRateLimiter({
    windowMs: 1000,
    maxRequests: 2,
    prefix: "test-fallback",
    store: failingStore,
  });
  const req = { ip: "10.0.0.2", headers: {} };
  const res = createMockResponse();
  let nextCount = 0;
  const next = () => {
    nextCount += 1;
  };

  await limiter(req, res, next);
  await limiter(req, res, next);
  await limiter(req, res, next);

  assert.equal(nextCount, 2);
  assert.equal(res.statusCode, 429);
});

test("createUpstashRateLimitStore parses pipeline results", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify([{ result: 3 }, { result: 1200 }, { result: 1 }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const store = createUpstashRateLimitStore({
    url: "https://example.upstash.io",
    token: "token",
    fetchImpl,
  });

  const now = Date.now();
  const result = await store.hit("auth:1.2.3.4", 10_000);
  assert.equal(result.count, 3);
  assert.ok(result.resetAt >= now + 1000);
});
