# Prism (AIADS)

An ad marketplace connecting **advertisers**, **publishers / bot-developers**, and **admins** — a public
marketing site plus a private 3-portal app, for serving ads inside AI chatbots.

> **Status: LIVE.** Frontend on **Vercel** at **https://prismpublication.com**, backend fully on **Supabase**.

## Stack
| Layer | Tech | Where |
|---|---|---|
| Frontend | Vite + React + Tailwind/shadcn, Supabase Auth | static SPA on **Vercel** (`prismpublication.com`) |
| Backend API | Deno + Hono + postgres.js | **Supabase Edge Functions** (`supabase/functions/api`) |
| Database | Supabase Postgres 17 | project `botnabfogcjrkpmdjgpr` (eu-west-2) |
| Queue | pgmq + pg_cron | same project (`supabase/functions/queue-worker`) |
| Storage | Supabase Storage (`blog-images`) | same project |
| Auth | Supabase Auth | — |
| Payments | PayPal (REST) | creds in `platform_settings` table |

## Start here
| You want to… | Read |
|---|---|
| **Operate / understand the whole system** | **[HANDOVER.md](HANDOVER.md)** ← start here |
| Fix something / day-2 operations | **[docs/RUNBOOK.md](docs/RUNBOOK.md)** |
| See the architecture in depth | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Deploy / redeploy the frontend | [docs/FRONTEND_DEPLOY.md](docs/FRONTEND_DEPLOY.md) |
| How auto-deploy (CI/CD) works | [docs/CI_CD.md](docs/CI_CD.md) |
| Supabase project & credentials | [docs/SUPABASE_CONNECTION.md](docs/SUPABASE_CONNECTION.md) |
| Operate as a non-technical admin | [SETUP_GUIDE.md](SETUP_GUIDE.md) |
| Browse all docs | [docs/README.md](docs/README.md) |

## How deploys work
A single `git push` to `main` on **`github.com/northpointalliance/test1`** deploys everything:
- **Vercel** (Git integration) rebuilds + deploys the **frontend** automatically.
- A **GitHub Action** deploys the **Supabase Edge Functions** (once the `SUPABASE_ACCESS_TOKEN` repo secret is set).

> ⚠️ Vercel is on the **Hobby** plan, which only deploys commits whose author is the account owner. This
> repo is therefore configured to author commits as **`northpointalliance`** — keep it that way (see
> [docs/CI_CD.md](docs/CI_CD.md)) or upgrade Vercel to Pro.

## Develop
```bash
npm install
npm run dev      # frontend (Vite) on http://localhost:5173
npm run build    # production build -> dist/

# Backend (Supabase Edge Functions)
~/.deno/bin/deno check --config supabase/functions/deno.json supabase/functions/api/index.ts   # typecheck
supabase functions deploy api                                                                  # deploy
```

> `server/` is the **legacy Express backend** (pre-migration), kept for reference only — it is **no longer
> running**. All backend work happens in `supabase/functions/`. See [HANDOVER.md](HANDOVER.md).
