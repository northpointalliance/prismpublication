# Prism (AIADS) — Handover

> **Single source of truth for the current system.** Last updated June 2026, after the migration of the
> entire backend onto Supabase. For deeper docs see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
> [docs/FRONTEND_DEPLOY.md](docs/FRONTEND_DEPLOY.md), and [docs/SUPABASE_CONNECTION.md](docs/SUPABASE_CONNECTION.md).

## What Prism is
An ad marketplace connecting **advertisers** (pay to run ads in AI chatbots), **publishers/bot-developers**
(show ads, earn money), and **admins** (review ads, approve payouts, configure the platform). A public
marketing site + a private 3-portal app.

## Current architecture (post-migration)
```
Browser ──► Frontend (static SPA, Vite/React)              ──► hosted on cPanel OR Vercel
                │  Supabase Auth (login)                        (VITE_API_BASE_URL baked in at build)
                ▼
        Supabase Edge Functions (Deno + Hono)
          ├── api          → all ~40 REST endpoints (/functions/v1/api/*)
          ├── queue-worker → drains pgmq queues (invoked by pg_cron each minute)
          └── query-fan-out→ AI query expansion (Lovable gateway)
                │
                ▼
        Supabase Postgres (13 tables)  ·  pgmq queues  ·  Storage (blog-images)
                │
                ▼
        External: PayPal (payments) · Upstash (optional rate-limit) · Sentry (optional)
```
**Everything runs on Supabase now.** The old self-hosted Express server (`server/`) is **retained only as
a rollback** and is no longer the source of truth. See "Legacy" below.

## Repository map
| Path | What it is | Status |
|---|---|---|
| `src/` | Frontend SPA (Vite/React) | **active** |
| `supabase/functions/api/` | Backend gateway — Hono routers per domain | **active** |
| `supabase/functions/queue-worker/` | pgmq queue drainer | **active** |
| `supabase/functions/_shared/` | db, auth, paypal, money, crypto, storage, queue, etc. | **active** |
| `supabase/functions/query-fan-out/` | AI query expansion fn | **active** |
| `server/prisma/` | DB schema + baseline migration (source of truth for schema) | **active (schema)** |
| `server/src/` | Old Express backend | **legacy — rollback only** |
| `vercel.json`, `public/.htaccess` | SPA routing for Vercel / cPanel | **active** |
| `secrets/` | Encrypted + plaintext env backups (private repo) | reference |

## Supabase project
- Ref `botnabfogcjrkpmdjgpr` · region `eu-west-2` · Postgres 17 · **paid plan**
- Dashboard: https://supabase.com/dashboard/project/botnabfogcjrkpmdjgpr
- DB connection strings + password: [docs/SUPABASE_CONNECTION.md](docs/SUPABASE_CONNECTION.md)

## Backend — operating the Edge Functions
```bash
supabase login                                   # one-time (browser)
supabase link --project-ref botnabfogcjrkpmdjgpr
supabase functions deploy api                    # deploy the API after code changes
supabase functions deploy queue-worker
supabase functions logs api                      # view logs (or the dashboard)
```
- Local typecheck before deploy: `~/.deno/bin/deno check --config supabase/functions/deno.json supabase/functions/api/index.ts`
- **Function secrets** (Dashboard → Edge Functions → Secrets, or `supabase secrets set K=V`):
  `ADMIN_API_KEY`, `PRISM_API_KEY`, `DB_URL` (pooled 6543), `API_CORS_ORIGIN`. Auto-injected by Supabase:
  `SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.
- PayPal credentials are read from the `platform_settings` table (set via Admin → Settings), not secrets.

## Database & schema changes
- Schema is Prisma-managed (`server/prisma/schema.prisma`). To change it:
  `cd server && npx prisma migrate dev --name <change>` (against a dev DB), then
  `DATABASE_URL/DIRECT_URL=<supabase> npx prisma migrate deploy`. Edge Functions use **raw SQL** (postgres.js),
  so after a schema change, update the relevant `supabase/functions/**` SQL by hand.

## Queue (replaces BullMQ/Redis)
- `pgmq` extension; queues `webhook_processing`, `payout_processing`.
- `pg_cron` job `drain-queues` runs every minute → `net.http_post` to `queue-worker` with `x-worker-secret`.
- Inspect: `SELECT * FROM cron.job;` · `SELECT * FROM pgmq.metrics('payout_processing');`

## Storage
- Public bucket `blog-images`. Admin blog uploads go here; `blog_posts.imageUrl` holds absolute Storage URLs.
  (Legacy `/uploads/blog/*` files were migrated here.)

## Security — Row-Level Security (RLS)
- **RLS is ENABLED (deny-all) on all `public` tables** — see `supabase/rls.sql`. This closes the PostgREST
  hole (the public anon key would otherwise read/write every table). The Edge Functions are unaffected
  because they connect as the table-owner `postgres` role (bypasses RLS) and Storage uses the service role.
- **Re-run `supabase/rls.sql` after any migration that adds tables** (Prisma does not manage RLS).
- Outstanding hardening: **enable "Leaked password protection"** in Dashboard → Authentication → Providers →
  Password (HaveIBeenPwned check). The `pg_net in public` advisor is benign — pg_net is non-relocatable and
  its functions live in the `net` schema; leave it.

## Frontend — deploy (cPanel or Vercel)
Full steps in [docs/FRONTEND_DEPLOY.md](docs/FRONTEND_DEPLOY.md). In short: `npm run build` → deploy `dist/`
(cPanel) or import to Vercel (`vercel.json` handles build + SPA routing). Set the four `VITE_` env vars.

## Rollback (instant)
The old Express server still runs via systemd (`prism-aiads-api` on :8080) behind the cloudflared tunnel.
- To revert the frontend to Express: remove `VITE_API_BASE_URL` from `.env`, `sudo systemctl restart prism-aiads-web`.
- Express reads the SAME Supabase DB (its `server/.env` points there), so data is consistent either way.

## ⚠️ Pending / known gaps
1. **Pick the production frontend domain**, then set the Edge Function `API_CORS_ORIGIN` secret **and** the
   Supabase Auth redirect URLs to it (else login/CORS fail). See FRONTEND_DEPLOY.md.
2. **Rotate the dev-placeholder keys** before real traffic: `ADMIN_API_KEY` and `PRISM_API_KEY` are currently
   `dev_*` values (set as function secrets + used as the queue-worker secret + pg_cron header). See `secrets/ROTATE_ME.md`.
3. **`seedWorkspaceMockData` not ported** — new advertiser/publisher workspaces start empty (no demo ads/bots).
   Existing data unaffected. Port from `server/src/seed.ts` if demo data on signup is wanted.
4. **`/sitemap.xml`** is no longer served (was Express). Add a sitemap route to `api` + a host rewrite if SEO needs it.
5. **Decommission** the systemd Express + cloudflared services once the Edge Functions are proven stable.

## Legacy (do not use for new work)
`server/src/*` (Express), `docs/LOCAL_DATABASE.md`, `docs/DEEP_DIVE.md` describe the pre-migration setup.
Kept for reference/rollback only.
