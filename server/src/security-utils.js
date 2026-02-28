import crypto from "node:crypto";

export const getBearerToken = (authorizationHeader = "") =>
  authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7).trim() : "";

export const secureEqual = (left = "", right = "") => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/**
 * Verify an HMAC-SHA256 request signature.
 *
 * The signed payload is: `<timestamp>\n<rawBody>`
 * The expected signature header format is: `sha256=<hex>`
 *
 * @param {string} rawBody    - Raw UTF-8 request body string
 * @param {string} timestamp  - Unix-seconds timestamp string from X-Prism-Timestamp
 * @param {string} signature  - Signature from X-Prism-Signature (e.g. "sha256=abc...")
 * @param {string} secret     - The raw SDK token used as HMAC secret
 */
export const verifyHmac = (rawBody = "", timestamp = "", signature = "", secret = "") => {
  if (!signature.startsWith("sha256=")) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}\n${rawBody}`)
    .digest("hex");
  return secureEqual(`sha256=${expected}`, signature);
};
