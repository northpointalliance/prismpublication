// Config for the Edge Function runtime. Mirrors server/src/config.ts but reads Deno.env.
const env = (k: string): string => Deno.env.get(k) ?? "";

// Supabase project (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected
// by the Edge runtime; the publishable key is used for token verification against /auth/v1/user).
export const supabaseUrl: string = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
export const supabasePublishableKey: string =
  env("SUPABASE_PUBLISHABLE_KEY") || env("VITE_SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_ANON_KEY");
export const serviceRoleKey: string = env("SUPABASE_SERVICE_ROLE_KEY");

// Database — prefer an explicit pooled (6543, transaction-mode) secret; fall back to the
// auto-injected SUPABASE_DB_URL (direct) for local/single use.
export const dbUrl: string = env("DB_URL") || env("DATABASE_URL") || env("SUPABASE_DB_URL");

export const sdkApiKey: string = env("PRISM_API_KEY") || env("BOTGRID_API_KEY");
export const adminApiKey: string = env("ADMIN_API_KEY");
export const corsOrigin: string = env("API_CORS_ORIGIN") || "*";
export const requireSdkHmac: boolean = env("REQUIRE_SDK_HMAC") !== "false";
export const paypalWebhookId: string = env("PAYPAL_WEBHOOK_ID");
export const allowInsecureDevAuth: boolean = env("ALLOW_INSECURE_DEV_AUTH") === "true";

// CPM rate keys in platform_settings (cents per 1000 impressions) + defaults — mirror server/src/config.ts.
export const CPM_TEXT_KEY = "cpm_text_cents";
export const CPM_CARD_KEY = "cpm_card_cents";
export const CPM_BANNER_KEY = "cpm_banner_cents";
export const DEFAULT_CPM_TEXT = 1000;
export const DEFAULT_CPM_CARD = 2000;
export const DEFAULT_CPM_BANNER = 1500;
