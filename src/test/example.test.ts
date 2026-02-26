import { describe, it, expect } from "vitest";
import { runtimeConfig } from "@/lib/api";

describe("runtimeConfig", () => {
  it("exposes API base url string", () => {
    expect(typeof runtimeConfig.apiBaseUrl).toBe("string");
    expect(runtimeConfig.apiBaseUrl.length).toBeGreaterThan(0);
  });
});
