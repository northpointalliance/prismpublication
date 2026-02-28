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
 * Returns the per-impression charge in whole cents for a given CPM rate in cents.
 * Minimum 1 cent — prevents zero-cost impressions when CPM < $10.
 *
 * @param {number} cpmCents - CPM rate in cents (e.g. 2000 = $20.00 CPM)
 * @returns {number} Cents to charge per impression
 */
export function cpmiCents(cpmCents) {
  return Math.max(1, Math.round(cpmCents / 1000));
}

/**
 * Fetch the configured CPM rate for a given ad format from PlatformSettings,
 * falling back to the platform default.
 *
 * @param {string} format - "text" | "card" | "banner"
 * @param {import("@prisma/client").PrismaClient} prisma
 * @returns {Promise<number>} CPM rate in cents
 */
export async function getPlatformCpmRate(format, prisma) {
  const { CPM_TEXT_KEY, CPM_CARD_KEY, CPM_BANNER_KEY, DEFAULT_CPM_TEXT, DEFAULT_CPM_CARD, DEFAULT_CPM_BANNER } =
    await import("./config.js");
  const key =
    format === "text" ? CPM_TEXT_KEY : format === "banner" ? CPM_BANNER_KEY : CPM_CARD_KEY;
  const defaultVal =
    format === "text" ? DEFAULT_CPM_TEXT : format === "banner" ? DEFAULT_CPM_BANNER : DEFAULT_CPM_CARD;
  const row = await prisma.platformSettings.findUnique({ where: { key } });
  return row ? parseInt(row.value, 10) || defaultVal : defaultVal;
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
