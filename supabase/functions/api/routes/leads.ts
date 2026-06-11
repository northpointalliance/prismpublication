import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { leadSchema } from "../../_shared/validation.ts";
import { requireAdminKey } from "../../_shared/auth.ts";

// Mounted at /api/leads. Ports server/src/routes/leads.ts.
const leads = new Hono<Env>();

// POST /api/leads — public contact-form submission.
leads.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid payload" }, 400);
  }
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }
  try {
    const d = parsed.data;
    const rows = await sql`
      INSERT INTO leads ("id", "role", "name", "email", "company", "message", "source", "updatedAt")
      VALUES (${newId()}, ${d.role}, ${d.name}, ${d.email},
              ${d.company ?? null}, ${d.message ?? null}, ${d.source ?? null}, now())
      RETURNING "id", "status"`;
    return c.json({ id: rows[0].id, status: rows[0].status }, 201);
  } catch (err) {
    console.error("Lead insert failed", err);
    return c.json({ error: "Failed to store lead" }, 500);
  }
});

// GET /api/leads — admin-key gated list.
leads.get("/", requireAdminKey, async (c) => {
  try {
    const rows = await sql`SELECT * FROM leads ORDER BY "createdAt" DESC LIMIT 100`;
    return c.json(rows);
  } catch (err) {
    console.error("Lead list failed", err);
    return c.json({ error: "Failed to fetch leads" }, 500);
  }
});

export default leads;
