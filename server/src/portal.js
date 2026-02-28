import { prisma } from "./db.js";
import {
  supabaseUrl,
  supabasePublishableKey,
  allowInsecureDevAuth,
  sdkApiKey,
  adminApiKey,
  requireSdkHmac,
} from "./config.js";
import { logger } from "./logger.js";
import {
  getMembershipRolePriority,
  isAdminMembershipRole,
  isRoleCompatibleWithOrganizationType,
  mapMembershipRoleToPortalRole,
} from "./portal-roles.js";
import { getBearerToken, secureEqual, verifyHmac } from "./security-utils.js";
import { hashSecret } from "./helpers.js";

// ─── Constants ────────────────────────────────────────────────────────────────

export const roleToWorkspaceCopy = {
  advertiser: {
    title: "Advertiser",
    description: "Create campaigns, upload creatives, and manage budget controls.",
  },
  publisher: {
    title: "Bot Developer",
    description: "Manage bots, SDK keys, placements, and monetization performance.",
  },
  admin: {
    title: "Platform Admin",
    description: "Operate moderation, risk, finance, and platform-wide controls.",
  },
};

// ─── Supabase token verification ──────────────────────────────────────────────

let insecureAuthWarningShown = false;
let missingSupabaseVerificationWarningShown = false;

export const verifySupabaseToken = async (token) => {
  if (!supabaseUrl || !supabasePublishableKey || !token) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const payload = await response.json();
    return {
      id: String(payload.id || ""),
      email: String(payload.email || "").trim().toLowerCase(),
    };
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const validatePortalSession = async (req, expectedEmail = "") => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    if (!allowInsecureDevAuth) {
      return { ok: false, status: 401, error: "Missing bearer token" };
    }
    if (!insecureAuthWarningShown) {
      insecureAuthWarningShown = true;
      logger.warn("Security warning: insecure dev auth is enabled. Set ALLOW_INSECURE_DEV_AUTH=false.");
    }
    return { ok: true, sessionEmail: null };
  }

  const canVerifyToken = Boolean(supabaseUrl && supabasePublishableKey);
  if (!canVerifyToken) {
    if (!allowInsecureDevAuth) {
      return { ok: false, status: 500, error: "Supabase token verification is not configured" };
    }
    if (!missingSupabaseVerificationWarningShown) {
      missingSupabaseVerificationWarningShown = true;
      logger.warn(
        "Security warning: token verification skipped because SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY are not set.",
      );
    }
    return { ok: true, sessionEmail: null };
  }

  const verifiedUser = await verifySupabaseToken(token);
  if (!verifiedUser?.email) {
    return { ok: false, status: 401, error: "Invalid bearer token" };
  }
  if (expectedEmail && verifiedUser.email !== expectedEmail) {
    return { ok: false, status: 403, error: "Token user mismatch" };
  }

  return { ok: true, sessionEmail: verifiedUser.email };
};

// ─── Workspace helpers ────────────────────────────────────────────────────────

export const selectBestMembershipPerOrganization = (memberships = []) => {
  const byOrganizationId = new Map();

  for (const membership of memberships) {
    if (!membership?.organization) continue;
    if (!isRoleCompatibleWithOrganizationType(membership.role, membership.organization.type)) continue;

    const orgId = membership.organization.id;
    const current = byOrganizationId.get(orgId);
    if (!current || getMembershipRolePriority(membership.role) > getMembershipRolePriority(current.role)) {
      byOrganizationId.set(orgId, membership);
    }
  }

  return [...byOrganizationId.values()];
};

export const buildEntryContextByUserId = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { organization: true } } },
  });

  if (!user) return null;

  const memberships = selectBestMembershipPerOrganization(user.memberships);
  const workspaces = memberships.flatMap((membership) => {
    const role = mapMembershipRoleToPortalRole(membership.role);
    if (!role) return [];
    const copy = roleToWorkspaceCopy[role];
    return {
      id: membership.organization.id,
      orgId: membership.organization.id,
      role,
      title: copy.title,
      description: copy.description,
    };
  });

  const defaultWorkspaceId =
    user.defaultOrganizationId && workspaces.some((item) => item.orgId === user.defaultOrganizationId)
      ? user.defaultOrganizationId
      : workspaces[0]?.orgId || null;

  return {
    user: { id: user.id, email: user.email, name: user.name },
    workspaces,
    defaultWorkspaceId,
  };
};

export const resolvePortalWorkspace = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { organization: true } } },
  });

  if (!user || !user.memberships.length) return null;

  const memberships = selectBestMembershipPerOrganization(user.memberships);
  if (!memberships.length) return null;

  const selectedMembership =
    memberships.find((membership) => membership.organizationId === user.defaultOrganizationId) || memberships[0];

  return { user, organization: selectedMembership.organization, membership: selectedMembership };
};

