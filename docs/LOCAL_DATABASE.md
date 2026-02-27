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
- `POST /api/auth/sync-user` (requires `Authorization: Bearer <supabase-access-token>`)
- `GET /api/me/entry-context` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `GET /api/me/organizations` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `POST /api/me/create-workspace` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `POST /api/me/default-workspace` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `POST /api/me/switch-organization` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `GET /api/advertiser/dashboard` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `GET /api/advertiser/campaigns` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `POST /api/advertiser/campaigns` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `PATCH /api/advertiser/campaigns/:id` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `GET /api/publisher/dashboard` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `GET /api/publisher/bots` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `POST /api/publisher/bots` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `PATCH /api/publisher/bots/:id` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `DELETE /api/publisher/bots/:id` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `POST /api/publisher/bots/:id/keys` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `GET /api/publisher/bots/:id/metrics` (requires `x-user-email` + `Authorization: Bearer <supabase-access-token>`)
- `POST /api/demo/ads` (public demo ad fetch route with rate limiting)
- `POST /api/demo/track/:eventType` (public demo tracking route, impression/click only, rate limited)
- `POST /api/ads` (SDK ad serving)
- `POST /api/track/:eventType` (SDK events: impression/click/revenue)
- `POST /api/leads`
- `GET /api/leads` (admin key required)
- `GET /api/admin/overview` (admin key required)
- `GET /api/admin/portal/overview` (admin workspace session required)
- `GET/POST /api/admin/ads` (admin key required)
- `PATCH /api/admin/ads/:id` (admin key required)
- `GET /api/admin/events` (admin key required)
- `GET /api/admin/leads` (admin key required)

Required keys (from `server/.env`):

- `PRISM_API_KEY` for SDK requests (`Authorization: Bearer ...`)
- Bot-specific SDK keys can be created from `/app/publisher` and used instead of the master key.
  - Rotating a bot key invalidates prior active keys for that bot.
- `ADMIN_API_KEY` for admin endpoints (`x-admin-key`)
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for backend token verification
- Optional distributed rate limiting:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

Startup behavior:

- API startup fails if `PRISM_API_KEY` or `ADMIN_API_KEY` is missing.

Frontend optional env (root `.env`):

- `VITE_API_BASE_URL` (defaults to `/api`)

Important:

- Do not put `PRISM_API_KEY` or `ADMIN_API_KEY` into `VITE_*` variables.
- `VITE_*` values are bundled client-side and are public by design.

## Added multi-portal identity model

New core Prisma entities:

- `User`
- `Organization`
- `OrganizationMember`

This enables one-login + multi-workspace routing for:

- Advertiser portal
- Bot developer portal
- Admin portal

## App onboarding behavior

Portal credentials are not hardcoded.

For local role-flow testing:
- Open `/app/login`
- Create a new account
- On first login, choose Advertiser or Bot Developer
- The app calls `POST /api/me/create-workspace` and routes into the selected portal
- Portal dashboards are populated from DB via:
  - `GET /api/advertiser/dashboard`
  - `GET /api/publisher/dashboard`

Admin note:
- The first-run workspace picker only exposes Advertiser and Bot Developer.
- Admin workspace bootstrap remains API-supported with `type=admin` + `x-admin-key`.

## Production migration path

When ready, point `DATABASE_URL` to managed Postgres (Supabase Postgres, RDS, Neon, etc.) and run migrations. No schema rewrite required.

## Current Supabase status

Frontend Supabase config remains in place so existing flows do not break.
You can migrate incrementally by moving write paths to the local API first.

## Security notes

- Keep `.env` and `server/.env` local only; use `.env.example` files as templates.
- Rotate `PRISM_API_KEY` and `ADMIN_API_KEY` before any public deployment.
- `ALLOW_INSECURE_DEV_AUTH` is strict by default; only set it to `"true"` for local debugging.
