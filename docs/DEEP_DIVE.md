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
- `/sdk`
- `/company`
- `/blog`
- `/blog/:slug`
- `/demo`
- `/docs`

Application routes:

- `/app/login`
- `/app/choose-workspace`
- `/app/advertiser`
- `/app/publisher`
- `/app/admin`

Legacy admin panel:

- `/admin` (admin key gated)

## 3) Backend Security Model

Key middleware and controls in `server/src/index.js`:

- CORS allowlist from `API_CORS_ORIGIN`
- JSON body size cap (`64kb`)
- secure headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.)
- route-level rate limiting for `/api/auth`, `/api/me`, and `/api/admin`
- timing-safe key comparisons

Auth modes:

- Portal session routes require bearer token + email header.
- Admin key routes require `x-admin-key`.
- Admin workspace bootstrap (`POST /api/me/create-workspace` with `type=admin`) requires `x-admin-key`.

Lead security:

- `POST /api/leads` is public ingestion.
- `GET /api/leads` is admin-key protected.

## 4) Identity and Workspace Model

Core entities:

- `User`
- `Organization` (`advertiser`, `publisher`, `admin`)
- `OrganizationMember` (role-scoped membership)

Portal role mapping:

- `advertiser_*` -> advertiser portal
- `publisher_*` -> bot developer portal
- `reviewer|admin|super_admin` -> admin portal

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

Publisher:

- `GET /api/publisher/dashboard`

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

Leads:

- `POST /api/leads`
- `GET /api/leads` (admin key)

## 6) Frontend State and Data

Data layer:

- `apiRequest` helper (`src/lib/api.ts`) handles base URL + error parsing.
- Portal header helper (`src/lib/portal-api.ts`) attaches user email + bearer token.
- Portal auth state (`PortalAuthProvider`) manages entry context, workspace selection, and onboarding.

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

- Backend integration tests are still early and should expand beyond utility-level checks.
- Admin moderation/risk workflows are still basic compared to the full product plan.
- More route-level and component-level tests are needed for portal flows.
