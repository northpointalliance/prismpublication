# CI/CD — one push deploys frontend (Vercel) + backend (Supabase)

Goal: `git push` to `main` → **Vercel** rebuilds the frontend **and** a **GitHub Action** deploys the
Supabase Edge Functions. No manual CLI deploys, no login juggling.

```
git push (main)
   ├── Vercel Git integration      → builds `npm run build`, deploys dist/   (frontend)
   └── GitHub Action (this repo)   → supabase functions deploy (+ db push)   (backend)
```

## A. Frontend → Vercel (one-time, in the client's Vercel account)
The client is on **Hobby** (no team members), so do this once in his account (browser; Vercel login is
passwordless — magic link / GitHub OAuth, no password shared). After this it's automatic.

1. Vercel → **Add New → Project → Import** `github.com/northpointalliance/test1`.
   - Approve installing the **Vercel GitHub app** on that repo/org (grants Vercel access).
2. Framework **Vite**, Root Directory = repo root (`vercel.json` sets build=`npm run build`, output=`dist`).
3. **Environment Variables** (Production):
   ```
   VITE_API_BASE_URL=https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api
   VITE_SUPABASE_URL=https://botnabfogcjrkpmdjgpr.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_3OE-gh5j9AhXsAIlNySH5A_Nqo3VRUi
   VITE_SUPABASE_PROJECT_ID=botnabfogcjrkpmdjgpr
   ```
4. Deploy. Future pushes auto-deploy.

> ⚠️ Hobby is **non-commercial** per Vercel ToS. This is a commercial app — consider **Pro** ($20/mo),
> which also re-enables adding team members (so you wouldn't need his login at all).

## B. Backend → Supabase (GitHub Action — already in this repo)
`.github/workflows/supabase-deploy.yml` deploys Edge Functions on push (and migrations if enabled).

**Repo secrets** (GitHub → repo `northpointalliance/test1` → Settings → Secrets and variables → Actions):
| Secret | Value | Needed for |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens → generate | functions deploy (required) |
| `SUPABASE_DB_PASSWORD` | the project DB password | `db push` migrations (optional) |

Project ref is hard-coded in the workflow (`botnabfogcjrkpmdjgpr`). To deploy to a different Supabase
project later, change `SUPABASE_PROJECT_REF` there.

> After any migration that adds tables, re-run `supabase/rls.sql` (RLS is not managed by Prisma).

## C. Domain-dependent config (do once the production domain is set)
Whatever domain the Vercel deployment serves (a `*.vercel.app` URL or a custom domain):
1. **CORS:** `supabase secrets set API_CORS_ORIGIN="https://<that-domain>"` (comma-separate multiple).
2. **Supabase Auth:** Dashboard → Authentication → URL Configuration → set Site URL + add the domain to
   Redirect URLs (else login / password-reset redirects fail).

## Notes
- Vercel builds only the frontend (`.vercelignore` excludes `server/`, `supabase/`, infra dirs).
- The Supabase project and the Vercel account are **independent** — connecting the client's Vercel does not
  move the Supabase project. Transfer Supabase separately if/when desired.
