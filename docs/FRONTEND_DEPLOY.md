# Frontend deployment

**Live setup:** the frontend is a static Vite SPA hosted on **Vercel** at **https://prismpublication.com**,
auto-deployed from `github.com/northpointalliance/test1` on every push to `main`. It talks to the backend via
the absolute `VITE_API_BASE_URL` (baked in at build time), so it can be hosted anywhere.

## Required build-time env (`VITE_` vars)
Set these in **Vercel → Project → Settings → Environment Variables** (Production **and** Preview):
```
VITE_API_BASE_URL=https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api
VITE_SUPABASE_URL=https://botnabfogcjrkpmdjgpr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_3OE-gh5j9AhXsAIlNySH5A_Nqo3VRUi
VITE_SUPABASE_PROJECT_ID=botnabfogcjrkpmdjgpr
```
> ⚠️ **Vite inlines env at build time.** If these are missing/added-after-build, the app white-screens
> (`supabaseUrl is required`). After changing them, **Redeploy with build cache OFF**.

## Vercel (current/live)
1. **Add New → Project → Import** `northpointalliance/test1`; approve the Vercel GitHub app on the repo.
2. Framework **Vite**, Root Directory = repo root. `vercel.json` sets build=`npm run build`, output=`dist`,
   and the SPA rewrite (all routes → `index.html`). `.vercelignore` keeps `server/`/`supabase/` out of the build.
3. Add the env vars above → Deploy. Future pushes auto-deploy.
- **Build note:** the repo's root build runs a prebuild step for the SDK package before Vite builds, so the generated SDK dist files are created automatically in a clean Vercel environment. If the SDK package changes, test with `npm run build` from the repo root before pushing.
- **Hobby-plan gotcha:** Hobby only deploys commits authored by the account owner. This repo authors commits
  as `northpointalliance`; keep it that way or upgrade to Pro. (See [CI_CD.md](CI_CD.md).)

## cPanel (alternative static host)
1. `npm run build` locally (with the `VITE_` vars in `.env`) → `dist/` (includes `.htaccess` for SPA routing).
2. Upload the **contents of `dist/`** into `public_html/` (or the docroot). Done.

## Custom domain (prismpublication.com → Vercel)
1. Vercel → Settings → **Domains** → add `prismpublication.com` (+ `www`). Note the records it shows.
2. **Cloudflare DNS:** delete the old tunnel CNAMEs for `@`/`www`; add Vercel's records
   (`A @ 76.76.21.21`, `CNAME www cname.vercel-dns.com`); set both **DNS-only (grey cloud)** — *not* proxied,
   or Cloudflare↔Vercel SSL fights cause redirect loops.
3. Vercel auto-issues SSL once DNS resolves.

## Domain-dependent backend config (must match the live domain)
1. **CORS** — `API_CORS_ORIGIN` secret already includes `prismpublication.com`, `www`, `prismpublication.vercel.app`,
   and localhost. Add any new domain + `supabase functions deploy api`.
2. **Supabase Auth** — Dashboard → Authentication → URL Configuration → Site URL `https://prismpublication.com`
   + Redirect URLs `https://prismpublication.com/**` and `https://www.prismpublication.com/**`.
   **Login fails until this is set.**

## Notes
- **No service worker** (it caused a reload loop). If a returning visitor sees stale/looping behavior, a hard
  refresh fixes it; the shipped self-destruct SW also cleans up automatically.
- **Blog images** are on Supabase Storage (absolute URLs) — they work regardless of frontend host.
- **`/sitemap.xml`** isn't served on the static host (was Express). Add a sitemap route to `api` + a rewrite
  if SEO needs it.
