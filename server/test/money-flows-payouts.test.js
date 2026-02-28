/**
 * Integration tests — Publisher payout money flows
 *
 * Tests cover:
 *   - Publisher available balance calculation (gross revenue - paid - platform fee)
 *   - Minimum withdrawal threshold ($1.00)
 *   - Inflight payout guard (cannot withdraw while one is pending/processing)
 *   - Platform fee arithmetic across common rates
 *   - Edge cases: zero earned, all earned already paid, 100% fee
 */

import test from "node:test";
import assert from "node:assert/strict";
import { calcPublisherAvailable, checkWithdrawMinimum } from "../src/money-utils.js";

// ─── calcPublisherAvailable ───────────────────────────────────────────────────

test("calcPublisherAvailable: 30% fee on clean earnings", () => {
  const { grossAvailableCents, availableCents } = calcPublisherAvailable(10000, 0, 30);
  assert.equal(grossAvailableCents, 10000);
  assert.equal(availableCents, 7000); // 10000 * 0.70
});

test("calcPublisherAvailable: deducts already-paid amounts before fee", () => {
  // $100 earned, $40 already paid/processing → $60 gross → 30% fee → $42
  const { grossAvailableCents, availableCents } = calcPublisherAvailable(10000, 4000, 30);
  assert.equal(grossAvailableCents, 6000);
  assert.equal(availableCents, 4200);
});

test("calcPublisherAvailable: 0% platform fee passes full gross through", () => {
  const { grossAvailableCents, availableCents } = calcPublisherAvailable(5000, 0, 0);
  assert.equal(grossAvailableCents, 5000);
  assert.equal(availableCents, 5000);
});

test("calcPublisherAvailable: 100% platform fee leaves zero available", () => {
  const { availableCents } = calcPublisherAvailable(5000, 0, 100);
  assert.equal(availableCents, 0);
});

test("calcPublisherAvailable: floors fractional cents (never rounds up)", () => {
  // 1 cent earned, 30% fee → 0.7 cents → floors to 0
  const { availableCents } = calcPublisherAvailable(1, 0, 30);
  assert.equal(availableCents, 0);
});

test("calcPublisherAvailable: 3 cents earned at 30% fee → floor(2.1) = 2 cents", () => {
  const { availableCents } = calcPublisherAvailable(3, 0, 30);
  assert.equal(availableCents, 2);
});

test("calcPublisherAvailable: gross cannot go negative (clamps to zero)", () => {
  // totalPaid > totalEarned — e.g. manual corrections
  const { grossAvailableCents, availableCents } = calcPublisherAvailable(1000, 2000, 30);
  assert.equal(grossAvailableCents, 0);
  assert.equal(availableCents, 0);
});

test("calcPublisherAvailable: zero earned produces zero available", () => {
  const { grossAvailableCents, availableCents } = calcPublisherAvailable(0, 0, 30);
  assert.equal(grossAvailableCents, 0);
  assert.equal(availableCents, 0);
});

test("calcPublisherAvailable: fee calculation is precise for common rates", () => {
  // 25% fee
  assert.equal(calcPublisherAvailable(10000, 0, 25).availableCents, 7500);
  // 15% fee
  assert.equal(calcPublisherAvailable(10000, 0, 15).availableCents, 8500);
  // 50% fee
  assert.equal(calcPublisherAvailable(10000, 0, 50).availableCents, 5000);
});

// ─── checkWithdrawMinimum ─────────────────────────────────────────────────────

test("checkWithdrawMinimum: passes at exactly $1.00 (100 cents)", () => {
  assert.equal(checkWithdrawMinimum(100).ok, true);
});

test("checkWithdrawMinimum: passes above minimum", () => {
  assert.equal(checkWithdrawMinimum(101).ok, true);
  assert.equal(checkWithdrawMinimum(10000).ok, true);
});

test("checkWithdrawMinimum: fails at 99 cents (below $1.00)", () => {
  const result = checkWithdrawMinimum(99);
  assert.equal(result.ok, false);
  assert.ok(result.reason, "should include a reason message");
});

test("checkWithdrawMinimum: fails at zero", () => {
  assert.equal(checkWithdrawMinimum(0).ok, false);
});

