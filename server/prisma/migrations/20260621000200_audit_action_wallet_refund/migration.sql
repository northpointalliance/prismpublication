-- Add WALLET_REFUND to the AuditAction enum so refund-on-delete audit rows insert.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WALLET_REFUND';
