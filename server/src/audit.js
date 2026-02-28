import { prisma } from "./db.js";
import { logger } from "./logger.js";

/**
 * Write a structured audit log entry.
 *
 * Never throws — audit failures must not interrupt the main request flow.
 *
 * @param {object} opts
 * @param {string} opts.action          - AuditAction enum value
 * @param {string} [opts.actorUserId]   - ID of the user who performed the action
 * @param {string} [opts.organizationId]
 * @param {string} [opts.resourceId]    - e.g. ad ID, payout request ID
 * @param {string} [opts.resourceType]  - e.g. "ad", "payout_request", "platform_settings"
 * @param {object} [opts.before]        - State before the change
 * @param {object} [opts.after]         - State after the change
 * @param {import("express").Request} [opts.req] - Express request (for IP extraction)
 */
export async function logAudit({ action, actorUserId, organizationId, resourceId, resourceType, before, after, req }) {
  try {
    const ipAddress =
      req
        ? String(
            req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
              req.socket?.remoteAddress ||
              "",
          ).slice(0, 100)
        : undefined;

    await prisma.auditLog.create({
      data: {
        action,
        actorUserId: actorUserId ?? null,
        organizationId: organizationId ?? null,
        resourceId: resourceId ?? null,
        resourceType: resourceType ?? null,
        before: before ?? undefined,
        after: after ?? undefined,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (err) {
    logger.error("audit log write failed", { action, resourceId, err: String(err) });
  }
}
