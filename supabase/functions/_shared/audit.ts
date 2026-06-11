// Port of server/src/audit.ts. SQL insert into audit_logs. Never throws.
import { sql } from "./db.ts";
import { newId } from "./ids.ts";

export interface LogAuditOptions {
  action: string;
  actorUserId?: string | null;
  organizationId?: string | null;
  resourceId?: string | null;
  resourceType?: string | null;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
}

// Resolve client IP from forwarded headers (mirrors the Express x-forwarded-for logic).
export const ipFromHeaders = (h: Headers): string =>
  String(h.get("x-forwarded-for")?.split(",")[0]?.trim() || "").slice(0, 100);

export async function logAudit(opts: LogAuditOptions): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs
        ("id","action","actorUserId","organizationId","resourceId","resourceType","before","after","ipAddress","createdAt")
      VALUES (
        ${newId()}, ${opts.action}, ${opts.actorUserId ?? null}, ${opts.organizationId ?? null},
        ${opts.resourceId ?? null}, ${opts.resourceType ?? null},
        ${opts.before ? JSON.stringify(opts.before) : null}::jsonb,
        ${opts.after ? JSON.stringify(opts.after) : null}::jsonb,
        ${opts.ip ?? null}, now())`;
  } catch (err) {
    console.error("audit log write failed", { action: opts.action, resourceId: opts.resourceId, err: String(err) });
  }
}
