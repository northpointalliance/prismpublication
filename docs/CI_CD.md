# CI/CD — one push deploys frontend (Vercel) + backend (Supabase)

`git push` to `main` on `github.com/northpointalliance/test1` →
```
git push (main)
   ├── Vercel Git integration      → builds npm run build, deploys dist/      (frontend)  ✅ live
   └── GitHub Action (this repo)   → supabase functions deploy (+ db push)    (backend)   ⏳ needs token secret
```

## Recent deployment issue (2026-07-05)
- **What failed:** Vercel builds were failing after pushes to main because the frontend build expects the SDK bundle under the generated dist folder, but a fresh deployment environment was not building that package first.
- **Root cause:** the build pipeline relied on the SDK dist output already being present, which worked only when a previous local build had left it on disk. The clean Vercel environment had no such artifacts.
- **Fix:** the root build now runs a prebuild step for the SDK before Vite builds, and the SDK build script was made more robust for deployment environments. Re-run the build locally with `npm run build` before pushing if you change the SDK package.

## A. Frontend → Vercel  ✅ connected & live
The repo is imported into the client's Vercel (Hobby) and serves `prismpublication.com`. Pushes auto-deploy.
Setup reference (already done): [FRONTEND_DEPLOY.md](FRONTEND_DEPLOY.md).

**Two things that bit us — keep them in mind:**
1. **Commit author must be the Vercel account owner.** Hobby only deploys commits authored by the owner and
   can't add team members. This repo's git is set to author as
   `northpointalliance <20086637+northpointalliance@users.noreply.github.com>`. If a deploy is "blocked —
   commit author did not have contributing access," re-author the latest commit as him (or upgrade to Pro).
   Check: `git log -1 --pretty='%an <%ae>'`.
2. **`VITE_*` env vars must exist in Vercel before the build** (Vite inlines them). Missing → white screen.
   Change them → **Redeploy with build cache off**.

> ⚠️ Hobby is **non-commercial** per Vercel ToS. For a commercial app, **Pro** ($20/mo) is the right plan and
> re-enables team members (so no commit-author gymnastics, no using his login).

## B. Backend → Supabase  ⏳ activate by adding one secret
`.github/workflows/supabase-deploy.yml` deploys Edge Functions on push to `main` (paths `supabase/**` or
`server/prisma/migrations/**`), and runs `db push` if a DB-password secret is present.

**Add these GitHub repo secrets** (repo → Settings → Secrets and variables → Actions):
| Secret | Value | Enables |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens → generate | functions deploy (**required**) |
| `SUPABASE_DB_PASSWORD` | the DB password | `db push` migrations (optional) |

Project ref is hard-coded in the workflow (`SUPABASE_PROJECT_REF=botnabfogcjrkpmdjgpr`). Until the token
secret is added, the Action runs but fails at the deploy step — deploy the backend manually meanwhile
(`supabase functions deploy api`). After any migration that adds tables, re-run `supabase/rls.sql`.

## C. What is independent
- **Vercel (frontend) and Supabase (backend) are separate accounts/integrations.** Connecting the client's
  Vercel did **not** move the Supabase project — it stays under its current Supabase account. Transfer Supabase
  separately if/when desired.
- Vercel builds **only** the frontend (`.vercelignore` excludes `server/`, `supabase/`, infra dirs).

## Quick verification
- Frontend: push a trivial change → Vercel shows a new deployment → `https://prismpublication.com` updates.
- Backend (after token secret): edit a file under `supabase/functions/**` → push → Action deploys → check
  `https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/health`.
