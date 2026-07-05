# Prism (AIADS) — Handover

> **Single source of truth for the live system.** Last updated June 2026.
> Companion docs: [RUNBOOK](docs/RUNBOOK.md) (operations/troubleshooting) ·
> [ARCHITECTURE](docs/ARCHITECTURE.md) · [FRONTEND_DEPLOY](docs/FRONTEND_DEPLOY.md) ·
> [CI_CD](docs/CI_CD.md) · [SUPABASE_CONNECTION](docs/SUPABASE_CONNECTION.md).

## Status: LIVE ✅
- **Frontend:** Vercel → **https://prismpublication.com** (custom domain; DNS moved off the old Cloudflare tunnel).
- **Backend:** Supabase Edge Functions (`api` v-current, `queue-worker`) — all ~40 endpoints.
- **Database/Queue/Storage/Auth:** Supabase.
- The old self-hosted stack (Express + Vite + cloudflared tunnel on this machine) is **decommissioned** —
  services stopped + disabled, boot watchdog removed. It no longer serves anything.

## At a glance
| Thing | Value |
|---|---|
| Live site | https://prismpublication.com (also `prismpublication.vercel.app`) |
| Repo (canonical) | `github.com/northpointalliance/prismpublication` — commits authored as `northpointalliance` |
| Frontend host | Vercel (client's account, **Hobby** plan) |
| Supabase project | `botnabfogcjrkpmdjgpr` · region `eu-west-2` · Postgres 17 · paid plan |
| Supabase dashboard | https://supabase.com/dashboard/project/botnabfogcjrkpmdjgpr |
| API base (frontend → backend) | `https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api` |
| DB credentials | [docs/SUPABASE_CONNECTION.md](docs/SUPABASE_CONNECTION.md) |

## What Prism is
An ad marketplace: **advertisers** pay to run ads in AI chatbots, **publishers/bot-developers** show ads
and earn, **admins** review ads + approve payouts + configure the platform. Public marketing site + a
private app with three portals (`/app/advertiser`, `/app/publisher`, `/app/admin`).

## Architecture (live)
```
Browser
  │  Supabase Auth (login)
  ▼
Frontend SPA (Vite/React)  ── Vercel ──  https://prismpublication.com
  │   fetch  VITE_API_BASE_URL = …supabase.co/functions/v1/api
  ▼
Supabase Edge Functions (Deno + Hono + postgres.js)
  ├── api           → ~40 REST endpoints (verify_jwt=false; functions do their own auth)
  ├── queue-worker  → drains pgmq (invoked by pg_cron every minute)
  └── query-fan-out → AI query expansion (Lovable gateway)
  ▼
Supabase Postgres 17 (13 tables, RLS deny-all)  ·  pgmq queues  ·  Storage (blog-images)
  ▼
External: PayPal (payments, creds in platform_settings) · Upstash (optional rate-limit) · Sentry (optional)
```
Deep dive: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Demo infrastructure

Two separate demo surfaces exist. Both pull live ads from the same `ads` table via the public demo endpoint — no auth required.

### 1. Main site demo (`prismpublication.com/demo`)
`src/pages/Demo.tsx` — scripted playback conversation (sneakers/dinner/flowers scenario). Each ad slot calls:
```
POST https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/demo/ads
Body: { format: "card", context: { topic: "lifestyle" } }
```
Falls back to hardcoded fake ads (sneakers, sushi, flowers) if the API is unreachable or returns nothing. Includes an affiliate disclosure chip and footer text (Dan is an Amazon affiliate; real ads may earn commissions).

### 2. 3-bot demo site (`prism-publication-demo.vercel.app`)
Separate Next.js repo: `github.com/northpointalliance/prism-demo`
Local path: `C:\Users\dan72\Desktop\Prismpublication June 2026\prism-demos\prism-demo\`

Three bots:
| Route | Bot | Niche |
|---|---|---|
| `/health-fitness` | FitTrack | Fitness & nutrition |
| `/wellness` | Calmly | Mental wellness |
| `/persona-app` | Confidant | Social confidence |

Each user message triggers `POST /api/ad/[niche]` (a Next.js API route in the demo repo), which calls `/api/demo/ads` passing the user's message text as the topic. Clicks tracked via `POST /api/click/[niche]` → `/api/demo/track/click`.

Key files in the demo repo:
- `lib/DemoChat.js` — chat UI component; renders `ad.title`, `ad.description`, `ad.ctaText`, `ad.clickUrl`
- `pages/api/ad/[niche].js` — calls `/api/demo/ads`, returns `{ ad }` to the frontend
- `pages/api/click/[niche].js` — calls `/api/demo/track/click`

### Demo endpoint (backend)
`supabase/functions/api` handles both demo routes — no auth needed:
- `POST /api/demo/ads` — runs `selectAdForRequest` in `_shared/ads.ts`; topic-matches against `ad.topics` tags, falls back to weighted-random
- `POST /api/demo/track/click` — records to `ad_events` with `botId = 'demo-public'`

**Ad visibility requirements:** `isActive = true` and `deletedAt IS NULL` on the row in `ads`. If the demo shows no ads, check these fields first. Also check that `ad.topics` contains tags that match the user's message — generic tags produce random fallback picks, not contextual ones.

## Repository map
| Path | What it is | Status |
|---|---|---|
| `src/` | Frontend SPA (Vite/React) | **active** |
| `supabase/functions/api/` | Backend gateway — Hono routers per domain | **active** |
| `supabase/functions/queue-worker/` | pgmq queue drainer (pg_cron-invoked) | **active** |
| `supabase/functions/_shared/` | db, portal/auth, sdk-auth, paypal, money, crypto, storage, queue, audit, ads… | **active** |
| `supabase/functions/query-fan-out/` | AI query expansion fn | **active** |
| `supabase/rls.sql` | RLS enablement (re-run after migrations add tables) | **active** |
| `server/prisma/` | DB schema + baseline migration — **schema source of truth** | **active (schema only)** |
| `server/src/` | Old Express backend | **legacy — not running** |
| `vercel.json` · `.vercelignore` · `public/.htaccess` | Vercel/cPanel build + SPA routing | **active** |
| `.github/workflows/supabase-deploy.yml` | Backend auto-deploy Action | **active (needs token secret)** |
| `secrets/` | gpg-encrypted env backups + rotation checklist | reference |

## Deploys (CI/CD) — one push does both
`git push` to `main` →
- **Vercel** (Git integration) auto-builds + deploys the **frontend**.
- **GitHub Action** (`supabase-deploy.yml`) deploys the **Supabase functions** — **active once the
  `SUPABASE_ACCESS_TOKEN` repo secret is added** (see Pending). Until then, deploy the backend manually:
  ```bash
  supabase functions deploy api          # after editing supabase/functions/**
  supabase functions deploy queue-worker
  ```
- ⚠️ **Vercel Hobby only deploys commits authored by the account owner.** This repo's git is set to author
  as `northpointalliance` (his GitHub no-reply email). If you commit as someone else, Hobby will reject the
  deploy — re-author or upgrade to Pro. Details: [docs/CI_CD.md](docs/CI_CD.md).

Full backend ops (secrets, logs, typecheck): [docs/RUNBOOK.md](docs/RUNBOOK.md).

## Function secrets (Supabase → Edge Functions → Secrets)
Custom: `ADMIN_API_KEY`, `PRISM_API_KEY`, `DB_URL` (pooled 6543), `API_CORS_ORIGIN`, `REQUIRE_SDK_HMAC`.
Auto-injected by Supabase: `SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.
PayPal creds are read from the `platform_settings` table (Admin → Settings), not secrets.

**`REQUIRE_SDK_HMAC` — set to `false` (June 2026)**
Controls whether `POST /api/ads` and `POST /api/track/:eventType` enforce HMAC-SHA256 request signing.
Default behaviour (when absent or any value other than `"false"`) is to **require** the `X-Prism-Timestamp` and `X-Prism-Signature` headers. Set to `"false"` to allow calls with a Bearer SDK key only — no signature headers needed. This is required for Google Ad Manager custom creatives, which run in a sandboxed iframe and cannot compute HMAC signatures. Re-enable by setting to `"true"` or deleting the secret — but note this will break any GAM creatives that don't send signature headers.

## Database & schema changes
Schema is Prisma-managed (`server/prisma/schema.prisma`). To change it:
`cd server && npx prisma migrate dev --name <x>` (dev DB) → `prisma migrate deploy` against Supabase.
The Edge Functions use **raw SQL** (postgres.js), so after a schema change update the relevant
`supabase/functions/**` SQL by hand, and **re-run `supabase/rls.sql`** for any new tables.

## Queue & Storage
- **Queue:** `pgmq` (`webhook_processing`, `payout_processing`) + `pg_cron` job `drain-queues` (every minute
  → `net.http_post` to `queue-worker`, guarded by `x-worker-secret` = `ADMIN_API_KEY`).
- **Storage:** public bucket `blog-images`; `blog_posts.imageUrl` holds absolute Storage URLs (legacy
  `/uploads/blog/*` were migrated there).

## Security
- **RLS deny-all on all `public` tables** (`supabase/rls.sql`) — closes the PostgREST hole; the public anon
  key cannot read/write tables. Edge Functions are unaffected (they connect as the `postgres` owner, which
  bypasses RLS). The `rls_enabled_no_policy` **INFO** advisories are the *intended* result — leave them.
- **Re-run `supabase/rls.sql` after any migration that adds tables.**
- **Outstanding:** enable **"Leaked password protection"** (Dashboard → Authentication → Attack Protection).
  The `pg_net in public` advisor is **benign** (non-relocatable; functions live in the `net` schema) — leave it.
- Plaintext secrets were removed from the repo; rotation of the exposed values is **pending** (see below).

## Rollback
The old local stack is **decommissioned**, so rollback is **no longer instant**. To revert the public site
off Vercel you would: re-point `prismpublication.com` DNS back to the Cloudflare tunnel **and** re-enable the
systemd services (`sudo systemctl enable --now prism-aiads-{api,web,tunnel}`). Both Express and the Edge
Functions read the **same Supabase DB**, so data stays consistent either way. For routine frontend rollback,
use **Vercel → Deployments → Promote** a previous good deployment.

## ⚠️ Pending / to finish

_Timestamped per entry going forward — add `(as of YYYY-MM-DD HH:MM TZ)` when you touch this list._

### Infrastructure
1. **Supabase Auth redirect URLs** — add `https://prismpublication.com` (Site URL) + `https://prismpublication.com/**` and `https://www.prismpublication.com/**` (Redirect URLs). **Login fails on the live domain until this is set.**
2. **`SUPABASE_ACCESS_TOKEN` GitHub repo secret** — add it to activate backend auto-deploy (frontend already auto-deploys). Until then, deploy backend manually: `supabase functions deploy api`.
3. **Rotate secrets** that exist in git history — DB password + dev `ADMIN_API_KEY`/`PRISM_API_KEY`. See `secrets/ROTATE_ME.md`.
4. **Enable leaked-password protection** — one dashboard toggle (Authentication → Attack Protection).
5. **Vercel Hobby is non-commercial** per ToS — upgrade to Pro for a commercial app (also re-enables team member deploys).
6. **`/sitemap.xml`** isn't served (was Express). Add a sitemap route to `api` if SEO matters.
7. **Local Docker Postgres** (`aiads-postgres`) still runs as the pre-migration data snapshot; stop/remove when no longer needed.
8. **GitHub has 81 dependency vulnerabilities** (1 critical, 38 high) flagged by Dependabot — address when time permits.
9. **Publisher/advertiser signup was throwing "Error sending confirmation email"** — root cause was an unverified Resend domain (`prismpublication.com`), fixed and now verified. Admin new-signup alerts run through a pre-existing trigger (`on_publisher_signup` on `public.organizations`, not the `notify-signup` Edge Function in this repo) — its hardcoded Resend API key has been moved into Supabase Vault. Confirmed working via a live test send (2026-07-03). **Still needs a real signup/password-reset test from the actual login page** to confirm Supabase Auth's own SMTP is fixed post-verification — see `docs/SESSION-2026-07-03-signup-email-debug.md`.
10. **Rotate the Resend API key** that was found hardcoded in plaintext in the `notify_publisher_signup` SQL function (now moved to Vault, but the key itself was exposed for an unknown period — rotate it in the Resend dashboard as a precaution).
11. _(as of 2026-07-03 19:10 IDT)_ **SDK was never actually publishable — real onboarding was broken for any third-party developer.** `@prism/sdk` had never been published to npm (confirmed 404 on registry); renamed in code to `@prismpublication/sdk` to match the npm org Dan created. Also fixed a placeholder API domain (`api.prism.so`, doesn't resolve) in the SDK Docs tab and `docs/FREQUENCY_CAPPING.md`. **npm publish is mid-flight**: hit a PowerShell script-execution block (worked around via cmd.exe), then npm's 2FA-required-to-publish policy (now enabled), then a burned `1.0.0` version tag from an inconclusive first attempt — bumped to `1.0.1`, not yet confirmed live on the registry.
12. _(as of 2026-07-03 19:10 IDT)_ **Tonight's code changes are not yet in git.** A stale `.git/index.lock` blocks all commits — `rm`/`del` both failed with permission errors on both the Cowork sandbox and Dan's own Windows machine. Likely cause: a sync client (OneDrive/Dropbox) or antivirus holding the file open, or a stray git/VS Code process — check Task Manager, or restart the machine if needed, then re-run the commit. Until resolved, the SDK rename, docs fixes, and this file's own edits exist only on disk, not on GitHub/Vercel.
13. _(as of 2026-07-03 19:10 IDT)_ **Known, unfixed product bugs found during a real onboarding attempt:** (a) duplicate-workspace-creation bug — the Create Workspace flow let the same user end up with two identical publisher workspaces (confirmed via direct DB query, root cause likely a non-idempotent submit); (b) the Publisher Portal dashboard shows zero step-by-step guidance for first-time users — just an empty metrics wall and a bare form, disconnected from the "Four steps to your first ad" on the marketing site.

### Demo / content
9. **Fitness affiliate ads missing** — current ad library (Notion AI, Shipper.now) doesn't have fitness topic tags so contextual matching fails for FitTrack and 