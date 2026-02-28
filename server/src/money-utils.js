/**
 * Pure business-logic helpers for money flows.
 * Keeping these as plain functions makes them easy to unit-test
 * without mocking Prisma or Express.
 */

/**
 * Calculate publisher available balance after platform fee deduction.
 *
 * @param {number} totalEarnedCents   - Gross lifetime revenue events
 * @param {number} totalPaidCents     - Sum of paid + processing payout requests
 * @param {number} platformFeePct     - 0–100 (e.g. 30 = 30%)
 * @returns {{ grossAvailableCents: number, availableCents: number }}
 */
export function calcPublisherAvailable(totalEarnedCents, totalPaidCents, platformFeePct) {
  const grossAvailableCents = Math.max(0, totalEarnedCents - totalPaidCents);
  const availableCents = Math.floor(grossAvailableCents * (1 - platformFeePct / 100));
  return { grossAvailableCents, availableCents };
}

/**
 * Parse the captured amount in cents from a PayPal capture response object.
 *
 * @param {object|null|undefined} capture - The capture object from purchase_units[0].payments.captures[0]
 * @returns {number|null} Cents, or null if the capture did not complete
 */
export function parsePayPalCaptureCents(capture) {
  if (!capture || capture.status !== "COMPLETED") return null;
  const dollars = parseFloat(capture?.amount?.value);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

/**
 * Validate that a wallet spend is permissible.
 *
 * @param {number} currentBalanceCents
 * @param {number} spendAmountCents
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function checkWalletSpend(currentBalanceCents, spendAmountCents) {
  if (!Number.isInteger(spendAmountCents) || spendAmountCents < 1) {
    return { ok: false, reason: "spend amount must be a positive integer" };
  }
  if (currentBalanceCents < spendAmountCents) {
    return { ok: false, reason: "insufficient balance" };
  }
  return { ok: true };
}

/**
 * Check whether a payout withdrawal request meets the minimum threshold.
 * The $1.00 minimum applies to the GROSS available amount before fee deduction,
 * matching the server-side check in payouts.js.
 *
 * @param {number} grossAvailableCents
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function checkWithdrawMinimum(grossAvailableCents) {
  if (grossAvailableCents < 100) {
    return { ok: false, reason: "minimum withdrawal is $1.00" };
  }
  return { ok: true };
}