test("checkWithdrawMinimum: fails at negative amounts (over-paid scenario)", () => {
  assert.equal(checkWithdrawMinimum(-500).ok, false);
});

// ─── Inflight payout guard invariant ─────────────────────────────────────────
// The guard in payouts.js checks: prisma.payoutRequest.findFirst({ status: { in: ["pending", "processing"] } })
// We test the state-machine invariant in memory.

test("inflight guard: second withdrawal request is blocked while first is pending", () => {
  const payouts = [];

  function requestWithdrawal(orgId, amountCents) {
    const inflight = payouts.find(
      (p) => p.orgId === orgId && (p.status === "pending" || p.status === "processing"),
    );
    if (inflight) return { ok: false, inflightStatus: inflight.status };

    const payout = { id: `pr-${payouts.length + 1}`, orgId, amountCents, status: "pending" };
    payouts.push(payout);
    return { ok: true, payout };
  }

  function updatePayoutStatus(id, newStatus) {
    const p = payouts.find((p) => p.id === id);
    if (p) p.status = newStatus;
  }

  // First withdrawal — should succeed
  const r1 = requestWithdrawal("org-1", 5000);
  assert.equal(r1.ok, true);
  assert.equal(r1.payout.status, "pending");

  // Second withdrawal while first is pending — must be blocked
  const r2 = requestWithdrawal("org-1", 5000);
  assert.equal(r2.ok, false);
  assert.equal(r2.inflightStatus, "pending");

  // Payout transitions to processing — still blocked
  updatePayoutStatus("pr-1", "processing");
  const r3 = requestWithdrawal("org-1", 5000);
  assert.equal(r3.ok, false);
  assert.equal(r3.inflightStatus, "processing");

  // Payout completes (paid) — new withdrawal should be allowed
  updatePayoutStatus("pr-1", "paid");
  const r4 = requestWithdrawal("org-1", 3000);
  assert.equal(r4.ok, true);
  assert.equal(payouts.length, 2);
});

test("inflight guard: different orgs do not block each other", () => {
  const payouts = [];

  function requestWithdrawal(orgId, amountCents) {
    const inflight = payouts.find(
      (p) => p.orgId === orgId && (p.status === "pending" || p.status === "processing"),
    );
    if (inflight) return { ok: false };
    payouts.push({ id: `pr-${payouts.length + 1}`, orgId, amountCents, status: "pending" });
    return { ok: true };
  }

  assert.equal(requestWithdrawal("org-A", 1000).ok, true);
  assert.equal(requestWithdrawal("org-B", 2000).ok, true); // different org — must succeed
  assert.equal(requestWithdrawal("org-A", 1000).ok, false); // same org — must be blocked
});

// ─── Full payout flow sequence ────────────────────────────────────────────────

test("full payout flow: earned → fee deducted → minimum check → creates request", () => {
  const platformFeePct = 30;

  // Publisher earned $15.00 in revenue, $5.00 already paid out
  const { grossAvailableCents, availableCents } = calcPublisherAvailable(1500, 500, platformFeePct);
  assert.equal(grossAvailableCents, 1000); // $10.00 gross remaining

  // Check minimum ($1.00 = 100 cents gross)
  const minCheck = checkWithdrawMinimum(grossAvailableCents);
  assert.equal(minCheck.ok, true);

  // After fee: $10.00 * 0.70 = $7.00
  assert.equal(availableCents, 700);

  // Verify the withdrawal amount is above zero
  assert.ok(availableCents > 0, "available after fee should be positive");
});

test("full payout flow: tiny earnings produce $0 after fee when below minimum", () => {
  // $0.50 earned, 30% fee → $0.35 gross available but below $1.00 minimum
  const { grossAvailableCents, availableCents } = calcPublisherAvailable(50, 0, 30);
  assert.equal(grossAvailableCents, 50);

  const minCheck = checkWithdrawMinimum(grossAvailableCents);
  assert.equal(minCheck.ok, false, "should fail minimum threshold at 50 cents gross");

  assert.equal(availableCents, 35); // 35 cents after fee — also below $1.00
});
