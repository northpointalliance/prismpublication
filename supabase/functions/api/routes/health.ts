import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";

// Mounted at /api (health is reachable at /api/health through the `api` function).
const health = new Hono<Env>();

health.get("/health", async (c) => {
  try {
    await sql`SELECT 1`;
    return c.json({ status: "ok", database: "connected" });
  } catch (_err) {
    return c.json({ status: "degraded", database: "unreachable" }, 503);
  }
});

export default health;
