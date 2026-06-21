-- Create the public `ad-images` Storage bucket used for advertiser ad creatives.
--
-- WHY: the advertiser campaign wizard uploads an image via POST /api/advertiser/campaigns/image,
-- which stores it here (service-role key) and returns a public URL saved as ads."imageUrl".
-- The SDK serves that URL to publishers, so the bucket must be PUBLIC (read-only to anon).
--
-- Run once against the Supabase project (SQL editor or `supabase db execute`). Idempotent.
-- Alternatively create it in Dashboard → Storage → New bucket → name "ad-images", Public = on.

INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-images', 'ad-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
