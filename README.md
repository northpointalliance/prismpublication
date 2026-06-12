# Prism (AIADS)

An ad marketplace connecting **advertisers**, **publishers/bot-developers**, and **admins** — a public
marketing site plus a private 3-portal app, for serving ads inside AI chatbots.

## Stack (current)
- **Frontend:** Vite + React + Tailwind/shadcn — static SPA, deploys to **cPanel or Vercel**
- **Backend:** **Supabase Edge Functions** (Deno + Hono + postgres.js) — `supabase/functions/api`
- **Database:** **Supabase Postgres** · **Queue:** pgmq + pg_cron · **Storage:** Supabase Storage
- **Auth:** Supabase Auth · **Payments:** PayPal

## Start here
| You want to… | Read |
|---|---|
| Understand & operate the whole system | **[HANDOVER.md](HANDOVER.md)** |
| See the architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Deploy the frontend (cPanel/Vercel) | [docs/FRONTEND_DEPLOY.md](docs/FRONTEND_DEPLOY.md) |
| Operate as a non-technical admin | [SETUP_GUIDE.md](SETUP_GUIDE.md) |
| Supabase project & credentials | [docs/SUPABASE_CONNECTION.md](docs/SUPABASE_CONNECTION.md) |
| Browse all docs | [docs/README.md](docs/README.md) |

## Develop
```bash
npm install
npm run dev                 # frontend (Vite)
npm run build               # production build -> dist/

# Backend (Supabase Edge Functions)
supabase functions deploy api
~/.deno/bin/deno check --config supabase/functions/deno.json supabase/functions/api/index.ts
```

> The `server/` directory is the **legacy Express backend**, retained only as a rollback. New backend work
> happens in `supabase/functions/`.
