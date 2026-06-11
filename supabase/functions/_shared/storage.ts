// Supabase Storage client (service-role) for blog image uploads. Requires the `blog-images` bucket.
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, serviceRoleKey } from "./config.ts";

export const BLOG_BUCKET = "blog-images";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
