# Prism Publication — CLAUDE.md

Codebase context for AI assistants. Master handover doc: [HANDOVER.md](./HANDOVER.md).

---

## What this is

Prism is an ad marketplace for AI chatbots. **Advertisers** pay to run ads inside AI chat interfaces. **Publishers** (bot owners) integrate the SDK, show ads, and earn. **Admins** review ads, approve payouts, and configure the platform.

Live at **https://prismpublication.com**. No clients or revenue yet — the goal is landing the first paying customer.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite 5 + React 18 + TypeScript + Tailwind + shadcn/ui |
| Auth | Supabase Auth (email/password) |
| Backend | Deno + Hono, deployed as Supabase Edge Functions |
| Database | Supabase Postgres 17 (raw SQL via postgres.js — no ORM at runtime) |
| Schema | Prisma (`server/prisma/schema.prisma`) — schema source of truth only |
| Queue | pgmq + pg_cron (drains every minute via `queue-worker` fn) |
| Storage | Supabase Storage bucket `blog-images` |
| Payments | PayPal REST (creds in `platform_settings` table, not secrets) |
| Frontend host | Vercel (Hobby, auto-deploys from `main`) |
| Backend host | Supabase Edge Functions (project `botnabfogcjrkpmdjgpr`, region `eu-west-2`) |

---

## Repo map

```
src/                        Frontend SPA (Vite/React)  ← active
  components/portal/
    advertiser/             Advertiser portal UI
    publisher/              Publisher portal UI
    admin/                  Admin portal UI
  pages/                    Route-level page components
  components/ui/            shadcn/ui primitives

supabase/functions/
  api/                      ~40 REST endpoints (Deno + Hono)  ← active
  queue-worker/             pgmq drainer (pg_cron invoked)     ← active
  query-fan-out/            AI query expansion (Lovable gateway)
  _shared/                  db, auth, portal, sdk-auth, paypal, money, audit, ads…

server/
  prisma/schema.prisma      DB schema + migrations (source of truth)
  src/                      Old Express backend — LEGACY, not running

packages/sdk/               Publisher JS/TS SDK (src/index.ts + src/react.tsx)

docs/                       Architecture, runbook, CI/CD, integration examples
secrets/                    GPG-encrypted env backups + ROTATE_ME.md
```

---

## Routes

**Public marketing site:** `/`, `/product`, `/use-cases`, `/publishers`, `/advertisers`, `/company`, `/contact`, `/docs`, `/ad-policy`, `/blog`, `/blog/:slug`, `/demo`

**Portals (auth required):**
- `/app/login` — login page
- `/app/choose-workspace` — pick org after login
- `/app/advertiser` — advertiser portal
- `/app/publisher` — publisher portal
- `/app/admin` — admin portal

All SPA routing handled by `vercel.json` rewrites → `index.html`.

---

## API

Base URL: `https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api` (set as `VITE_API_BASE_URL` in Vercel)

Auth methods:
- **Portal users**: `Authorization: Bearer <supabase JWT>` + `x-user-email`
- **Admin**: `x-admin-key` == `ADMIN_API_KEY`
- **SDK**: `Bearer <PRISM_API_KEY>` or per-bot key + HMAC (`X-Prism-Timestamp` + `X-Prism-Signature`)

Key public endpoints: `GET /api/health`, `POST /api/ads` (SDK), `POST /api/track/:eventType` (SDK), `POST /api/leads`, `POST /api/demo/ads`

---

## Dev commands

```bash
npm run dev          # frontend only (port 5173; proxies /api → localhost:8080)
npm run build        # production build → dist/
npm run test         # vitest
npm run lint         # eslint

# Backend (Edge Functions) — deploy manually until GitHub Action token is set:
supabase functions deploy api
supabase functions deploy queue-worker

# DB schema changes:
cd server && npx prisma migrate dev --name <migration-name>
# Then update raw SQL in supabase/functions/** by hand
# Then re-run supabase/rls.sql for any new tables
```

---

## Deploy

- **Frontend**: `git push main` → Vercel auto-builds. Commits must be authored as `northpointalliance` (Hobby plan restriction). If a deploy is blocked, check `git log -1 --pretty='%an <%ae>'`.
- **Backend**: push to `main` triggers the GitHub Action only after `SUPABASE_ACCESS_TOKEN` is added as a repo secret. Until then, deploy manually with `supabase functions deploy api`.

---

## Security rules — do not break

- **RLS deny-all** is on every `public` table. The anon key cannot read/write anything. Edge Functions connect as `postgres` owner and bypass RLS intentionally.
- After any migration that adds tables, re-run `supabase/rls.sql`.
- SDK keys (`bgsk_…`) must never appear in browser bundles — server-side only.
- `API_CORS_ORIGIN` is a comma-separated allowlist set as a Supabase function secret.

---

## Database (13 tables)

`leads`, `users`, `organizations`, `organization_members`, `ads`, `ad_events`, `publisher_bots`, `bot_sdk_keys`, `wallet_transactions`, `payout_requests`, `platform_settings`, `audit_logs`, `blog_posts`

Schema in `server/prisma/schema.prisma`. Runtime queries are raw parameterized SQL in `supabase/functions/_shared/db.ts` and route files — Prisma client is **not** used at runtime.

---

## Key environment variables

**Vercel (frontend build-time):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`
- `VITE_APP_BUILD_ID` (optional)

**Supabase function secrets:**
- `ADMIN_API_KEY` — admin routes + queue-worker auth
- `PRISM_API_KEY` — master SDK key
- `DB_URL` — pooled postgres (port 6543)
- `API_CORS_ORIGIN` — allowed frontend origins

---

## Known issues / pending items

1. Supabase Auth redirect URLs need `https://prismpublication.com` added — login fails on live domain until done.
2. `SUPABASE_ACCESS_TOKEN` GitHub secret not yet added — backend auto-deploy not active.
3. Secrets in git history need rotation — see `secrets/ROTATE_ME.md`.
4. Vercel Hobby is non-commercial per ToS — should upgrade to Pro for a commercial app.
5. `server/src/` (Express) is legacy and not running — don't modify it.

---

## Writing style for Prism-facing content

- No em dashes. No buzzwords ("unlock", "synergy", "future-proof").
- Prefer "partner integrations surfaced at the right moment" over "contextual ads" in B2B outreach.
- Brand color `#6C47FF`, typography Space Grotesk/Inter.
- Light backgrounds only in any HTML/visual output.
- Every suggestion should connect back to: does this help land the first client?
