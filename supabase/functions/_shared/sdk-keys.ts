// Port of the SDK-key helpers from server/src/helpers.ts (Prisma tx -> sql.begin, async hashSecret).
import { sql } from "./db.ts";
import { newId } from "./ids.ts";
import { createSdkToken, hashSecret } from "./crypto.ts";

export interface PublicSdkKey {
  id: string;
  label: string;
  prefix: string;
  last4: string;
  createdAt: Date | string;
  revokedAt: Date | string | null;
}

export const toPublicSdkKey = (key: Record<string, unknown>): PublicSdkKey => ({
  id: key.id as string,
  label: key.label as string,
  prefix: key.prefix as string,
  last4: key.last4 as string,
  createdAt: key.createdAt as Date,
  revokedAt: (key.revokedAt as Date | null) ?? null,
});

export const createPublisherSdkKey = async ({
  botId, label, revokeExisting = false,
}: { botId: string; label: string; revokeExisting?: boolean }): Promise<PublicSdkKey & { token: string }> => {
  const token = createSdkToken();
  const tokenHash = await hashSecret(token);
  const prefix = token.slice(0, 10);
  const last4 = token.slice(-4);

  const created = await sql.begin(async (tx) => {
    if (revokeExisting) {
      await tx`UPDATE bot_sdk_keys SET "revokedAt" = now(), "updatedAt" = now()
               WHERE "botId" = ${botId} AND "revokedAt" IS NULL`;
    }
    const rows = await tx`
      INSERT INTO bot_sdk_keys ("id","botId","label","tokenHash","prefix","last4","updatedAt")
      VALUES (${newId()}, ${botId}, ${label}, ${tokenHash}, ${prefix}, ${last4}, now())
      RETURNING *`;
    return rows[0];
  });
  return { ...toPublicSdkKey(created), token };
};
