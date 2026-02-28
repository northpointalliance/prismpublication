import { prisma } from "./db.js";
import { logger } from "./logger.js";

// ─── Config constants ─────────────────────────────────────────────────────────

const _envPaypalClientId = process.env.PAYPAL_CLIENT_ID || "";
const _envPaypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
const _envPaypalMode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";

export const PAYPAL_CLIENT_ID_KEY = "paypal_client_id";
export const PAYPAL_CLIENT_SECRET_KEY = "paypal_client_secret";
export const PAYPAL_MODE_KEY = "paypal_mode";
export const PLATFORM_FEE_KEY = "platform_fee_pct";
export const DEFAULT_PLATFORM_FEE_PCT = 30;

// ─── Config helpers ───────────────────────────────────────────────────────────

// Reads credentials from DB first, falls back to env vars.
// This lets the admin update credentials via the console without restarting.
export const getPayPalConfig = async () => {
  const [idSetting, secretSetting, modeSetting] = await Promise.all([
    prisma.platformSettings.findUnique({ where: { key: PAYPAL_CLIENT_ID_KEY } }),
    prisma.platformSettings.findUnique({ where: { key: PAYPAL_CLIENT_SECRET_KEY } }),
    prisma.platformSettings.findUnique({ where: { key: PAYPAL_MODE_KEY } }),
  ]);
  const clientId = idSetting?.value || _envPaypalClientId;
  const clientSecret = secretSetting?.value || _envPaypalClientSecret;
  const rawMode = modeSetting?.value || _envPaypalMode;
  const mode = rawMode === "live" ? "live" : "sandbox";
  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  return {
    clientId,
    clientSecret,
    mode,
    base,
    enabled: Boolean(clientId && clientSecret),
    fromDb: Boolean(idSetting?.value || secretSetting?.value),
  };
};

export const getPlatformFeePct = async () => {
  const setting = await prisma.platformSettings.findUnique({ where: { key: PLATFORM_FEE_KEY } });
  if (!setting) return DEFAULT_PLATFORM_FEE_PCT;
  const parsed = parseFloat(setting.value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : DEFAULT_PLATFORM_FEE_PCT;
};

// ─── API helpers ──────────────────────────────────────────────────────────────

export const getPayPalToken = async (cfg) => {
  const credentials = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const res = await fetch(`${cfg.base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal token fetch failed");
  const data = await res.json();
  return data.access_token;
};

export const createPayPalOrder = async ({ amountCents, currency = "USD" }) => {
  const cfg = await getPayPalConfig();
  const token = await getPayPalToken(cfg);
  const amount = (amountCents / 100).toFixed(2);
  const res = await fetch(`${cfg.base}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: currency, value: amount } }],
    }),
  });
  if (!res.ok) throw new Error(`PayPal create order failed: ${await res.text()}`);
  return res.json();
};

export const capturePayPalOrder = async (orderId) => {
  const cfg = await getPayPalConfig();
  const token = await getPayPalToken(cfg);
  const res = await fetch(`${cfg.base}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Idempotency key: same orderID always maps to same capture attempt
      "PayPal-Request-Id": `capture-${orderId}`,
    },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${await res.text()}`);
  return res.json();
};

export const sendPayPalPayout = async ({ recipientEmail, amountCents, senderItemId, note = "" }) => {
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
      items: [
        {
          recipient_type: "EMAIL",
          amount: { value: amount, currency: "USD" },
          receiver: recipientEmail,
          sender_item_id: senderItemId,
          note: note || "Prism Ad Network publisher earnings",
        },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    logger.error("PayPal payout API error", { senderItemId, status: res.status, body: errText });
    throw new Error(`PayPal payout failed: ${errText}`);
  }
  return res.json();
};
