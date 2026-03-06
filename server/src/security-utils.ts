import crypto from "node:crypto";

export const getBearerToken = (authorizationHeader: string = ""): string =>
  authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7).trim() : "";

export const secureEqual = (left: string = "", right: string = ""): boolean => {
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
 * @param rawBody    - Raw UTF-8 request body string
 * @param timestamp  - Unix-seconds timestamp string from X-Prism-Timestamp
 * @param signature  - Signature from X-Prism-Signature (e.g. "sha256=abc...")
 * @param secret     - The raw SDK token used as HMAC secret
 */
export const verifyHmac = (
  rawBody: string = "",
  timestamp: string = "",
  signature: string = "",
  secret: string = "",
): boolean => {
  if (!signature.startsWith("sha256=")) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}\n${rawBody}`)
    .digest("hex");
  return secureEqual(`sha256=${expected}`, signature);
};
