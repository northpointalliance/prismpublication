# Prism — Architecture (current, live)

> The system after migrating the backend onto Supabase Edge Functions and the frontend onto Vercel.
> Master handover: [../HANDOVER.md](../HANDOVER.md). Legacy (pre-migration) design:
> `LOCAL_DATABASE.md` / `DEEP_DIVE.md`.

## Hosting topology (live)
```
                 prismpublication.com  (DNS at Cloudflare, grey-cloud → Vercel)
                          │
            ┌─────────────▼─────────────┐
            │   Vercel (static SPA)     │   build: npm run build → dist/  (vercel.json)
            │   Git-integrated to repo  │   auto-deploys on push to main
            └─────────────┬─────────────┘
                          │  fetch  https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/*
            ┌─────────────▼─────────────┐
            │   Supabase Edge Functions │   api · queue-worker · query-fan-out
            └─────────────┬─────────────┘
                          │  postgres.js (pooled 6543)
            ┌─────────────▼─────────────┐
            │ Supabase Postgres 17      │   13 tables (RLS deny-all) · pgmq · Storage
            └───────────────────────────┘
```

## Components
| Layer | Tech | Where |
|---|---|---|
| Frontend | Vite + React + Tailwind/shadcn, Supabase Auth | `src/` → Vercel (`prismpublication.com`) |
| API | Deno + **Hono** router, **postgres.js** (raw SQL) | `supabase/functions/api/` |
| Queue worker | Deno, drains pgmq | `supabase/functions/queue-worker/` |
| AI fan-out | Deno, Lovable gateway | `supabase/functions/query-fan-out/` |
| Database | Supabase Postgres 17 (13 tables) | project `botnabfogcjrkpmdjgpr` |
| Queue | pgmq + pg_cron + pg_net | same DB |
| Storage | Supabase Storage `blog-images` (public) | same project |
| Payments | PayPal (REST) | creds in `platform_settings` table |

## Request flow
```
Browser → (Supabase Auth for login)
        → https://<ref>.supabase.co/functions/v1/api/<path>   [VITE_API_BASE_URL]
            → Hono app (verify_jwt=false; the function does its own auth)
              ├─ baseMiddleware (request id, security headers) + CORS (API_CORS_ORIGIN)
              ├─ route domain (auth/me/advertiser/wallet/publisher/payouts/admin/sdk/demo/blog/leads/webhooks)
              │     ├─ auth guard (Supabase token / admin key / SDK key+HMAC)
              │     └─ postgres.js raw SQL  → Supabase Postgres
              └─ webhooks → pgmq.send → (pg_cron every min) → queue-worker → processors
```

## Auth model (`_shared/portal.ts`, `_shared/sdk-auth.ts`, `_shared/auth.ts`)
- **Portal user**: `x-user-email` + `Authorization: Bearer <supabase JWT>`; token verified against
  `${SUPABASE_URL}/auth/v1/user`; user/workspace/role resolved from `users`/`organization_members`/`organizations`.
- **Admin key**: `x-admin-key` == `ADMIN_API_KEY` (timing-safe compare).
- **SDK key**: `Bearer <master PRISM_API_KEY>` or a per-bot key (SHA-256 hash looked up in `bot_sdk_keys`),
  plus optional HMAC signature (`X-Prism-Timestamp` + `X-Prism-Signature` over the raw body).

## Endpoint map (function path = `/api/...`)
- **Public**: `GET /api/health`, `GET /api/blog`, `GET /api/blog/:slug`, `POST /api/leads`,
  `POST /api/demo/ads`, `POST /api/demo/track/:eventType`, `GET /api/wallet/paypal/config`.
- **Portal (JWT)**: `POST /api/auth/sync-user`, `/api/me/*`, `/api/advertiser/*`, `/api/wallet/*`,
  `/api/publisher/*`, `/api/payouts/*`, `/api/admin/portal/*` + platform-settings + payout-requests + blog CRUD.
- **Admin key**: `GET /api/admin/overview|ads|events|leads`, `POST/PATCH /api/admin/ads`, `GET /api/leads`.
- **SDK (key + HMAC)**: `POST /api/ads`, `POST /api/track/:eventType`.
- **Webhook**: `POST /api/webhooks/paypal` (verifies PayPal signature → enqueues to pgmq).

## Data access
Prisma is **not** used at runtime (unsupported on Supabase/Deno). Functions use **postgres.js** with raw
parameterized SQL over the **6543 transaction pooler** (`prepare:false`); transactions via `sql.begin()`.
Prisma remains the **schema** source of truth (`server/prisma/schema.prisma` + `migrations/0_init`).

## Security posture
- **RLS deny-all** on every `public` table (`supabase/rls.sql`). PostgREST (the public anon key) is fully
  blocked; the app reaches data only through the Edge Functions, which connect as the `postgres` owner role
  and **bypass RLS**. Storage admin uploads use the service-role key. The `rls_enabled_no_policy` advisories
  are **expected** (deny-all = no policies). No `public`-table data is exposed to the anon key.
- Security headers + per-request `X-Request-Id` set by `baseMiddleware`. CORS allowlist via `API_CORS_ORIGIN`.

## Frontend specifics
- **No service worker.** A previous SW caused a production reload loop (build-id mismatch → forced reloads,
  which also spiked Edge requests). `src/main.tsx` now registers nothing and actively unregisters any old SW;
  `public/service-worker.js` is a self-destruct-only cleanup worker. Re-introduce a real PWA (vite-plugin-pwa)
  later if offline support is wanted.
- **SPA routing**: `vercel.json` rewrites all routes → `index.html` (Vercel); `public/.htaccess` does the same
  for cPanel. `.vercelignore` (root-anchored patterns) keeps `server/`/`supabase/` out of the Vercel build.
- **Blog images** live in Storage; `blog_posts.imageUrl` holds absolute public URLs (work from any host).

## Notable design choices
- **Dashboards** (advertiser; countable parts of publisher) use SQL `GROUP BY` aggregation to stay within the
  Edge Function 2s-CPU limit.
- **Queue** uses pgmq with visibility-timeout retries; messages archived after 5 failed attempts.
- **New row ids** are UUIDs (`crypto.randomUUID()`); pre-existing rows keep their cuid ids (ids are opaque).

## 13 tables
`leads, users, organizations, organization_members, ads, ad_events, publisher_bots, bot_sdk_keys,
wallet_transactions, payout_requests, platform_settings, audit_logs, blog_posts` (+ `_prisma_migrations`).
