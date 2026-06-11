import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { syncUserSchema } from "../../_shared/validation.ts";
import { validatePortalSession, buildEntryContextByUserId } from "../../_shared/portal.ts";

// Mounted at /api/auth. Ports server/src/routes/auth.ts.
const auth = new Hono<Env>();

// POST /api/auth/sync-user — upsert the portal user from a verified Supabase session, return entry context.
auth.post("/sync-user", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid sync payload" }, 400);
  }
  const parsed = syncUserSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid sync payload", details: parsed.error.flatten() }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const validation = await validatePortalSession(c, email);
  if (!validation.ok) return c.json({ error: validation.error }, (validation.status ?? 401) as 401);

  const fallbackName = email.split("@")[0] || "Portal User";
  const name = parsed.data.name?.trim() || fallbackName;

  try {
    const rows = await sql`
      INSERT INTO users ("id", "email", "name", "updatedAt")
      VALUES (${newId()}, ${email}, ${name}, now())
      ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = now()
      RETURNING "id"`;
    const entry = await buildEntryContextByUserId(rows[0].id);
    return c.json(entry);
  } catch (err) {
    console.error("User sync failed", err);
    return c.json({ error: "Failed to sync user" }, 500);
  }
});

export default auth;
