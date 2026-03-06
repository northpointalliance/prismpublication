export const port: number = Number(process.env.PORT || 8787);
export const isProduction: boolean = process.env.NODE_ENV === "production";
export const allowInsecureDevAuth: boolean = process.env.ALLOW_INSECURE_DEV_AUTH === "true";
export const supabaseUrl: string =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || "";
export const supabasePublishableKey: string =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const sdkApiKey: string = process.env.PRISM_API_KEY || process.env.BOTGRID_API_KEY || "";
export const adminApiKey: string = process.env.ADMIN_API_KEY || "";
export const corsOrigin: string = process.env.API_CORS_ORIGIN || "http://localhost:8080";
// When true, every SDK request must include X-Prism-Timestamp + X-Prism-Signature headers.
export const requireSdkHmac: boolean = process.env.REQUIRE_SDK_HMAC !== "false";
// PayPal webhook ID from developer.paypal.com -> Apps -> Webhooks (required for signature verification).
export const paypalWebhookId: string = process.env.PAYPAL_WEBHOOK_ID || "";

// CPM rate keys in PlatformSettings (cents per 1000 impressions).
export const CPM_TEXT_KEY: string   = "cpm_text_cents";
export const CPM_CARD_KEY: string   = "cpm_card_cents";
export const CPM_BANNER_KEY: string = "cpm_banner_cents";
// Defaults: $10/$20/$15 CPM — results in 1c/2c/2c per impression respectively.
export const DEFAULT_CPM_TEXT: number   = 1000;
export const DEFAULT_CPM_CARD: number   = 2000;
export const DEFAULT_CPM_BANNER: number = 1500;
