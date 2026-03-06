import { logger } from "./logger.js";

const MAX_CONTENT_LENGTH: number = 10 * 1024 * 1024; // 10 MB
const TIMEOUT_MS: number = 5_000;

// Private/reserved IP ranges that must never be fetched (SSRF guard)
const PRIVATE_IP_RE: RegExp =
  /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|127\.\d+\.\d+\.\d+|169\.254\.\d+\.\d+|::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|0\.0\.0\.0)/i;

/**
 * Validate that a URL points to a publicly accessible image.
 *
 * Checks performed (in order):
 *  1. URL is parseable and uses https:
 *  2. Host is not a private/loopback IP address (SSRF guard)
 *  3. HEAD request succeeds (2xx) within 5 seconds
 *  4. Content-Type response header starts with "image/"
 *  5. Content-Length (when present) is <= 10 MB
 *
 * @throws Error with a user-facing message on failure (caller should return 400)
 */
export async function validateImageUrl(url: string | null | undefined): Promise<void> {
  if (!url) return; // optional field -- skip if absent

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Image URL is not a valid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Image URL must use HTTPS.");
  }

  const hostname = parsed.hostname;
  if (PRIVATE_IP_RE.test(hostname)) {
    throw new Error("Image URL must not point to a private or internal address.");
  }

  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    const reason = error?.name === "AbortError" ? "timed out" : String(error?.message || err);
    logger.warn("image-validation HEAD request failed", { url, reason });
    throw new Error(`Image URL could not be reached: ${reason}`);
  }

  if (!res.ok) {
    throw new Error(`Image URL returned HTTP ${res.status}.`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`URL does not point to an image (Content-Type: ${contentType || "missing"}).`);
  }

  const contentLength = res.headers.get("content-length");
  if (contentLength) {
    const bytes = parseInt(contentLength, 10);
    if (!Number.isNaN(bytes) && bytes > MAX_CONTENT_LENGTH) {
      throw new Error(`Image exceeds the 10 MB size limit (${(bytes / 1024 / 1024).toFixed(1)} MB).`);
    }
  }
}
