export const port = Number(process.env.PORT || 8787);
export const isProduction = process.env.NODE_ENV === "production";
export const allowInsecureDevAuth = process.env.ALLOW_INSECURE_DEV_AUTH === "true";
export const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || "";
export const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const sdkApiKey = process.env.PRISM_API_KEY || process.env.BOTGRID_API_KEY || "";
export const adminApiKey = process.env.ADMIN_API_KEY || "";
export const corsOrigin = process.env.API_CORS_ORIGIN || "http://localhost:8080";
// When true, every SDK request must include X-Prism-Timestamp + X-Prism-Signature headers.
export const requireSdkHmac = process.env.REQUIRE_SDK_HMAC !== "false";
// PayPal webhook ID from developer.paypal.com → Apps → Webhooks (required for signature verification).
export const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID || "";

// CPM rate keys in PlatformSettings (cents per 1000 impressions).
export const CPM_TEXT_KEY   = "cpm_text_cents";
export const CPM_CARD_KEY   = "cpm_card_cents";
export const CPM_BANNER_KEY = "cpm_banner_cents";
// Defaults: $10/$20/$15 CPM — results in 1¢/2¢/2¢ per impression respectively.
export const DEFAULT_CPM_TEXT   = 1000;
export const DEFAULT_CPM_CARD   = 2000;
export const DEFAULT_CPM_BANNER = 1500;
