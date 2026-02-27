# AI Flow Network - Deep Dive

## 1) Architecture Overview

This project currently runs as a split frontend + API stack:

- Frontend: React 18 + TypeScript + Vite (`src/`)
- API: Express + Prisma (`server/`)
- Data: PostgreSQL (local Docker or managed Postgres)
- Auth/session identity: Supabase Auth tokens validated by API

High-level request flow:

1. User signs in from `/app/login` using Supabase Auth.
2. Frontend sends bearer token + `x-user-email` to API routes.
3. API validates session token, resolves workspace membership, and returns role-scoped data.
4. Frontend routes users into advertiser/publisher/admin app areas.

## 2) Runtime Surfaces

Public marketing routes:

- `/`
- `/product`
- `/publishers`
- `/advertisers`
- `/demo` (How It Works + live demo page)
- `/sdk` (legacy redirect to `/demo`)
- `/company`
- `/contact`
- `/blog`
- `/blog/:slug`
- `/docs`

Application routes:

- `/app/login`
- `/app/choose-workspace`
- `/app/advertiser`
- `/app/publisher`
- `/app/admin`

Legacy admin panel:

- `/notadmin` (admin key gated)

## 3) Backend Security Model

Key middleware and controls in `server/src/index.js`:

- CORS allowlist from `API_CORS_ORIGIN`
- JSON body size cap (`64kb`)
- secure headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.)
- route-level rate limiting for `/api/auth`, `/api/me`, `/api/admin`, `/api/demo`, and `/api/leads` via `server/src/rate-limit.js`
  - default in-memory limiter
  - optional distributed limiter through Upstash Redis REST
  - automatic fallback to in-memory limiter on external failures
- timing-safe key comparisons

Auth modes:

- Portal session routes require bearer token + email header.
- Admin key routes require `x-admin-key`.
- Admin workspace bootstrap (`POST /api/me/create-workspace` with `type=admin`) requires `x-admin-key`.
- Insecure session bypass is disabled by default and only enabled with `ALLOW_INSECURE_DEV_AUTH="true"`.
- API startup now requires both `BOTGRID_API_KEY` and `ADMIN_API_KEY` in all environments.

Lead security:

- `POST /api/leads` is public ingestion.
- `GET /api/leads` is admin-key protected.

## 4) Identity and Workspace Model

Core entities:

- `User`
- `Organization` (`advertiser`, `publisher`, `admin`)
- `OrganizationMember` (role-scoped membership)
- `PublisherBot`
- `BotSdkKey`

Portal role mapping:

- `advertiser_*` -> advertiser portal
- `publisher_*` -> bot developer portal
- `reviewer|admin|super_admin` -> admin portal
- unknown roles -> rejected (no admin fallback)

Membership normalization:

- API selects one effective membership per organization (highest-priority compatible role).
- Incompatible role/org combinations are excluded from workspace entry context.

The frontend keeps one session and switches workspace context via:

- `POST /api/me/default-workspace`

## 5) API Groups

Shared auth/workspace:

- `POST /api/auth/sync-user`
- `GET /api/me/entry-context`
- `GET /api/me/organizations`
- `POST /api/me/create-workspace`
- `POST /api/me/default-workspace`
- `POST /api/me/switch-organization`

Advertiser:

- `GET /api/advertiser/dashboard`
- `GET /api/advertiser/campaigns`
- `POST /api/advertiser/campaigns`
- `PATCH /api/advertiser/campaigns/:id`

Publisher:

- `GET /api/publisher/dashboard`
- `GET /api/publisher/bots`
- `POST /api/publisher/bots`
- `PATCH /api/publisher/bots/:id`
- `DELETE /api/publisher/bots/:id`
- `POST /api/publisher/bots/:id/keys`
- `GET /api/publisher/bots/:id/metrics`
  - key rotation revokes previous active bot keys before issuing the new token.

Admin:

- `GET /api/admin/portal/overview` (portal session + admin workspace)
- `GET /api/admin/overview` (admin key)
- `GET/POST /api/admin/ads` (admin key)
- `PATCH /api/admin/ads/:id` (admin key)
- `GET /api/admin/events` (admin key)
- `GET /api/admin/leads` (admin key)

SDK and tracking:

- `POST /api/ads`
- `POST /api/track/:eventType`
- Supports both platform master SDK key and bot-scoped SDK keys.
- Bot-scoped keys are restricted to their own `botId`.

Demo runtime:

- `POST /api/demo/ads`
- `POST /api/demo/track/:eventType` (impression/click)
- Frontend demo currently uses a deterministic sponsored fallback sequence with local assets:
  - `/public/demo-ads/nikeairforce1.jpg`
  - `/public/demo-ads/sushinewyork.avif`
  - `/public/demo-ads/florista.webp`
- Demo ad CTAs route users to `/contact` with query metadata for lead source attribution.

Leads:

- `POST /api/leads`
- `GET /api/leads` (admin key)

## 6) Frontend State and Data

Data layer:

- `apiRequest` helper (`src/lib/api.ts`) handles base URL + error parsing.
- Portal header helper (`src/lib/portal-api.ts`) attaches user email + bearer token.
- Portal auth state (`PortalAuthProvider`) manages entry context, workspace selection, and onboarding.
- Advertiser portal uses a 3-step ad creation modal: creative/budget -> preview -> payment + submit.
- Publisher portal surfaces only the current active SDK key in list views; full tokens are shown once at issue time.

Routing protection:

- `RequirePortalLogin`
- `RequireWorkspaceSelection`
- `RequireWorkspaceRole`

## 7) SDK Package

Location: `packages/sdk`

- Core class: `BotGridAds` (`packages/sdk/src/index.ts`)
- React helpers: `useBotGridAd`, `BotGridAdComponent` (`packages/sdk/src/react.tsx`)
- Build output: `packages/sdk/dist`

Notable behavior:

- React hook now supports `baseUrl`.
- React hook recreates SDK when config changes.

## 8) Project Structure

Top-level:

- `src/` frontend app
- `server/` API + Prisma schema/seed
- `packages/sdk/` SDK package
- `docs/` product and technical docs
- `scripts/prism_stack.sh` local stack control script

## 9) Local Operations

Frontend:

```bash
npm run dev
npm run lint
npm run test
npm run build
```

API + DB:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
npm run api:dev
```

All-in-one stack:

```bash
./scripts/prism_stack.sh start
./scripts/prism_stack.sh status
./scripts/prism_stack.sh logs
./scripts/prism_stack.sh stop
```

## 10) Current Gaps

- Backend integration tests should expand from utility/middleware checks into full endpoint-flow scenarios.
- Admin moderation/risk workflows are still basic compared to the full product plan.
- More end-to-end and cross-service tests are needed for portal flows.

## 11) Quality Gates

- CI workflow (`.github/workflows/ci.yml`) runs on push/PR:
  - `npm run lint`
  - `npm run test`
  - `npm run test:server`
  - `npm run build`
