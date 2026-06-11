// Port of server/src/money-utils.ts. Pure helpers unchanged; getPlatformCpmRate uses SQL.
import { sql } from "./db.ts";
import {
  CPM_TEXT_KEY, CPM_CARD_KEY, CPM_BANNER_KEY,
  DEFAULT_CPM_TEXT, DEFAULT_CPM_CARD, DEFAULT_CPM_BANNER,
} from "./config.ts";

export interface AvailableBalance { grossAvailableCents: number; availableCents: number }

export function calcPublisherAvailable(
  totalEarnedCents: number, totalPaidCents: number, platformFeePct: number,
): AvailableBalance {
  const grossAvailableCents = Math.max(0, totalEarnedCents - totalPaidCents);
  const availableCents = Math.floor(grossAvailableCents * (1 - platformFeePct / 100));
  return { grossAvailableCents, availableCents };
}

export function parsePayPalCaptureCents(capture: { status?: string; amount?: { value?: string } } | null | undefined): number | null {
  if (!capture || capture.status !== "COMPLETED") return null;
  const dollars = parseFloat(capture?.amount?.value ?? "");
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

export type SpendResult = { ok: true } | { ok: false; reason: string };

export function checkWalletSpend(currentBalanceCents: number, spendAmountCents: number): SpendResult {
  if (!Number.isInteger(spendAmountCents) || spendAmountCents < 1) {
    return { ok: false, reason: "spend amount must be a positive integer" };
  }
  if (currentBalanceCents < spendAmountCents) return { ok: false, reason: "insufficient balance" };
  return { ok: true };
}

export function cpmiCents(cpmCents: number): number {
  return Math.max(1, Math.round(cpmCents / 1000));
}

export async function getPlatformCpmRate(format: string): Promise<number> {
  const key = format === "text" ? CPM_TEXT_KEY : format === "banner" ? CPM_BANNER_KEY : CPM_CARD_KEY;
  const defaultVal = format === "text" ? DEFAULT_CPM_TEXT : format === "banner" ? DEFAULT_CPM_BANNER : DEFAULT_CPM_CARD;
  const rows = await sql`SELECT "value" FROM platform_settings WHERE "key" = ${key} LIMIT 1`;
  if (!rows.length) return defaultVal;
  return parseInt(rows[0].value, 10) || defaultVal;
}

export function checkWithdrawMinimum(grossAvailableCents: number): SpendResult {
  if (grossAvailableCents < 100) return { ok: false, reason: "minimum withdrawal is $1.00" };
  return { ok: true };
}