export const requireAdvertiserWorkspace = async (userId) => {
  const workspace = await resolvePortalWorkspace(userId);
  if (!workspace || workspace.organization.type !== "advertiser") return null;
  return workspace;
};

export const requirePublisherWorkspace = async (userId) => {
  const workspace = await resolvePortalWorkspace(userId);
  if (!workspace || workspace.organization.type !== "publisher") return null;
  return workspace;
};

// ─── Express middleware ───────────────────────────────────────────────────────

export const readUserEmail = (req) => String(req.headers["x-user-email"] || "").trim().toLowerCase();

export const requirePortalUser = async (req, res, next) => {
  const email = readUserEmail(req);
  if (!email) {
    return res.status(401).json({ error: "Missing x-user-email header" });
  }

  const validation = await validatePortalSession(req, email);
  if (!validation.ok) {
    return res.status(validation.status).json({ error: validation.error });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "User not provisioned. Call /api/auth/sync-user first." });
  }

  req.portalUser = user;
  return next();
};

export const requireAdminPortalUser = async (req, res, next) => {
  const workspace = await resolvePortalWorkspace(req.portalUser.id);
  if (!workspace || workspace.organization.type !== "admin" || !isAdminMembershipRole(workspace.membership.role)) {
    return res.status(403).json({ error: "Admin workspace required" });
  }
  req.portalWorkspace = workspace;
  return next();
};

export const requireAdminKey = (req, res, next) => {
  const suppliedKey = String(req.headers["x-admin-key"] || "");
  if (!suppliedKey || !secureEqual(suppliedKey, adminApiKey)) {
    return res.status(401).json({ error: "Unauthorized admin key" });
  }
  return next();
};

export const requireSdkKey = async (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized SDK key" });
  }

  if (secureEqual(token, sdkApiKey)) {
    req.sdkAuth = { mode: "master", rawToken: token };
    return next();
  }

  try {
    const tokenHash = hashSecret(token);
    const sdkKey = await prisma.botSdkKey.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { bot: true },
    });

    if (!sdkKey?.bot) {
      return res.status(401).json({ error: "Unauthorized SDK key" });
    }

    req.sdkAuth = {
      mode: "bot",
      botId: sdkKey.bot.id,
      botPublicId: sdkKey.bot.publicId,
      keyId: sdkKey.id,
      rawToken: token,
    };
    return next();
  } catch (err) {
    logger.error("SDK auth failed", err);
    return res.status(500).json({ error: "Failed to validate SDK key" });
  }
};

export const ensureSdkBotScope = (req, botId) => {
  if (req.sdkAuth?.mode !== "bot") return { ok: true };
  if (req.sdkAuth.botPublicId !== botId) {
    return { ok: false, status: 403, error: "SDK key is not authorized for this botId" };
  }
  return { ok: true };
};

/**
 * Verify the HMAC request signature on SDK calls.
 *
 * Requires requireSdkKey to have run first (sets req.sdkAuth.rawToken).
 *
 * Enabled when REQUIRE_SDK_HMAC=true. When disabled, valid signatures are
 * still accepted and invalid ones log a warning — allowing a gradual rollout.
 *
 * Headers expected from the SDK client:
 *   X-Prism-Timestamp: <unix-seconds>
 *   X-Prism-Signature: sha256=<hmac-hex>
 *
 * Signed payload: `<timestamp>\n<raw-utf8-body>`
 */
const HMAC_WINDOW_SECONDS = 300; // ±5 minutes

export const requireSdkSignature = (req, res, next) => {
  const timestamp = String(req.headers["x-prism-timestamp"] || "");
  const signature = String(req.headers["x-prism-signature"] || "");
  const rawToken = req.sdkAuth?.rawToken || "";

  const hasHeaders = Boolean(timestamp && signature);

  if (!hasHeaders) {
    if (requireSdkHmac) {
      return res.status(401).json({ error: "Missing request signature (X-Prism-Timestamp + X-Prism-Signature required)" });
    }
    return next();
  }

  // Timestamp freshness check
  const ts = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > HMAC_WINDOW_SECONDS) {
    if (requireSdkHmac) {
      return res.status(401).json({ error: "Request timestamp expired or invalid" });
    }
    logger.warn("SDK request signature timestamp expired", { botId: req.sdkAuth?.botPublicId, ts, now });
    return next();
  }

  const rawBody = req.rawBody || "";
  const valid = verifyHmac(rawBody, timestamp, signature, rawToken);

  if (!valid) {
    if (requireSdkHmac) {
      return res.status(401).json({ error: "Invalid request signature" });
    }
    logger.warn("SDK request signature mismatch (enforcement disabled)", { botId: req.sdkAuth?.botPublicId });
  }

  return next();
};
