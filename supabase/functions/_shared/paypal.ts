// Port of server/src/paypal.ts. fetch-based (Deno-portable); Buffer->btoa; config from SQL.
import { sql } from "./db.ts";

const env = (k: string) => Deno.env.get(k) ?? "";
const _envPaypalClientId = env("PAYPAL_CLIENT_ID");
const _envPaypalClientSecret = env("PAYPAL_CLIENT_SECRET");
const _envPaypalMode: "live" | "sandbox" = env("PAYPAL_MODE") === "live" ? "live" : "sandbox";

export const PAYPAL_CLIENT_ID_KEY = "paypal_client_id";
export const PAYPAL_CLIENT_SECRET_KEY = "paypal_client_secret";
export const PAYPAL_MODE_KEY = "paypal_mode";
export const PLATFORM_FEE_KEY = "platform_fee_pct";
export const DEFAULT_PLATFORM_FEE_PCT = 30;

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: "live" | "sandbox";
  base: string;
  enabled: boolean;
  fromDb: boolean;
}

export const getPayPalConfig = async (): Promise<PayPalConfig> => {
  const rows = await sql`
    SELECT "key", "value" FROM platform_settings
    WHERE "key" IN (${PAYPAL_CLIENT_ID_KEY}, ${PAYPAL_CLIENT_SECRET_KEY}, ${PAYPAL_MODE_KEY})`;
  const byKey = new Map<string, string>(rows.map((r) => [r.key, r.value]));
  const clientId = byKey.get(PAYPAL_CLIENT_ID_KEY) || _envPaypalClientId;
  const clientSecret = byKey.get(PAYPAL_CLIENT_SECRET_KEY) || _envPaypalClientSecret;
  const rawMode = byKey.get(PAYPAL_MODE_KEY) || _envPaypalMode;
  const mode: "live" | "sandbox" = rawMode === "live" ? "live" : "sandbox";
  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  return {
    clientId,
    clientSecret,
    mode,
    base,
    enabled: Boolean(clientId && clientSecret),
    fromDb: Boolean(byKey.get(PAYPAL_CLIENT_ID_KEY) || byKey.get(PAYPAL_CLIENT_SECRET_KEY)),
  };
};

export const getPlatformFeePct = async (): Promise<number> => {
  const rows = await sql`SELECT "value" FROM platform_settings WHERE "key" = ${PLATFORM_FEE_KEY} LIMIT 1`;
  if (!rows.length) return DEFAULT_PLATFORM_FEE_PCT;
  const parsed = parseFloat(rows[0].value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : DEFAULT_PLATFORM_FEE_PCT;
};

export const getPayPalToken = async (cfg: PayPalConfig): Promise<string> => {
  const credentials = btoa(`${cfg.clientId}:${cfg.clientSecret}`);
  const res = await fetch(`${cfg.base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal token fetch failed");
  const data = await res.json();
  return data.access_token;
};

export const createPayPalOrder = async ({ amountCents, currency = "USD" }: { amountCents: number; currency?: string }) => {
  const cfg = await getPayPalConfig();
  const token = await getPayPalToken(cfg);
  const amount = (amountCents / 100).toFixed(2);
  const res = await fetch(`${cfg.base}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ amount: { currency_code: currency, value: amount } }] }),
  });
  if (!res.ok) throw new Error(`PayPal create order failed: ${await res.text()}`);
  return res.json();
};

export const capturePayPalOrder = async (orderId: string) => {
  const cfg = await getPayPalConfig();
  const token = await getPayPalToken(cfg);
  const res = await fetch(`${cfg.base}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `capture-${orderId}`,
    },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${await res.text()}`);
  return res.json();
};

export const sendPayPalPayout = async ({
  recipientEmail, amountCents, senderItemId, note = "",
}: { recipientEmail: string; amountCents: number; senderItemId: string; note?: string }) => {
  const cfg = await getPayPalConfig();
  const token = await getPayPalToken(cfg);
  const amount = (amountCents / 100).toFixed(2);
  const res = await fetch(`${cfg.base}/v1/payments/payouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: senderItemId,
        email_subject: "You have a payout from Prism",
        email_message: note || "Your publisher earnings have been transferred to your PayPal account.",
      },
      items: [{
        recipient_type: "EMAIL",
        amount: { value: amount, currency: "USD" },
        receiver: recipientEmail,
        sender_item_id: senderItemId,
        note: note || "Prism Ad Network publisher earnings",
      }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("PayPal payout API error", { senderItemId, status: res.status, body: errText });
    throw new Error(`PayPal payout failed: ${errText}`);
  }
  return res.json();
};
