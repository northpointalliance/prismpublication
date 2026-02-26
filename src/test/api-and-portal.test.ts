import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api";
import { routeForRole } from "@/lib/portal-auth";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("routeForRole", () => {
  it("returns expected app routes", () => {
    expect(routeForRole("advertiser")).toBe("/app/advertiser");
    expect(routeForRole("publisher")).toBe("/app/publisher");
    expect(routeForRole("admin")).toBe("/app/admin");
  });
});

describe("apiRequest", () => {
  it("uses API base prefix and parses json responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const payload = await apiRequest<{ ok: boolean }>("/health");
    expect(payload.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/health", expect.any(Object));
  });

  it("throws parsed API error text for non-2xx responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "No access" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiRequest("/private")).rejects.toThrow("No access");
  });
});
