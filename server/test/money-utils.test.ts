import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcPublisherAvailable,
  parsePayPalCaptureCents,
  checkWalletSpend,
  cpmiCents,
  checkWithdrawMinimum,
} from "../src/money-utils.js";

// ---------------------------------------------------------------------------
// calcPublisherAvailable
// ---------------------------------------------------------------------------

describe("calcPublisherAvailable", () => {
  it("deducts platform fee from gross available", () => {
    const result = calcPublisherAvailable(10_000, 0, 30);
    assert.equal(result.grossAvailableCents, 10_000);
    assert.equal(result.availableCents, 7_000);
  });

  it("subtracts already-paid amount before applying fee", () => {
    const result = calcPublisherAvailable(10_000, 4_000, 20);
    assert.equal(result.grossAvailableCents, 6_000);
    // 6000 * 0.80 = 4800
    assert.equal(result.availableCents, 4_800);
  });

  it("returns zero when totalPaid equals totalEarned", () => {
    const result = calcPublisherAvailable(5_000, 5_000, 10);
    assert.equal(result.grossAvailableCents, 0);
    assert.equal(result.availableCents, 0);
  });

  it("clamps to zero when totalPaid exceeds totalEarned", () => {
    const result = calcPublisherAvailable(1_000, 3_000, 10);
    assert.equal(result.grossAvailableCents, 0);
    assert.equal(result.availableCents, 0);
  });

  it("returns full amount when fee is 0%", () => {
    const result = calcPublisherAvailable(5_000, 0, 0);
    assert.equal(result.grossAvailableCents, 5_000);
    assert.equal(result.availableCents, 5_000);
  });

  it("returns zero available when fee is 100%", () => {
    const result = calcPublisherAvailable(5_000, 0, 100);
    assert.equal(result.grossAvailableCents, 5_000);
    assert.equal(result.availableCents, 0);
  });

  it("floors fractional cents", () => {
    // 333 * 0.85 = 283.05 -> floor to 283
    const result = calcPublisherAvailable(333, 0, 15);
    assert.equal(result.availableCents, 283);
  });

  it("handles zero earnings", () => {
    const result = calcPublisherAvailable(0, 0, 30);
    assert.equal(result.grossAvailableCents, 0);
    assert.equal(result.availableCents, 0);
  });
});

// ---------------------------------------------------------------------------
// parsePayPalCaptureCents
// ---------------------------------------------------------------------------

describe("parsePayPalCaptureCents", () => {
  it("parses a valid COMPLETED capture", () => {
    const result = parsePayPalCaptureCents({
      status: "COMPLETED",
      amount: { value: "25.50" },
    });
    assert.equal(result, 2_550);
  });

  it("rounds fractional cents correctly", () => {
    const result = parsePayPalCaptureCents({
      status: "COMPLETED",
      amount: { value: "9.999" },
    });
    assert.equal(result, 1_000); // Math.round(999.9)
  });

  it("returns null for non-COMPLETED status", () => {
    assert.equal(
      parsePayPalCaptureCents({ status: "PENDING", amount: { value: "10.00" } }),
      null,
    );
  });

  it("returns null for missing status", () => {
    assert.equal(
      parsePayPalCaptureCents({ amount: { value: "10.00" } }),
      null,
    );
  });

  it("returns null for null input", () => {
    assert.equal(parsePayPalCaptureCents(null), null);
  });

  it("returns null for undefined input", () => {
    assert.equal(parsePayPalCaptureCents(undefined), null);
  });

  it("returns null when amount value is missing", () => {
    assert.equal(
      parsePayPalCaptureCents({ status: "COMPLETED", amount: {} }),
      null,
    );
  });

  it("returns null when amount object is missing", () => {
    assert.equal(parsePayPalCaptureCents({ status: "COMPLETED" }), null);
  });

  it("returns null for zero dollar amount", () => {
    assert.equal(
      parsePayPalCaptureCents({ status: "COMPLETED", amount: { value: "0.00" } }),
      null,
    );
  });

  it("returns null for negative dollar amount", () => {
    assert.equal(
      parsePayPalCaptureCents({ status: "COMPLETED", amount: { value: "-5.00" } }),
      null,
    );
  });

  it("returns null for non-numeric value string", () => {
    assert.equal(
      parsePayPalCaptureCents({ status: "COMPLETED", amount: { value: "abc" } }),
      null,
    );
  });
});

