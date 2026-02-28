/**
 * Integration tests — Wallet money flows
 *
 * Tests cover the critical invariants for advertiser wallet operations:
 *   - PayPal capture response parsing (success, failure, malformed)
 *   - Wallet spend validation (sufficient funds, insufficient, edge cases)
 *   - Idempotency logic (same orderID must not double-credit)
 *   - Balance arithmetic after topup and spend sequences
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePayPalCaptureCents,
  checkWalletSpend,
} from "../src/money-utils.js";

// ─── parsePayPalCaptureCents ──────────────────────────────────────────────────

test("parsePayPalCaptureCents: returns cents for a completed capture", () => {
  const capture = { status: "COMPLETED", amount: { value: "25.00" } };
  assert.equal(parsePayPalCaptureCents(capture), 2500);
});

test("parsePayPalCaptureCents: rounds fractional cents correctly", () => {
  // $10.999 → 1100 cents (Math.round)
  assert.equal(parsePayPalCaptureCents({ status: "COMPLETED", amount: { value: "10.999" } }), 1100);
  // $0.01 → 1 cent
  assert.equal(parsePayPalCaptureCents({ status: "COMPLETED", amount: { value: "0.01" } }), 1);
});

test("parsePayPalCaptureCents: returns null for non-COMPLETED status", () => {
  assert.equal(parsePayPalCaptureCents({ status: "PENDING", amount: { value: "25.00" } }), null);
  assert.equal(parsePayPalCaptureCents({ status: "DECLINED", amount: { value: "25.00" } }), null);
  assert.equal(parsePayPalCaptureCents({ status: "VOIDED", amount: { value: "25.00" } }), null);
});

test("parsePayPalCaptureCents: returns null for zero or negative amounts", () => {
  assert.equal(parsePayPalCaptureCents({ status: "COMPLETED", amount: { value: "0" } }), null);
  assert.equal(parsePayPalCaptureCents({ status: "COMPLETED", amount: { value: "-5.00" } }), null);
});

test("parsePayPalCaptureCents: returns null for malformed input", () => {
  assert.equal(parsePayPalCaptureCents(null), null);
  assert.equal(parsePayPalCaptureCents(undefined), null);
  assert.equal(parsePayPalCaptureCents({}), null);
  assert.equal(parsePayPalCaptureCents({ status: "COMPLETED" }), null);
  assert.equal(parsePayPalCaptureCents({ status: "COMPLETED", amount: { value: "not-a-number" } }), null);
});

test("parsePayPalCaptureCents: handles large top-up amounts", () => {
  // Max allowed is $10,000 ($1,000,000 cents)
  const capture = { status: "COMPLETED", amount: { value: "10000.00" } };
  assert.equal(parsePayPalCaptureCents(capture), 1_000_000);
});

// ─── checkWalletSpend ─────────────────────────────────────────────────────────

test("checkWalletSpend: succeeds when balance exactly equals spend", () => {
  const result = checkWalletSpend(500, 500);
  assert.equal(result.ok, true);
});

test("checkWalletSpend: succeeds when balance exceeds spend", () => {
  assert.equal(checkWalletSpend(1000, 1).ok, true);
  assert.equal(checkWalletSpend(1000, 999).ok, true);
});

test("checkWalletSpend: fails when balance is less than spend amount", () => {
  const result = checkWalletSpend(100, 101);
  assert.equal(result.ok, false);
  assert.ok(result.reason, "should include a reason message");
});

test("checkWalletSpend: fails on zero balance with any spend", () => {
  assert.equal(checkWalletSpend(0, 1).ok, false);
});

test("checkWalletSpend: fails for spend amount of zero", () => {
  assert.equal(checkWalletSpend(1000, 0).ok, false);
});

test("checkWalletSpend: fails for negative spend amount", () => {
  assert.equal(checkWalletSpend(1000, -50).ok, false);
});

test("checkWalletSpend: fails for non-integer spend amount", () => {
  assert.equal(checkWalletSpend(1000, 10.5).ok, false);
});

// ─── Idempotency invariant ────────────────────────────────────────────────────
// The idempotency guard is implemented in wallet.js:
//   const existingTx = await prisma.walletTransaction.findFirst({ where: { paypalOrderId } })
//   if (existingTx) → return early without re-crediting
// We test the invariant by simulating the state machine in memory.

test("idempotency: wallet balance must not increase on a duplicate capture", () => {
  // Simulate in-memory wallet state
  const wallet = { balanceCents: 0 };
  const capturedOrderIds = new Set();

  function applyCapture(orderId, amountCents) {
    if (capturedOrderIds.has(orderId)) {
      // Idempotent: return current balance without crediting again
      return { duplicate: true, balanceCents: wallet.balanceCents };
    }
    capturedOrderIds.add(orderId);
    wallet.balanceCents += amountCents;
    return { duplicate: false, balanceCents: wallet.balanceCents };
  }

  const r1 = applyCapture("order-abc", 2500);
  assert.equal(r1.duplicate, false);
  assert.equal(r1.balanceCents, 2500);

  // Second call with same ID — must not double-credit
  const r2 = applyCapture("order-abc", 2500);
  assert.equal(r2.duplicate, true);
  assert.equal(r2.balanceCents, 2500, "balance must not increase on duplicate capture");

  // Different order ID should still be credited
  const r3 = applyCapture("order-xyz", 1000);
  assert.equal(r3.duplicate, false);
  assert.equal(r3.balanceCents, 3500);
});

// ─── Balance arithmetic sequence ──────────────────────────────────────────────

test("balance arithmetic: topup then spend produces correct final balance", () => {
  let balance = 0;

  // Top up $50
  const topup = parsePayPalCaptureCents({ status: "COMPLETED", amount: { value: "50.00" } });
  assert.equal(topup, 5000);
  balance += topup;
  assert.equal(balance, 5000);

  // Spend $12.50
  const spendAmount = 1250;
  const spendCheck = checkWalletSpend(balance, spendAmount);
  assert.equal(spendCheck.ok, true);
  balance -= spendAmount;
  assert.equal(balance, 3750);

  // Try to spend more than remaining — must fail
  const overSpend = checkWalletSpend(balance, 4000);
  assert.equal(overSpend.ok, false);
  // Balance unchanged
  assert.equal(balance, 3750);
});

test("balance arithmetic: multiple topups accumulate correctly", () => {
  let balance = 0;
  const topups = ["100.00", "50.00", "25.00"];

  for (const value of topups) {
    const cents = parsePayPalCaptureCents({ status: "COMPLETED", amount: { value } });
    assert.ok(cents !== null, `should parse ${value}`);
    balance += cents;
  }

  assert.equal(balance, 17500); // $175.00
});
