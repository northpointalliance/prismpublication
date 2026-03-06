/**
 * Pure business-logic helpers for money flows.
 * Keeping these as plain functions makes them easy to unit-test
 * without mocking Prisma or Express.
 */

import type { PrismaClient } from "@prisma/client";

interface AvailableBalance {
  grossAvailableCents: number;
  availableCents: number;
}

/**
 * Calculate publisher available balance after platform fee deduction.
 */
export function calcPublisherAvailable(
  totalEarnedCents: number,
  totalPaidCents: number,
  platformFeePct: number,
): AvailableBalance {
  const grossAvailableCents = Math.max(0, totalEarnedCents - totalPaidCents);
  const availableCents = Math.floor(grossAvailableCents * (1 - platformFeePct / 100));
  return { grossAvailableCents, availableCents };
}

interface PayPalCapture {
  status?: string;
  amount?: { value?: string };
}

/**
 * Parse the captured amount in cents from a PayPal capture response object.
 */
export function parsePayPalCaptureCents(capture: PayPalCapture | null | undefined): number | null {
  if (!capture || capture.status !== "COMPLETED") return null;
  const dollars = parseFloat(capture?.amount?.value ?? "");
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

type SpendResult = { ok: true } | { ok: false; reason: string };

/**
 * Validate that a wallet spend is permissible.
 */
export function checkWalletSpend(currentBalanceCents: number, spendAmountCents: number): SpendResult {
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
 * Minimum 1 cent -- prevents zero-cost impressions when CPM < $10.
 */
export function cpmiCents(cpmCents: number): number {
  return Math.max(1, Math.round(cpmCents / 1000));
}

/**
 * Fetch the configured CPM rate for a given ad format from PlatformSettings,
 * falling back to the platform default.
 */
export async function getPlatformCpmRate(format: string, prisma: PrismaClient): Promise<number> {
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
 */
export function checkWithdrawMinimum(grossAvailableCents: number): SpendResult {
  if (grossAvailableCents < 100) {
    return { ok: false, reason: "minimum withdrawal is $1.00" };
  }
  return { ok: true };
}
