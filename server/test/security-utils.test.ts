import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { getBearerToken, secureEqual, verifyHmac } from "../src/security-utils.js";

// ---------------------------------------------------------------------------
// getBearerToken
// ---------------------------------------------------------------------------

describe("getBearerToken", () => {
  it("extracts token from a valid Bearer header", () => {
    assert.equal(getBearerToken("Bearer abc123"), "abc123");
  });

  it("trims whitespace from extracted token", () => {
    assert.equal(getBearerToken("Bearer   tok_xyz   "), "tok_xyz");
  });

  it("returns empty string for missing Bearer prefix", () => {
    assert.equal(getBearerToken("Basic abc123"), "");
  });

  it("returns empty string for lowercase bearer (case-sensitive)", () => {
    assert.equal(getBearerToken("bearer abc123"), "");
  });

  it("returns empty string for empty header", () => {
    assert.equal(getBearerToken(""), "");
  });

  it("returns empty string for undefined header", () => {
    assert.equal(getBearerToken(undefined as unknown as string), "");
  });

  it("returns empty string for just the word Bearer with no token", () => {
    assert.equal(getBearerToken("Bearer "), "");
  });

  it("handles token with special characters", () => {
    assert.equal(getBearerToken("Bearer bgsk_abcdef1234567890"), "bgsk_abcdef1234567890");
  });

  it("does not match BearerX prefix", () => {
    assert.equal(getBearerToken("BearerXtoken"), "");
  });
});

// ---------------------------------------------------------------------------
// secureEqual
// ---------------------------------------------------------------------------

describe("secureEqual", () => {
  it("returns true for identical strings", () => {
    assert.equal(secureEqual("hello", "hello"), true);
  });

  it("returns false for different strings of same length", () => {
    assert.equal(secureEqual("abcde", "abcdf"), false);
  });

  it("returns false for different-length strings", () => {
    assert.equal(secureEqual("short", "much-longer-string"), false);
  });

  it("returns true for two empty strings", () => {
    assert.equal(secureEqual("", ""), true);
  });

  it("returns false when left is empty and right is not", () => {
    assert.equal(secureEqual("", "x"), false);
  });

  it("returns false when right is empty and left is not", () => {
    assert.equal(secureEqual("x", ""), false);
  });

  it("handles undefined left (defaults to empty string)", () => {
    assert.equal(secureEqual(undefined as unknown as string, ""), true);
  });

  it("handles undefined right (defaults to empty string)", () => {
    assert.equal(secureEqual("", undefined as unknown as string), true);
  });

  it("handles long identical strings", () => {
    const long = "a".repeat(10_000);
    assert.equal(secureEqual(long, long), true);
  });

  it("handles strings with special characters", () => {
    assert.equal(secureEqual("sha256=abc123", "sha256=abc123"), true);
    assert.equal(secureEqual("sha256=abc123", "sha256=abc124"), false);
  });
});

// ---------------------------------------------------------------------------
// verifyHmac
// ---------------------------------------------------------------------------

describe("verifyHmac", () => {
  const secret = "test-secret-key";
  const body = '{"event":"impression","adId":"ad-001"}';
  const timestamp = "1700000000";

  function computeValidSignature(rawBody: string, ts: string, sec: string): string {
    const expected = crypto
      .createHmac("sha256", sec)
      .update(`${ts}\n${rawBody}`)
      .digest("hex");
    return `sha256=${expected}`;
  }

  it("returns true for a valid signature", () => {
    const sig = computeValidSignature(body, timestamp, secret);
    assert.equal(verifyHmac(body, timestamp, sig, secret), true);
  });

  it("returns false when body has been tampered with", () => {
    const sig = computeValidSignature(body, timestamp, secret);
    const tampered = body.replace("impression", "click");
    assert.equal(verifyHmac(tampered, timestamp, sig, secret), false);
  });

  it("returns false when timestamp has been tampered with", () => {
    const sig = computeValidSignature(body, timestamp, secret);
    assert.equal(verifyHmac(body, "9999999999", sig, secret), false);
  });

  it("returns false when secret differs", () => {
    const sig = computeValidSignature(body, timestamp, secret);
    assert.equal(verifyHmac(body, timestamp, sig, "wrong-secret"), false);
  });

  it("returns false when signature prefix is missing", () => {
    const sig = computeValidSignature(body, timestamp, secret);
    const noPrefix = sig.replace("sha256=", "");
    assert.equal(verifyHmac(body, timestamp, noPrefix, secret), false);
  });

  it("returns false for completely wrong signature", () => {
    assert.equal(verifyHmac(body, timestamp, "sha256=0000deadbeef", secret), false);
  });

  it("returns false for empty signature", () => {
    assert.equal(verifyHmac(body, timestamp, "", secret), false);
  });

  it("handles empty body", () => {
    const sig = computeValidSignature("", timestamp, secret);
    assert.equal(verifyHmac("", timestamp, sig, secret), true);
  });

  it("handles empty timestamp", () => {
    const sig = computeValidSignature(body, "", secret);
    assert.equal(verifyHmac(body, "", sig, secret), true);
  });

  it("returns false for sha512 prefix (wrong algorithm)", () => {
    const sig = computeValidSignature(body, timestamp, secret);
    const wrongAlgo = sig.replace("sha256=", "sha512=");
    assert.equal(verifyHmac(body, timestamp, wrongAlgo, secret), false);
  });

  it("handles all-default parameters", () => {
    // All empty defaults -- should produce a valid HMAC for empty inputs
    const sig = computeValidSignature("", "", "");
    assert.equal(verifyHmac("", "", sig, ""), true);
  });
});
