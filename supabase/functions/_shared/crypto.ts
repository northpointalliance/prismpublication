// Web Crypto port of server/src/security-utils.ts (+ helpers.ts crypto). No node:crypto.
const enc = new TextEncoder();

export const getBearerToken = (authorizationHeader = ""): string =>
  authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7).trim() : "";

// Constant-time string compare.
export const secureEqual = (left = "", right = ""): boolean => {
  const a = enc.encode(String(left));
  const b = enc.encode(String(right));
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};

const toHex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

// SHA-256 hex digest (mirrors helpers.ts hashSecret).
export const hashSecret = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return toHex(digest);
};

// Verify HMAC-SHA256 over `<timestamp>\n<rawBody>`; signature header is `sha256=<hex>`.
export const verifyHmac = async (
  rawBody = "",
  timestamp = "",
  signature = "",
  secret = "",
): Promise<boolean> => {
  if (!signature.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}\n${rawBody}`));
  return secureEqual(`sha256=${toHex(mac)}`, signature);
};

// SDK token: "bgsk_" + 20 random bytes hex (mirrors helpers.ts createSdkToken).
export const createSdkToken = (): string => {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return "bgsk_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Public bot id: orgbot_<orgId>_<slug>_<3 random bytes hex> (mirrors helpers.ts createBotPublicId).
export const createBotPublicId = ({ organizationId, name }: { organizationId: string; name: string }): string => {
  const baseSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `orgbot_${organizationId}_${baseSlug || "bot"}_${suffix}`;
};
