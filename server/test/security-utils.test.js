import test from "node:test";
import assert from "node:assert/strict";
import { getBearerToken, secureEqual } from "../src/security-utils.js";

test("getBearerToken returns token when Bearer prefix exists", () => {
  assert.equal(getBearerToken("Bearer abc123"), "abc123");
});

test("getBearerToken returns empty string for non-bearer input", () => {
  assert.equal(getBearerToken("Basic abc123"), "");
  assert.equal(getBearerToken(""), "");
});

test("secureEqual handles matching and mismatched values", () => {
  assert.equal(secureEqual("same", "same"), true);
  assert.equal(secureEqual("same", "different"), false);
  assert.equal(secureEqual("", ""), true);
});
