import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeTopic, weightedPick, hashSecret, toSdkAd } from "../src/helpers.js";

// ---------------------------------------------------------------------------
// normalizeTopic
// ---------------------------------------------------------------------------

describe("normalizeTopic", () => {
  it("lowercases and trims a normal string", () => {
    assert.equal(normalizeTopic("  Tech  "), "tech");
  });

  it("handles already-lowercase trimmed input", () => {
    assert.equal(normalizeTopic("gaming"), "gaming");
  });

  it("handles mixed case with internal spaces", () => {
    assert.equal(normalizeTopic("  Machine Learning  "), "machine learning");
  });

  it("returns empty string for empty input", () => {
    assert.equal(normalizeTopic(""), "");
  });

  it("returns empty string for undefined input", () => {
    assert.equal(normalizeTopic(undefined as unknown as string), "");
  });

  it("handles all-whitespace input", () => {
    assert.equal(normalizeTopic("   "), "");
  });

  it("handles special characters", () => {
    assert.equal(normalizeTopic(" AI/ML "), "ai/ml");
  });
});

// ---------------------------------------------------------------------------
// weightedPick
// ---------------------------------------------------------------------------

describe("weightedPick", () => {
  it("returns null for empty array", () => {
    assert.equal(weightedPick([]), null);
  });

  it("returns the only item in a single-element array", () => {
    const item = { weight: 5, id: "a" };
    assert.equal(weightedPick([item]), item);
  });

  it("returns an item from a multi-element array", () => {
    const items = [
      { weight: 1, id: "a" },
      { weight: 1, id: "b" },
      { weight: 1, id: "c" },
    ];
    const result = weightedPick(items);
    assert.notEqual(result, null);
    assert.ok(items.includes(result!));
  });

  it("treats null weight as 1", () => {
    const items = [{ weight: null as unknown as number, id: "a" }];
    const result = weightedPick(items);
    assert.equal(result, items[0]);
  });

  it("treats undefined weight as 1", () => {
    const items = [{ id: "a" }] as Array<{ weight?: number; id: string }>;
    const result = weightedPick(items);
    assert.equal(result, items[0]);
  });

  it("treats zero weight as 1 (minimum clamped)", () => {
    const items = [{ weight: 0, id: "a" }];
    const result = weightedPick(items);
    assert.equal(result, items[0]);
  });

  it("treats negative weight as 1 (minimum clamped)", () => {
    const items = [{ weight: -5, id: "a" }];
    const result = weightedPick(items);
    assert.equal(result, items[0]);
  });

  it("statistically favours higher-weight items", () => {
    const heavy = { weight: 1000, id: "heavy" };
    const light = { weight: 1, id: "light" };
    const items = [heavy, light];

    let heavyCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      if (weightedPick(items) === heavy) heavyCount++;
    }

    // With weight ratio 1000:1, heavy should win overwhelming majority
    assert.ok(
      heavyCount > trials * 0.9,
      `Expected heavy to be picked >90% of the time, got ${heavyCount}/${trials}`,
    );
  });
});

// ---------------------------------------------------------------------------
// hashSecret
// ---------------------------------------------------------------------------

describe("hashSecret", () => {
  it("produces a 64-char hex string (sha256)", () => {
    const hash = hashSecret("my-secret");
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it("produces consistent output for the same input", () => {
    assert.equal(hashSecret("token-abc"), hashSecret("token-abc"));
  });

  it("produces different output for different inputs", () => {
    assert.notEqual(hashSecret("a"), hashSecret("b"));
  });

  it("handles empty string", () => {
    const hash = hashSecret("");
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it("handles undefined input (defaults to empty string)", () => {
    const hash = hashSecret(undefined as unknown as string);
    assert.equal(hash, hashSecret(""));
  });
});

// ---------------------------------------------------------------------------
// toSdkAd
// ---------------------------------------------------------------------------

describe("toSdkAd", () => {
  const fakeAd = {
    id: "ad-001",
    title: "Test Ad",
    description: "A test ad description",
    ctaText: "Click Here",
    clickUrl: "https://example.com",
    imageUrl: "https://example.com/img.png",
    advertiser: "Acme Corp",
    topics: ["tech", "gaming"],
    // Extra fields that exist on the Prisma Ad model but should not leak
    isActive: true,
    format: "card" as const,
    weight: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    dailyBudgetCents: 1000,
    lifetimeBudgetCents: 50000,
    startsAt: null,
    endsAt: null,
    organizationId: "org-1",
    campaignId: null,
  } as any;

  it("maps all required fields correctly", () => {
    const sdk = toSdkAd(fakeAd);
    assert.equal(sdk.id, "ad-001");
    assert.equal(sdk.title, "Test Ad");
    assert.equal(sdk.description, "A test ad description");
    assert.equal(sdk.ctaText, "Click Here");
    assert.equal(sdk.clickUrl, "https://example.com");
    assert.equal(sdk.imageUrl, "https://example.com/img.png");
    assert.equal(sdk.advertiser, "Acme Corp");
    assert.deepEqual(sdk.tags, ["tech", "gaming"]);
  });

  it("converts falsy imageUrl to undefined", () => {
    const adNoImage = { ...fakeAd, imageUrl: "" };
    const sdk = toSdkAd(adNoImage);
    assert.equal(sdk.imageUrl, undefined);
  });

  it("converts null imageUrl to undefined", () => {
    const adNullImage = { ...fakeAd, imageUrl: null };
    const sdk = toSdkAd(adNullImage);
    assert.equal(sdk.imageUrl, undefined);
  });

  it("maps empty topics to empty tags", () => {
    const adNoTopics = { ...fakeAd, topics: [] };
    const sdk = toSdkAd(adNoTopics);
    assert.deepEqual(sdk.tags, []);
  });

  it("does not include internal fields in output", () => {
    const sdk = toSdkAd(fakeAd);
    const keys = Object.keys(sdk);
    assert.ok(!keys.includes("isActive"), "should not expose isActive");
    assert.ok(!keys.includes("format"), "should not expose format");
    assert.ok(!keys.includes("weight"), "should not expose weight");
    assert.ok(!keys.includes("organizationId"), "should not expose organizationId");
  });
});
