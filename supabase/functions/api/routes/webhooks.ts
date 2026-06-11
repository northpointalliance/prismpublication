import { Hono } from "hono";
import type { Ctx, Env } from "../../_shared/http.ts";
import { getPayPalConfig, getPayPalToken } from "../../_shared/paypal.ts";
import { paypalWebhookId } from "../../_shared/config.ts";
import { enqueueWebhookProcess } from "../../_shared/queue.ts";

// Mounted at /api/webhooks. Ports server/src/routes/webhooks.ts.
const webhooks = new Hono<Env>();

// deno-lint-ignore no-explicit-any
async function verifyPayPalSignature(c: Ctx, body: any): Promise<boolean> {
  const h = (k: string) => c.req.header(k) || undefined;
  const transmissionId = h("paypal-transmission-id");
  const transmissionTime = h("paypal-transmission-time");
  const certUrl = h("paypal-cert-url");
  const transmissionSig = h("paypal-transmission-sig");
  const authAlgo = h("paypal-auth-algo");

  if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !authAlgo) {
    console.warn("paypal-webhook: missing signature headers");
    return false;
  }
  if (!certUrl.startsWith("https://api.paypal.com/") && !certUrl.startsWith("https://api.sandbox.paypal.com/")) {
    console.warn("paypal-webhook: cert URL not from PayPal", { certUrl });
    return false;
  }
  if (!paypalWebhookId) {
    console.warn("paypal-webhook: PAYPAL_WEBHOOK_ID not configured — cannot verify signature");
    return false;
  }
  try {
    const cfg = await getPayPalConfig();
    const token = await getPayPalToken(cfg);
    const verifyRes = await fetch(`${cfg.base}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: paypalWebhookId,
        webhook_event: body,
      }),
    });
    if (!verifyRes.ok) {
      console.warn("paypal-webhook: verification API call failed", { status: verifyRes.status });
      return false;
    }
    const result = await verifyRes.json();
    return result.verification_status === "SUCCESS";
  } catch (err) {
    console.error("paypal-webhook: signature verification error", { err: String(err) });
    return false;
  }
}

// POST /api/webhooks/paypal
webhooks.post("/paypal", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid body" }, 400);
  }
  const valid = await verifyPayPalSignature(c, body);
  if (!valid) return c.json({ error: "Webhook signature verification failed" }, 400);

  try {
    await enqueueWebhookProcess(body as Record<string, unknown>);
  } catch (err) {
    console.error("paypal-webhook: enqueue error", { err: String(err) });
    return c.json({ error: "Webhook handler failed" }, 500); // 500 so PayPal retries
  }
  return c.json({ received: true });
});

export default webhooks;