// ---------------------------------------------------------------------------
// checkWalletSpend
// ---------------------------------------------------------------------------

describe("checkWalletSpend", () => {
  it("allows spend when balance is sufficient", () => {
    const result = checkWalletSpend(5_000, 3_000);
    assert.deepEqual(result, { ok: true });
  });

  it("allows spend when balance exactly matches", () => {
    const result = checkWalletSpend(1_000, 1_000);
    assert.deepEqual(result, { ok: true });
  });

  it("rejects when balance is insufficient", () => {
    const result = checkWalletSpend(500, 1_000);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "insufficient balance");
  });

  it("rejects zero spend amount", () => {
    const result = checkWalletSpend(5_000, 0);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "spend amount must be a positive integer");
  });

  it("rejects negative spend amount", () => {
    const result = checkWalletSpend(5_000, -100);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "spend amount must be a positive integer");
  });

  it("rejects fractional spend amount", () => {
    const result = checkWalletSpend(5_000, 10.5);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "spend amount must be a positive integer");
  });

  it("allows spend of 1 cent (minimum)", () => {
    const result = checkWalletSpend(1, 1);
    assert.deepEqual(result, { ok: true });
  });

  it("rejects spend from zero balance", () => {
    const result = checkWalletSpend(0, 1);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "insufficient balance");
  });
});

// ---------------------------------------------------------------------------
// cpmiCents
// ---------------------------------------------------------------------------

describe("cpmiCents", () => {
  it("returns per-impression cost for standard CPM", () => {
    // $10 CPM = 1000 cents / 1000 = 1 cent per impression
    assert.equal(cpmiCents(1_000), 1);
  });

  it("returns higher per-impression cost for high CPM", () => {
    // $50 CPM = 5000 cents / 1000 = 5 cents
    assert.equal(cpmiCents(5_000), 5);
  });

  it("enforces minimum of 1 cent", () => {
    // 500 cents / 1000 = 0.5 -> rounds to 1
    assert.equal(cpmiCents(500), 1);
  });

  it("enforces minimum of 1 cent for very low CPM", () => {
    assert.equal(cpmiCents(1), 1);
  });

  it("enforces minimum of 1 cent for zero CPM", () => {
    assert.equal(cpmiCents(0), 1);
  });

  it("rounds correctly at boundary", () => {
    // 1499 / 1000 = 1.499 -> rounds to 1
    assert.equal(cpmiCents(1_499), 1);
    // 1500 / 1000 = 1.5 -> rounds to 2
    assert.equal(cpmiCents(1_500), 2);
  });

  it("handles large CPM values", () => {
    // $100 CPM = 10000 cents / 1000 = 10
    assert.equal(cpmiCents(10_000), 10);
  });
});

// ---------------------------------------------------------------------------
// checkWithdrawMinimum
// ---------------------------------------------------------------------------

describe("checkWithdrawMinimum", () => {
  it("allows withdrawal at exactly $1.00 (100 cents)", () => {
    const result = checkWithdrawMinimum(100);
    assert.deepEqual(result, { ok: true });
  });

  it("allows withdrawal above minimum", () => {
    const result = checkWithdrawMinimum(5_000);
    assert.deepEqual(result, { ok: true });
  });

  it("rejects withdrawal below minimum", () => {
    const result = checkWithdrawMinimum(99);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "minimum withdrawal is $1.00");
  });

  it("rejects zero balance withdrawal", () => {
    const result = checkWithdrawMinimum(0);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "minimum withdrawal is $1.00");
  });

  it("rejects negative balance withdrawal", () => {
    const result = checkWithdrawMinimum(-50);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "minimum withdrawal is $1.00");
  });

  it("rejects 1 cent withdrawal", () => {
    const result = checkWithdrawMinimum(1);
    assert.equal(result.ok, false);
  });
});
