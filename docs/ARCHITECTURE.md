# Prism — Architecture (current)

> The system after migrating the backend onto Supabase Edge Functions. For the old self-hosted Express
> design see `docs/LOCAL_DATABASE.md` / `docs/DEEP_DIVE.md` (legacy). Master handover: `../HANDOVER.md`.

## Components
| Layer | Tech | Where |
|---|---|---|
| Frontend | Vite + React + Tailwind/shadcn, Supabase Auth | `src/`, static host (cPanel/Vercel) |
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
              ├─ baseMiddleware (request id, security headers) + CORS
              ├─ route domain (auth/me/advertiser/wallet/publisher/payouts/admin/sdk/demo/blog/leads/webhooks)
              │     ├─ auth guard (Supabase token / admin key / SDK key+HMAC)
              │     └─ postgres.js raw SQL  → Supabase Postgres
              └─ webhooks → pgmq.send → (pg_cron every min) → queue-worker → processors
```

## Auth model (`_shared/portal.ts`, `_shared/sdk-auth.ts`, `_shared/auth.ts`)
- **Portal user**: `x-user-email` + `Authorization: Bearer <supabase JWT>`; the token is verified against
  `${SUPABASE_URL}/auth/v1/user`; user/workspace/role resolved from `users`/`organization_members`/`organizations`.
- **Admin key**: `x-admin-key` == `ADMIN_API_KEY` (timing-safe).
- **SDK key**: `Bearer <master PRISM_API_KEY>` or a per-bot key (SHA-256 hash looked up in `bot_sdk_keys`),
  plus optional HMAC signature (`X-Prism-Timestamp` + `X-Prism-Signature` over the raw body).

## Endpoint map (function path = `/api/...`)
- **Public**: `GET /api/health`, `GET /api/blog`, `GET /api/blog/:slug`, `POST /api/leads`,
  `POST /api/demo/ads`, `POST /api/demo/track/:eventType`, `GET /api/wallet/paypal/config`.
- **Portal (JWT)**: `POST /api/auth/sync-user`, `/api/me/*`, `/api/advertiser/*`, `/api/wallet/*`,
  `/api/publisher/*`, `/api/payouts/*`, `/api/admin/portal/*` + platform-settings + payout-requests + blog CRUD.
- **Admin key**: `GET /api/admin/overview|ads|events|leads`, `POST/PATCH /api/admin/ads`, `GET /api/leads`.
- **SDK (key + HMAC)**: `POST /api/ads`, `POST /api/track/:eventType`.
- **Webhook**: `POST /api/webhooks/paypal` (verifies PayPal signature → enqueues).

## Data access
Prisma is NOT used at runtime (unsupported on Supabase/Deno). The functions use **postgres.js** with raw
parameterized SQL over the **6543 transaction pooler** (`prepare:false`); transactions via `sql.begin()`.
Prisma remains the **schema** source of truth (`server/prisma/schema.prisma` + `migrations/0_init`).

## Notable design choices
- **Dashboards** (advertiser, and the countable parts of publisher) use SQL `GROUP BY` aggregation to stay
  within the Edge Function 2s-CPU limit.
- **Queue** uses pgmq with visibility-timeout retries; messages archived after 5 failed attempts.
- **New row ids** are UUIDs (`crypto.randomUUID()`); pre-existing rows keep their cuid ids (ids are opaque).
- **Blog images** live in Storage; `blog_posts.imageUrl` holds absolute public URLs.

## 13 tables
`leads, users, organizations, organization_members, ads, ad_events, publisher_bots, bot_sdk_keys,
wallet_transactions, payout_requests, platform_settings, audit_logs, blog_posts` (+ `_prisma_migrations`).
