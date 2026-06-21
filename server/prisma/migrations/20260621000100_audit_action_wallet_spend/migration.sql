-- Add WALLET_SPEND to the AuditAction enum so wallet-spend / budget-reservation audit rows insert.
-- (Postgres 12+ allows ADD VALUE in a transaction as long as it isn't used in the same transaction.)
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WALLET_SPEND';
