import type { Request } from "express";
import type { AuditAction } from "@prisma/client";
import { prisma } from "./db.js";
import { logger } from "./logger.js";

interface LogAuditOptions {
  action: AuditAction;
  actorUserId?: string;
  organizationId?: string;
  resourceId?: string;
  resourceType?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  req?: Request;
}

/**
 * Write a structured audit log entry.
 *
 * Never throws -- audit failures must not interrupt the main request flow.
 */
export async function logAudit({
  action,
  actorUserId,
  organizationId,
  resourceId,
  resourceType,
  before,
  after,
  req,
}: LogAuditOptions): Promise<void> {
  try {
    const ipAddress = req
      ? String(
          req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
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
        before: (before ?? undefined) as any,
        after: (after ?? undefined) as any,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (err) {
    logger.error("audit log write failed", { action, resourceId, err: String(err) });
  }
}
