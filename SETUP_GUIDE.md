# Prism — Setup & Handoff Guide

> Written for operators. For the full technical handover see [HANDOVER.md](HANDOVER.md);
> for architecture see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
>
> **✅ LIVE (June 2026):** the site runs at **https://prismpublication.com** — frontend on **Vercel**,
> backend entirely on **Supabase Edge Functions**, database on **Supabase Postgres**, job queue on **pgmq**.
> The old self-hosted server (Express + tunnel on a local machine) is **decommissioned**. Older mentions of
> `server/.env`, `DATABASE_URL` to Railway/Render, or `REDIS_URL` are legacy.
> For day-2 fixes see the **[Runbook](docs/RUNBOOK.md)**.

---

## What is Prism?
An ad marketplace connecting three user types:

| Who | What they do |
|-----|-------------|
| **Advertisers** | Pay to run ads inside AI chatbots |
| **Publishers (Bot Developers)** | Register their bots to show ads and earn money |
| **Admins** | Review ads, approve payouts, and configure platform settings |

A public marketing site + a private app with the three portals above.

---

## How it's hosted now
| Piece | Runs on | Config |
|---|---|---|
| Frontend (website + app) | **Vercel** → https://prismpublication.com (auto-deploys on git push) | build-time `VITE_` env vars in Vercel |
| Backend (API) | **Supabase Edge Functions** | function secrets (Supabase dashboard) |
| Database | **Supabase Postgres** | managed |
| Payments | PayPal | set in **Admin → Settings → PayPal** |

There is no server to run or `DATABASE_URL` to fill in anymore — Vercel hosts the site, Supabase hosts the
backend + database. Deploying = `git push` (Vercel rebuilds automatically). cPanel is a supported alternative
host if you ever move off Vercel (see [docs/FRONTEND_DEPLOY.md](docs/FRONTEND_DEPLOY.md)).

---

## Frontend settings (`AIADS/.env`, used at build time)
```
VITE_API_BASE_URL=https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api
VITE_SUPABASE_URL=https://botnabfogcjrkpmdjgpr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_3OE-gh5j9AhXsAIlNySH5A_Nqo3VRUi
VITE_SUPABASE_PROJECT_ID=botnabfogcjrkpmdjgpr
```
| Setting | What it does |
|---|---|
| `VITE_API_BASE_URL` | Where the app sends API calls (the Supabase Edge Function) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Used for login (Supabase Auth) |

## Backend settings (Supabase → Edge Functions → Secrets)
Set once in the dashboard. PayPal is configured in the Admin portal, not here.
| Secret | What it does |
|---|---|
| `ADMIN_API_KEY` | Secret key for admin API/CLI calls *(currently a dev placeholder — rotate before production)* |
| `PRISM_API_KEY` | Master key AI bots use to request ads *(dev placeholder — rotate)* |
| `API_CORS_ORIGIN` | Comma-separated list of allowed frontend domains |
| `DB_URL` | Pooled Postgres connection (transaction pooler) |

---

## Service accounts
### Supabase (login + backend + database)
- Project `botnabfogcjrkpmdjgpr` — dashboard: https://supabase.com/dashboard/project/botnabfogcjrkpmdjgpr
- Add app users: Authentication → Users → Invite. Assign roles in the `organization_members` table.
- **After choosing the production domain:** Authentication → URL Configuration → set Site URL + add the
  domain to Redirect URLs (else login/password-reset redirects fail).

### PayPal (payments)
- Configure in **Admin portal → Settings → PayPal Gateway** (Client ID + Secret + sandbox/live). Takes
  effect immediately. Stored in the database, not in env.
- **Webhooks:** PayPal Developer → your app → Webhooks → Add Webhook with URL
  `https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/webhooks/paypal`, events:
  `PAYMENT.CAPTURE.COMPLETED/DENIED/REVERSED`, `PAYOUT_ITEM.SUCCEEDED/FAILED`. Copy the Webhook ID into the
  `PAYPAL_WEBHOOK_ID` function secret.

---

## Deploying the frontend
See [docs/FRONTEND_DEPLOY.md](docs/FRONTEND_DEPLOY.md). Summary:
- **cPanel:** `npm run build` → upload the contents of `dist/` to the web root (`.htaccess` handles routing).
- **Vercel:** import the repo (auto-detected; `vercel.json` included) and set the four `VITE_` env vars.

## Deploying a backend change
`supabase functions deploy api` (after editing `supabase/functions/`). See HANDOVER.md.

---

## Admin Portal — first-time setup
Log into `/app/admin`:
1. **Settings** → set the **Platform Fee** (default 30%).
2. **Settings → PayPal Gateway** → enter Client ID + Secret, choose Sandbox/Live, Save.
3. **Review Queue** → approve/reject new campaigns.
4. **Finance → Payouts** → process pending publisher payouts ("Pay via PayPal" or "Mark Paid").

## User roles
| Role | Portal | Can do |
|------|--------|--------|
| `advertiser_owner` / `advertiser_member` | `/app/advertiser` | Campaigns, wallet top-up |
| `publisher_owner` / `publisher_dev` | `/app/publisher` | Bots, SDK keys, payouts |
| `admin` / `super_admin` | `/app/admin` | Review ads, payouts, settings |
| `reviewer` | `/app/admin` | Review queue only |

Assign a role by inserting into `organization_members` (Supabase → Table editor or SQL).

---

## Day-to-day operations
- **"My ad isn't showing"** → Admin → Review Queue → Approve the pending ad.
- **Publisher wants their money** → Admin → Finance → Payouts → Pay via PayPal.
- **Payment didn't go through** → Admin → Finance → Top-Ups; cross-check PayPal dashboard; if PayPal shows
  complete but Prism doesn't, check the webhook (Supabase function logs).
- **Block a live ad** → Admin → Review Queue → Live Ads → Take Down.

## If something breaks — what to give a developer
1. Exact error message (screenshot) + which page + what you were doing.
2. Supabase **Edge Function logs** (Dashboard → Edge Functions → `api` → Logs).
3. Key files: `supabase/functions/api/routes/` (API logic), `server/prisma/schema.prisma` (DB structure),
   `audit_logs` table (every admin action).

## Quick reference
| Thing | Where |
|-------|-------|
| App login | `https://<frontend-domain>/app/login` |
| Admin portal | `https://<frontend-domain>/app/admin` |
| API health | `https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/health` |
| Frontend config | `AIADS/.env` (build-time) |
| Backend secrets | Supabase → Edge Functions → Secrets |
| Supabase dashboard | https://supabase.com/dashboard/project/botnabfogcjrkpmdjgpr |
| Technical handover | [HANDOVER.md](HANDOVER.md) |
