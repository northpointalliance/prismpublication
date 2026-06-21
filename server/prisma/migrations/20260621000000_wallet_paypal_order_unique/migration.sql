-- Enforce a single wallet transaction per PayPal order (idempotent capture, no double-credit).
-- Postgres treats NULLs as distinct, so existing rows with NULL "paypalOrderId" are unaffected.
CREATE UNIQUE INDEX "wallet_transactions_paypalOrderId_key" ON "wallet_transactions"("paypalOrderId");
