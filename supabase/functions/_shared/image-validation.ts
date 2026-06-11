// Verbatim port of server/src/image-validation.ts (logger -> console). SSRF guard + HTTPS + size.
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024; // 10 MB
const TIMEOUT_MS = 5_000;

const PRIVATE_IP_RE =
  /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|127\.\d+\.\d+\.\d+|169\.254\.\d+\.\d+|::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|0\.0\.0\.0)/i;

export async function validateImageUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Image URL is not a valid URL.");
  }

  if (parsed.protocol !== "https:") throw new Error("Image URL must use HTTPS.");
  if (PRIVATE_IP_RE.test(parsed.hostname)) {
    throw new Error("Image URL must not point to a private or internal address.");
  }

  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
  } catch (err) {
    const error = err as { name?: string; message?: string };
    const reason = error?.name === "AbortError" ? "timed out" : String(error?.message || err);
    console.warn("image-validation HEAD request failed", { url, reason });
    throw new Error(`Image URL could not be reached: ${reason}`);
  }

  if (!res.ok) throw new Error(`Image URL returned HTTP ${res.status}.`);

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
