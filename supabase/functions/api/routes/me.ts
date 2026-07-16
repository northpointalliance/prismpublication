import { Hono } from "hono";
import type { Ctx, Env } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { secureEqual } from "../../_shared/crypto.ts";
import { adminApiKey } from "../../_shared/config.ts";
import { createWorkspaceSchema, selectWorkspaceSchema } from "../../_shared/validation.ts";
import {
  requirePortalUser,
  buildEntryContextByUserId,
  fetchMemberships,
  selectBestMembershipPerOrganization,
} from "../../_shared/portal.ts";
import { mapMembershipRoleToPortalRole } from "../../_shared/portal-roles.ts";
import { sendEmail } from "../../_shared/email.ts";

// Mounted at /api/me. Ports server/src/routes/me.ts.
const me = new Hono<Env>();

const parseJson = async (c: Ctx): Promise<unknown> => {
  try {
    return await c.req.json();
  } catch {
    return undefined;
  }
};

// POST /api/me/create-workspace
me.post("/create-workspace", requirePortalUser, async (c) => {
  const body = await parseJson(c);
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid workspace create payload", details: parsed.error.flatten() }, 400);
  }
  const portalUser = c.get("portalUser")!;
  const { type, name } = parsed.data;
  const defaultName = type === "advertiser"
    ? `${portalUser.name} Advertiser Workspace`
    : type === "publisher"
      ? `${portalUser.name} Bot Developer Workspace`
      : `${portalUser.name} Admin Workspace`;

  if (type === "admin") {
    const suppliedKey = String(c.req.header("x-admin-key") || "");
    if (!suppliedKey || !secureEqual(suppliedKey, adminApiKey)) {
      return c.json({ error: "Unauthorized admin key for admin workspace bootstrap" }, 401);
    }
  }

  try {
    const role = type === "advertiser" ? "advertiser_owner" : type === "publisher" ? "publisher_owner" : "super_admin";
    const orgId = newId();
    await sql.begin(async (tx) => {
      await tx`INSERT INTO organizations ("id","name","type","updatedAt")
               VALUES (${orgId}, ${name || defaultName}, ${type}, now())`;
      await tx`INSERT INTO organization_members ("id","userId","organizationId","role","updatedAt")
               VALUES (${newId()}, ${portalUser.id}, ${orgId}, ${role}, now())`;
      await tx`UPDATE users SET "defaultOrganizationId" = ${orgId}, "updatedAt" = now() WHERE "id" = ${portalUser.id}`;
    });
    // NOTE: seedWorkspaceMockData (demo ads/bots) is not yet ported — new workspaces start empty.

    // Notify Dan when a new publisher signs up. Fire and forget — don't block the response.
    if (type === "publisher") {
      sendEmail({
        to: ["dan72ros@gmail.com", "info@prismpublication.com"],
        subject: `New publisher signup: ${portalUser.name}`,
        html: `
          <h2 style="color:#38bdf8">New publisher signed up on Prism</h2>
          <p><strong>Name:</strong> ${portalUser.name}</p>
          <p><strong>Email:</strong> ${portalUser.email}</p>
          <p><strong>Workspace:</strong> ${name || defaultName}</p>
          <p><strong>Time:</strong> ${new Date().toUTCString()}</p>
          <hr>
          <p style="font-size:12px;color:#888">Sent automatically by Prism Publication</p>
        `,
      }).catch((e) => console.error("Publisher signup notification failed", e));
    }

    const entry = await buildEntryContextByUserId(portalUser.id);
    return c.json(entry, 201);
  } catch (err) {
    console.error("Create workspace failed", err);
    return c.json({ error: "Failed to create workspace" }, 500);
  }
});

// GET /api/me/entry-context
me.get("/entry-context", requirePortalUser, async (c) => {
  try {
    return c.json(await buildEntryContextByUserId(c.get("portalUser")!.id));
  } catch (err) {
    console.error("Entry context failed", err);
    return c.json({ error: "Failed to fetch entry context" }, 500);
  }
});

// GET /api/me/organizations
me.get("/organizations", requirePortalUser, async (c) => {
  try {
    const entry = await buildEntryContextByUserId(c.get("portalUser")!.id);
    return c.json({ workspaces: entry?.workspaces || [] });
  } catch (err) {
    console.error("Organization list failed", err);
    return c.json({ error: "Failed to fetch organizations" }, 500);
  }
});

// POST /api/me/default-workspace
me.post("/default-workspace", requirePortalUser, async (c) => {
  const parsed = selectWorkspaceSchema.safeParse(await parseJson(c));
  if (!parsed.success) return c.json({ error: "Invalid workspace payload", details: parsed.error.flatten() }, 400);
  const portalUser = c.get("portalUser")!;
  try {
    const memberships = selectBestMembershipPerOrganization(
      (await fetchMemberships(portalUser.id)).filter((m) => m.organizationId === parsed.data.workspaceId),
    );
    if (!memberships[0]) return c.json({ error: "Workspace not accessible for this user" }, 403);
    await sql`UPDATE users SET "defaultOrganizationId" = ${parsed.data.workspaceId}, "updatedAt" = now()
              WHERE "id" = ${portalUser.id}`;
    return c.json(await buildEntryContextByUserId(portalUser.id));
  } catch (err) {
    console.error("Default workspace update failed", err);
    return c.json({ error: "Failed to set default workspace" }, 500);
  }
});

// POST /api/me/switch-organization
me.post("/switch-organization", requirePortalUser, async (c) => {
  const parsed = selectWorkspaceSchema.safeParse(await parseJson(c));
  if (!parsed.success) return c.json({ error: "Invalid switch payload", details: parsed.error.flatten() }, 400);
  const portalUser = c.get("portalUser")!;
  try {
    const membership = selectBestMembershipPerOrganization(
      (await fetchMemberships(portalUser.id)).filter((m) => m.organizationId === parsed.data.workspaceId),
    )[0];
    if (!membership) return c.json({ error: "Organization not accessible for this user" }, 403);
    const role = mapMembershipRoleToPortalRole(membership.role);
    if (!role) return c.json({ error: "Organization role is not valid for portal access" }, 403);
    return c.json({
      workspaceId: membership.organizationId,
      role,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        type: membership.organization.type,
      },
    });
  } catch (err) {
    console.error("Organization switch failed", err);
    return c.json({ error: "Failed to switch organization" }, 500);
  }
});

export default me;
