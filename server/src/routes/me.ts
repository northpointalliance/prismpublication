import express from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { adminApiKey } from "../config.js";
import { createWorkspaceSchema, selectWorkspaceSchema } from "../schemas.js";
import {
  requirePortalUser,
  buildEntryContextByUserId,
  selectBestMembershipPerOrganization,
} from "../portal.js";
import { mapMembershipRoleToPortalRole } from "../portal-roles.js";
import { secureEqual } from "../security-utils.js";
import { seedWorkspaceMockData } from "../seed.js";
import { logger } from "../logger.js";

const router = express.Router();

router.post("/create-workspace", requirePortalUser, async (req: Request, res: Response) => {
  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid workspace create payload", details: parsed.error.flatten() });
  }

  const { type, name } = parsed.data;
  const defaultName =
    type === "advertiser"
      ? `${(req as any).portalUser.name} Advertiser Workspace`
      : type === "publisher"
        ? `${(req as any).portalUser.name} Bot Developer Workspace`
        : `${(req as any).portalUser.name} Admin Workspace`;

  if (type === "admin") {
    const suppliedKey = String(req.headers["x-admin-key"] || "");
    if (!suppliedKey || !secureEqual(suppliedKey, adminApiKey)) {
      return res.status(401).json({ error: "Unauthorized admin key for admin workspace bootstrap" });
    }
  }

  try {
    const organization = await prisma.organization.create({
      data: { name: name || defaultName, type },
    });

    await prisma.organizationMember.create({
      data: {
        userId: (req as any).portalUser.id,
        organizationId: organization.id,
        role:
          type === "advertiser" ? "advertiser_owner" : type === "publisher" ? "publisher_owner" : "super_admin",
      },
    });

    await prisma.user.update({
      where: { id: (req as any).portalUser.id },
      data: { defaultOrganizationId: organization.id },
    });

    await seedWorkspaceMockData({ organization });

    const entry = await buildEntryContextByUserId((req as any).portalUser.id);
    return res.status(201).json(entry);
  } catch (err) {
    logger.error("Create workspace failed", err);
    return res.status(500).json({ error: "Failed to create workspace" });
  }
});

router.get("/entry-context", requirePortalUser, async (req: Request, res: Response) => {
  try {
    const entry = await buildEntryContextByUserId((req as any).portalUser.id);
    return res.json(entry);
  } catch (err) {
    logger.error("Entry context failed", err);
    return res.status(500).json({ error: "Failed to fetch entry context" });
  }
});

router.get("/organizations", requirePortalUser, async (req: Request, res: Response) => {
  try {
    const entry = await buildEntryContextByUserId((req as any).portalUser.id);
    return res.json({ workspaces: entry?.workspaces || [] });
  } catch (err) {
    logger.error("Organization list failed", err);
    return res.status(500).json({ error: "Failed to fetch organizations" });
  }
});

router.post("/default-workspace", requirePortalUser, async (req: Request, res: Response) => {
  const parsed = selectWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid workspace payload", details: parsed.error.flatten() });
  }

  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: (req as any).portalUser.id, organizationId: parsed.data.workspaceId },
      include: { organization: true },
    });
    const membership = selectBestMembershipPerOrganization(memberships)[0];
    if (!membership) {
      return res.status(403).json({ error: "Workspace not accessible for this user" });
    }

    await prisma.user.update({
      where: { id: (req as any).portalUser.id },
      data: { defaultOrganizationId: parsed.data.workspaceId },
    });

    const entry = await buildEntryContextByUserId((req as any).portalUser.id);
    return res.json(entry);
  } catch (err) {
    logger.error("Default workspace update failed", err);
    return res.status(500).json({ error: "Failed to set default workspace" });
  }
});

router.post("/switch-organization", requirePortalUser, async (req: Request, res: Response) => {
  const parsed = selectWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid switch payload", details: parsed.error.flatten() });
  }

  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: (req as any).portalUser.id, organizationId: parsed.data.workspaceId },
      include: { organization: true },
    });
    const membership = selectBestMembershipPerOrganization(memberships)[0];
    if (!membership) {
      return res.status(403).json({ error: "Organization not accessible for this user" });
    }

    const role = mapMembershipRoleToPortalRole(membership.role);
    if (!role) {
      return res.status(403).json({ error: "Organization role is not valid for portal access" });
    }

    return res.json({
      workspaceId: membership.organizationId,
      role,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        type: membership.organization.type,
      },
    });
  } catch (err) {
    logger.error("Organization switch failed", err);
    return res.status(500).json({ error: "Failed to switch organization" });
  }
});

export default router;
