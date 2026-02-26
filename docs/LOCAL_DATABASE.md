# Local Database Setup (Scalable Path)

This project is now prepared for a local-first database stack using:

- PostgreSQL (Docker) for local development
- Prisma ORM for schema management and migration safety
- Lightweight Node API (`server/`) for future business logic growth

## Why this is the best long-term integration here

1. PostgreSQL gives production-grade behavior locally.
2. Prisma keeps schema, migrations, and generated client in sync.
3. API layer separates frontend from data storage so you can evolve auth, queues, and background jobs later.
4. Moving from local to managed Postgres is mostly a `DATABASE_URL` swap.

## Quick start

1. Start local Postgres:

```bash
docker compose up -d postgres
```

2. Install server dependencies:

```bash
cd server
npm install
cp .env.example .env
```

3. Initialize schema and client:

```bash
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

4. Run local API:

```bash
npm run dev
```

API default:

- `GET /health`
- `POST /api/auth/sync-user`
- `GET /api/me/entry-context` (requires `x-user-email`)
- `GET /api/me/organizations` (requires `x-user-email`)
- `POST /api/me/default-workspace` (requires `x-user-email`)
- `POST /api/me/switch-organization` (requires `x-user-email`)
- `POST /api/ads` (SDK ad serving)
- `POST /api/track/:eventType` (SDK events: impression/click/revenue)
- `POST /api/leads`
- `GET /api/leads`
- `GET /api/admin/overview` (admin key required)
- `GET/POST /api/admin/ads` (admin key required)
- `PATCH /api/admin/ads/:id` (admin key required)
- `GET /api/admin/events` (admin key required)
- `GET /api/admin/leads` (admin key required)

Required keys (from `server/.env`):

- `BOTGRID_API_KEY` for SDK requests (`Authorization: Bearer ...`)
- `ADMIN_API_KEY` for admin endpoints (`x-admin-key`)

Frontend optional env (root `.env`):

- `VITE_API_BASE_URL` (defaults to `/api`)
- `VITE_BOTGRID_API_KEY` (defaults to `local-demo-key`)
- `VITE_ADMIN_KEY` (optional prefill for `/admin`)

## Added multi-portal identity model

New core Prisma entities:

- `User`
- `Organization`
- `OrganizationMember`

This enables one-login + multi-workspace routing for:

- Advertiser portal
- Bot developer portal
- Admin portal

## Production migration path

When ready, point `DATABASE_URL` to managed Postgres (Supabase Postgres, RDS, Neon, etc.) and run migrations. No schema rewrite required.

## Current Supabase status

Frontend Supabase config remains in place so existing flows do not break.
You can migrate incrementally by moving write paths to the local API first.
