// Port of server/src/portal.ts — Supabase token verification, workspace resolution (Prisma → SQL),
// and Hono auth middleware. Mirrors the Express logic and response shapes exactly.
import type { MiddlewareHandler } from "hono";
import type { Ctx, Env, PortalUser } from "./http.ts";
import { sql } from "./db.ts";
import { supabaseUrl, supabasePublishableKey, allowInsecureDevAuth } from "./config.ts";
import {
  getMembershipRolePriority,
  isAdminMembershipRole,
  isRoleCompatibleWithOrganizationType,
  mapMembershipRoleToPortalRole,
} from "./portal-roles.ts";
import { getBearerToken } from "./crypto.ts";

export const roleToWorkspaceCopy: Record<string, { title: string; description: string }> = {
  advertiser: { title: "Advertiser", description: "Create campaigns, upload creatives, and manage budget controls." },
  publisher: { title: "Bot Developer", description: "Manage bots, SDK keys, placements, and monetization performance." },
  admin: { title: "Platform Admin", description: "Operate moderation, risk, finance, and platform-wide controls." },
};

// ─── Supabase token verification ──────────────────────────────────────────────
export const verifySupabaseToken = async (
  token: string,
): Promise<{ id: string; email: string } | null> => {
  if (!supabaseUrl || !supabasePublishableKey || !token) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return { id: String(payload.id || ""), email: String(payload.email || "").trim().toLowerCase() };
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

interface ValidationResult { ok: boolean; status?: number; error?: string; sessionEmail?: string | null }

export const validatePortalSession = async (c: Ctx, expectedEmail = ""): Promise<ValidationResult> => {
  const token = getBearerToken(c.req.header("authorization") ?? "");
  if (!token) {
    if (!allowInsecureDevAuth) return { ok: false, status: 401, error: "Missing bearer token" };
    return { ok: true, sessionEmail: null };
  }
  if (!supabaseUrl || !supabasePublishableKey) {
    if (!allowInsecureDevAuth) return { ok: false, status: 500, error: "Supabase token verification is not configured" };
    return { ok: true, sessionEmail: null };
  }
  const verified = await verifySupabaseToken(token);
  if (!verified?.email) return { ok: false, status: 401, error: "Invalid bearer token" };
  if (expectedEmail && verified.email !== expectedEmail) return { ok: false, status: 403, error: "Token user mismatch" };
  return { ok: true, sessionEmail: verified.email };
};

// ─── Workspace helpers (SQL) ──────────────────────────────────────────────────
type Membership = {
  id: string;
  role: string;
  organizationId: string;
  organization: { id: string; name: string; type: string; walletBalanceCents?: number; paypalEmail?: string | null };
};

export const fetchMemberships = async (userId: string): Promise<Membership[]> => {
  const rows = await sql`
    SELECT m."id", m."role", m."organizationId",
           o."name" AS o_name, o."type" AS o_type,
           o."walletBalanceCents" AS o_balance, o."paypalEmail" AS o_paypal
    FROM organization_members m
    JOIN organizations o ON o."id" = m."organizationId"
    WHERE m."userId" = ${userId}`;
  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    organizationId: r.organizationId,
    organization: {
      id: r.organizationId,
      name: r.o_name,
      type: r.o_type,
      walletBalanceCents: r.o_balance,
      paypalEmail: r.o_paypal,
    },
  }));
};

export const selectBestMembershipPerOrganization = (memberships: Membership[] = []): Membership[] => {
  const byOrg = new Map<string, Membership>();
  for (const m of memberships) {
    if (!m?.organization) continue;
    if (!isRoleCompatibleWithOrganizationType(m.role, m.organization.type)) continue;
    const current = byOrg.get(m.organization.id);
    if (!current || getMembershipRolePriority(m.role) > getMembershipRolePriority(current.role)) {
      byOrg.set(m.organization.id, m);
    }
  }
  return [...byOrg.values()];
};

const fetchUser = async (
  by: "id" | "email",
  value: string,
): Promise<(PortalUser & { defaultOrganizationId: string | null }) | null> => {
  const rows = by === "id"
    ? await sql`SELECT "id","email","name","defaultOrganizationId" FROM users WHERE "id" = ${value} LIMIT 1`
    : await sql`SELECT "id","email","name","defaultOrganizationId" FROM users WHERE "email" = ${value} LIMIT 1`;
  if (!rows.length) return null;
  const u = rows[0];
  return { id: u.id, email: u.email, name: u.name, defaultOrganizationId: u.defaultOrganizationId };
};

export const buildEntryContextByUserId = async (userId: string) => {
  const user = await fetchUser("id", userId);
  if (!user) return null;
  const memberships = selectBestMembershipPerOrganization(await fetchMemberships(userId));
  const workspaces = memberships.flatMap((m) => {
    const role = mapMembershipRoleToPortalRole(m.role);
    if (!role) return [];
    const copy = roleToWorkspaceCopy[role];
    return [{ id: m.organization.id, orgId: m.organization.id, role, title: copy!.title, description: copy!.description }];
  });
  const defaultWorkspaceId =
    user.defaultOrganizationId && workspaces.some((w) => w.orgId === user.defaultOrganizationId)
      ? user.defaultOrganizationId
      : workspaces[0]?.orgId || null;
  return { user: { id: user.id, email: user.email, name: user.name }, workspaces, defaultWorkspaceId };
};

export const resolvePortalWorkspace = async (userId: string) => {
  const user = await fetchUser("id", userId);
  if (!user) return null;
  const all = await fetchMemberships(userId);
  if (!all.length) return null;
  const memberships = selectBestMembershipPerOrganization(all);
  if (!memberships.length) return null;
  const selected = memberships.find((m) => m.organizationId === user.defaultOrganizationId) || memberships[0];
  return { user, organization: selected.organization, membership: selected };
};

export const requireAdvertiserWorkspace = async (userId: string) => {
  const ws = await resolvePortalWorkspace(userId);
  if (!ws || ws.organization.type !== "advertiser") return null;
  return ws;
};

export const requirePublisherWorkspace = async (userId: string) => {
  const ws = await resolvePortalWorkspace(userId);
  if (!ws || ws.organization.type !== "publisher") return null;
  return ws;
};

// ─── Hono middleware ──────────────────────────────────────────────────────────
export const readUserEmail = (c: Ctx): string => String(c.req.header("x-user-email") || "").trim().toLowerCase();

export const requirePortalUser: MiddlewareHandler<Env> = async (c, next) => {
  const email = readUserEmail(c);
  if (!email) return c.json({ error: "Missing x-user-email header" }, 401);
  const validation = await validatePortalSession(c, email);
  if (!validation.ok) return c.json({ error: validation.error }, (validation.status ?? 401) as 401);
  const user = await fetchUser("email", email);
  if (!user) return c.json({ error: "User not provisioned. Call /api/auth/sync-user first." }, 401);
  c.set("portalUser", { id: user.id, email: user.email, name: user.name });
  await next();
};

export const requireAdminPortalUser: MiddlewareHandler<Env> = async (c, next) => {
  const portalUser = c.get("portalUser");
  if (!portalUser) return c.json({ error: "Admin workspace required" }, 403);
  const memberships = await fetchMemberships(portalUser.id);
  const adminMembership = memberships.find((m) => m.organization.type === "admin" && isAdminMembershipRole(m.role));
  if (!adminMembership) return c.json({ error: "Admin workspace required" }, 403);
  c.set("portalWorkspace", { user: portalUser, organization: adminMembership.organization, membership: adminMembership });
  await next();
};
