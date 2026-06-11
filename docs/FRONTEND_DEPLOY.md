# Frontend deployment (cPanel or Vercel)

The backend is fully on Supabase Edge Functions, so the frontend is a **static SPA** that can be hosted
anywhere. It talks to the API via the absolute `VITE_API_BASE_URL` (baked in at build time).

## Required env (build-time, `VITE_` vars)
```
VITE_API_BASE_URL=https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api
VITE_SUPABASE_URL=https://botnabfogcjrkpmdjgpr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_3OE-gh5j9AhXsAIlNySH5A_Nqo3VRUi
VITE_SUPABASE_PROJECT_ID=botnabfogcjrkpmdjgpr
```

## Option A — cPanel (static upload)
1. Build locally: `npm run build` → produces `dist/` (includes `.htaccess` for SPA routing).
2. Upload the **contents of `dist/`** into `public_html/` (or the domain's docroot).
3. `.htaccess` rewrites deep links to `index.html`. Done.

## Option B — Vercel
1. Import the repo. Vercel auto-detects Vite; `vercel.json` sets build = `npm run build`, output = `dist`,
   and the SPA rewrite (all routes → `index.html`).
2. Add the four `VITE_` env vars above in Vercel → Project → Settings → Environment Variables.
3. Deploy.

## ⚠️ Domain-dependent settings (do these once you pick the final domain)
Whatever domain serves the frontend, two places must allow it:
1. **Edge Function CORS** — the `API_CORS_ORIGIN` function secret must list the frontend origin(s):
   `supabase secrets set API_CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"`
   (currently: prismpublication.com, www, localhost:5173, localhost:8080)
2. **Supabase Auth redirect URLs** — Dashboard → Authentication → URL Configuration → set **Site URL** and
   add the domain to **Redirect URLs**, or login + password-reset redirects will fail.

## Notes
- **Blog images** were migrated from the old `/uploads/blog/...` paths to Supabase Storage
  (`blog-images` bucket); `blog_posts.imageUrl` now holds absolute Storage URLs that work from any host.
- **`/sitemap.xml`** was previously served by Express. On a static host it is not generated — if SEO needs
  it, add a sitemap route to the `api` Edge Function and rewrite `/sitemap.xml` to it (follow-up).
