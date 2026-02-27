# CHANGELOG

This file tracks the website evolution from the first major redesign pass to the current state.

## 2026-02-26 (Supabase production alignment + portal UX refresh)

- Routing/security:
  - moved legacy admin panel route from `/admin` to `/notadmin`.
  - updated internal links that pointed to the legacy route.
- Login and workspace UX:
  - login page now renders inside site shell (navbar + footer).
  - workspace picker simplified to two centered options (Advertiser/Bot Developer) with clearer hover states.
  - added back navigation controls in workspace selection view.
- Advertiser portal redesign:
  - rebuilt dashboard around campaign KPI cards + campaign list actions.
  - replaced one-shot campaign form with a 3-step modal flow:
    - step 1: ad details + budgets + image drag/drop upload
    - step 2: creative preview
    - step 3: payment details + wallet top-up + submit for review
  - added campaign edit modal and per-campaign budget persistence in local storage.
- Bot developer portal redesign:
  - improved bot cards, metrics readability, and bot ID copy actions.
  - added bot delete flow (`DELETE /api/publisher/bots/:id`).
  - key rotation now invalidates old active key(s) and issues exactly one new active key.
  - added per-bot `Copy New Key` action; old/revoked keys are hidden in the main list.
- Supabase + production ops docs:
  - documented frontend/backend Supabase env expectations and `API_CORS_ORIGIN` multi-origin setup.
  - clarified first-run flow and current admin-workspace behavior.

## 2026-02-26 (Unified demo/docs/contact refresh)

- Routing and IA:
  - unified "How It Works" + demo experience onto `/demo`.
  - `/sdk` now redirects to `/demo`.
  - navbar/footer links updated to point to unified demo page.
  - added `/contact` page route.
- Demo page UX:
  - redesigned above-the-fold layout so the live demo is visible immediately.
  - converted demo styling to white/light presentation optimized for sales messaging.
  - added smoother conversation playback with per-character typing and slower pacing.
  - updated sponsored sequence to local creatives: Nike, Tokyo Sushi, Florista.
- Ad click flow:
  - demo CTA clicks now route to `/contact` with lead source query params.
- Contact page:
  - added working contact form with required-field + email validation.
  - added submit loading/success states and source/ad query metadata display.
- Frontend runtime:
  - in non-production mode, app now unregisters stale service workers and clears runtime cache keys to reduce old UI/cache issues.
- Docs:
  - refreshed `docs/README.md`, `docs/DEEP_DIVE.md`, `src/pages/Docs.tsx`, and `public/demo-ads/README.md` to match the current routes and demo behavior.

## 2026-02-26 (Advertiser + bot developer self-serve operations)

- Advertiser portal:
  - added campaign self-serve APIs:
    - `GET /api/advertiser/campaigns`
    - `POST /api/advertiser/campaigns`
    - `PATCH /api/advertiser/campaigns/:id`
  - updated `/app/advertiser` UI to create campaigns and toggle Review/Live state.
- Bot developer portal:
  - added bot management APIs:
    - `GET /api/publisher/bots`
    - `POST /api/publisher/bots`
    - `PATCH /api/publisher/bots/:id`
    - `POST /api/publisher/bots/:id/keys`
    - `GET /api/publisher/bots/:id/metrics`
  - updated `/app/publisher` UI to register bots and rotate SDK keys.
- SDK key model and auth:
  - added Prisma models for publisher bots and SDK keys.
  - SDK auth now supports master key and bot-specific keys.
  - bot-specific SDK keys are enforced to their own `botId` for ad fetch/track endpoints.
- Publisher dashboard enrichment:
  - dashboard now incorporates persisted bot registry + active key metadata.
- Docs:
  - refreshed setup/portal docs to include new self-serve flows.

## 2026-02-26 (CI + rate limiting + RBAC hardening)

- Authorization and role safety:
  - removed implicit admin fallback for unknown membership roles.
  - added strict role-to-organization compatibility checks.
  - added per-organization membership role prioritization to avoid duplicate workspace ambiguity.
- Credential safety:
  - removed non-production default fallbacks for `BOTGRID_API_KEY` and `ADMIN_API_KEY`.
  - API now fails startup when either key is missing.
- Rate limiting:
  - extracted limiter into `server/src/rate-limit.js`.
  - added optional Upstash Redis REST support via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
  - added automatic in-memory fallback if external limiter is unavailable.
- Testing:
  - added backend tests for rate limiting store/middleware behavior.
  - expanded backend role tests for unknown roles, compatibility, and role priority.
  - added frontend route guard tests covering auth/workspace/role redirects.
- CI:
  - added GitHub Actions workflow to run lint, frontend tests, server tests, and build on push/PR.

## 2026-02-26 (Security baseline tightening + demo route hardening)

- Auth/session hardening:
  - changed `ALLOW_INSECURE_DEV_AUTH` behavior to strict-by-default.
  - production now rejects startup when insecure auth bypass is explicitly enabled.
- Frontend secret hygiene:
  - removed `VITE_BOTGRID_API_KEY` and `VITE_ADMIN_KEY` usage from frontend runtime/env templates.
  - admin key prefill was removed from `/admin` and `/app/choose-workspace`.
- Demo isolation:
  - added `POST /api/demo/ads` and `POST /api/demo/track/:eventType` for public scripted playback.
  - moved `/demo` page to server-managed demo endpoints (no browser-bundled SDK key requirement).
- Rate limiting:
  - added route-level limiter for `/api/demo`.
  - added route-level limiter for `/api/leads`.
- Service worker safety:
  - excluded `/api/*` and authorization-bearing requests from runtime cache handling.
- Docs/env alignment:
  - updated docs and env examples to avoid client-side secret patterns and document demo endpoints.

## 2026-02-26 (Stability + security + maintainability fix pass)

- Security:
  - protected `GET /api/leads` with admin key auth.
  - added admin portal workspace middleware for role-checked portal admin API access.
- App role flow:
  - enabled admin workspace bootstrap in `/api/me/create-workspace` with `x-admin-key`.
  - expanded `/app/choose-workspace` to support admin workspace creation and additional workspace creation after onboarding.
- Admin portal:
  - added real overview API endpoint: `GET /api/admin/portal/overview`.
  - updated `/app/admin` portal page to load live overview metrics.
- SDK:
  - updated React hook/component options to support `baseUrl`.
  - React hook now rebuilds SDK instance when config changes.
- Frontend performance:
  - migrated page routes to lazy-loading with `React.lazy` + `Suspense`.
  - added manual vendor chunk splitting in Vite config.
- Testing and reliability:
  - added server tests for auth/security and role mapping helpers.
  - added `server` test script (`npm --prefix server run test`).
- Ops and docs:
  - made `scripts/prism_stack.sh` project-path portable.
  - refreshed `docs/DEEP_DIVE.md` to match the current architecture.
  - aligned docs for admin requirements and protected lead listing.

## 2026-02-26 (Security hardening pass)

- Hardened backend request handling:
  - added secure response headers
  - limited JSON body size (`64kb`)
  - added route-level rate limiting for `/api/auth`, `/api/me`, and `/api/admin`
- Hardened auth flow for portal routes:
  - support bearer token verification against Supabase user endpoint
  - enforce token/email match when bearer is present
  - secured `POST /api/auth/sync-user` with session validation
  - production requires secure key envs (`BOTGRID_API_KEY`, `ADMIN_API_KEY`)
- Reduced injection risk:
  - restricted ad URLs to `http/https` only
  - constrained tracking metadata schema to bounded scalar/list values
  - switched key comparison to timing-safe checks
- Frontend portal requests now send Supabase bearer session token alongside workspace headers.
- Credential hygiene:
  - stopped tracking root `.env` in git
  - added root `.env.example`
  - updated env examples and docs to use placeholder keys

## 2026-02-26 (Portal onboarding cleanup + UX pass)

- Removed hardcoded local test credentials from portal auth flow.
- Confirmed credentials are handled by Supabase Auth storage (database-backed auth path).
- Updated backend onboarding behavior:
  - `POST /api/auth/sync-user` now provisions user only.
  - new `POST /api/me/create-workspace` creates first advertiser/publisher workspace on role pick.
- Added DB-backed portal dashboard APIs:
  - `GET /api/advertiser/dashboard`
  - `GET /api/publisher/dashboard`
- Workspace creation and dashboard load now seed/read mock records through normal DB/API integration flow.
- Rebuilt `/app/login` UI for clearer first-time flow and reduced friction.
- Rebuilt `/app/choose-workspace` UI:
  - first-time users can choose Advertiser or Bot Developer and create workspace.
  - existing users can switch/open existing workspaces.
- Added richer mock dashboard data for:
  - `/app/advertiser`
  - `/app/publisher`
- Removed static portal credential references from docs and docs page.

## 2026-02-26 (Unified app auth + workspace routing)

- Implemented one-login app flow with role/workspace selection:
  - `/app/login`
  - `/app/choose-workspace`
  - role-routed portals:
    - `/app/advertiser`
    - `/app/publisher`
    - `/app/admin`
- Added frontend portal auth provider and route guards:
  - Supabase session sign-in/sign-up/sign-out
  - backend entry-context sync/load
  - workspace switching and default workspace selection
- Added backend user/org membership primitives and APIs:
  - new Prisma models: `User`, `Organization`, `OrganizationMember`
  - new endpoints:
    - `POST /api/auth/sync-user`
    - `GET /api/me/entry-context`
    - `GET /api/me/organizations`
    - `POST /api/me/default-workspace`
    - `POST /api/me/switch-organization`
- Verification run:
  - `npm run build` passed
  - `npm run lint` passed (warning-only fast-refresh rules)
  - `npm run test` passed
- Runtime note:
  - In this sandbox, direct port binding for `:8080` and `:8787` is restricted (`EPERM`), so live port checks here are limited.
  - On your machine, after `server` deps + Prisma setup, `./scripts/prism_stack.sh restart` should run the full stack.

## 2026-02-26 (Public documentation page)

- Added new public documentation page at `/docs` with:
  - SDK integration snippets
  - direct API call example
  - runtime stack commands
  - common errors and fixes (Vite host, Rollup module, esbuild mismatch, Cloudflare 530/403, API auth)
  - portal onboarding and troubleshooting reference
- Wired docs links in footer and SDK page navigation.
- Added `/docs` route to `public/sitemap.xml`.

## 2026-02-26 (Changelog refresh: verification + runbook)

- Confirmed latest implementation state:
  - SDK demo now uses real runtime/API calls (no in-page mock provider).
  - Admin panel exists at `/admin` with key-gated access.
  - Backend supports ad serving, tracking events, lead capture, and admin reads/writes.
  - Stack script now manages API + Vite + Cloudflare tunnel together.
- Verification pass completed:
  - `npm run build` passed.
  - `npm run test` passed.
  - `npm run lint` passed with warning-only existing UI/sdk fast-refresh warnings.
- Operational note:
  - If backend dependencies are missing, run in `server/`:
    - `npm install`
    - `npm run prisma:migrate`
    - `npm run prisma:seed`
  - Then run from project root:
    - `./scripts/prism_stack.sh restart`
    - `./scripts/prism_stack.sh status`

## 2026-02-26 (SDK + Admin runtime completion)

- Replaced demo page mock ad provider with real SDK runtime calls (`@botgrid/sdk`) against local API routes.
- Added local ad-serving endpoints to backend:
  - `POST /api/ads`
  - `POST /api/track/:eventType`
- Added ad inventory + event logging models in Prisma:
  - `Ad`
  - `AdEvent`
- Added admin API surface (key-protected) for operations:
  - overview, ads CRUD-lite, event list, lead list
- Added `/admin` page:
  - key-based unlock flow
  - ad creation + active toggle
  - recent SDK events + recent leads
- Updated Vite config:
  - `/api` proxy to local API (`localhost:8787`)
  - local alias mapping for `@botgrid/sdk` and `@botgrid/sdk/react`
- Updated stack script `scripts/prism_stack.sh`:
  - starts/stops API + Vite + tunnel together
  - includes API status and logs
- Fixed SDK build script robustness:
  - rewrote `packages/sdk/build.js` to call local esbuild CLI binary directly, avoiding host/binary mismatch failure.

## Review: First Change vs Current

### Baseline (first pass)
- Primarily a single long landing flow with mixed messaging.
- Value proposition was creative but not instantly explicit for new visitors.
- Multiple actions competed above the fold.
- Publisher and advertiser paths were not clearly separated.
- Demo page had UX friction (page-level auto-scroll while messages streamed).
- Footer was minimal and did not support strong information architecture.
- No blog system for ongoing SEO/content growth.

### Current state
- Clear multi-page IA with dedicated audience paths:
  - `/publishers`
  - `/advertisers`
  - `/sdk` (How It Works)
  - `/company`
  - `/demo`
  - `/blog` and `/blog/:slug`
- Stronger homepage clarity and tighter CTA hierarchy.
- Floating pill navbar with improved spacing so hero content does not sit under nav.
- Unified UI system updates:
  - Poppins font
  - rounded buttons
  - hover light sweep animation
  - updated blue gradient direction on primary CTA buttons
- Demo UX stabilized:
  - scoped chat autoscroll only
  - no full-page jump during playback
  - better top spacing and interaction behavior
- Footer upgraded to a full conversion/support block with better internal linking.
- Blog + article engine added with structured data model and mockup images.
- SEO foundations improved:
  - cleaner title/meta copy
  - sitemap added
  - robots updated with sitemap reference

## Requested Verification Checklist

These are the exact points you asked to confirm:

- Fixed bugs found in early passes: **YES**
  - Demo scroll jump fixed by moving to chat-container autoscroll logic.
  - Navbar overlap fixed by increasing top padding on hero sections.
  - Cloudflare/Vite hostname issue handled with `server.allowedHosts: true` in `vite.config.ts`.

- Decreased text / improved legibility: **YES**
  - Homepage hero and CTA copy simplified.
  - FAQ rewritten to shorter objection-first answers.
  - Typography normalized to `font-bold` instead of `font-black`.

- SEO pass: **YES (foundational pass complete)**
  - Homepage metadata refined (`index.html`).
  - `public/sitemap.xml` added.
  - `public/robots.txt` updated with sitemap reference.
  - Blog/article structure added for topical depth and internal linking.

- Made pages instead of one-pager: **YES**
  - Dedicated pages/routes for publishers, advertisers, SDK/how-it-works, company, demo, blog, and article detail.

- Fixed SDK bug + created demo page: **YES**
  - Rollup Linux optional dependency added: `@rollup/rollup-linux-x64-gnu` in `package.json`.
  - Dedicated `/demo` page created and UX stabilized (scroll behavior, spacing, controls).

- Adapted visuals for easier reading: **YES**
  - Better spacing and hierarchy, including navbar-safe top spacing.
  - Improved contrast on blue buttons (white foreground on primary backgrounds).
  - Rounded button system with consistent hover affordance.
  - Footer redesigned for clearer scan flow and information architecture.

## Timeline of Major Changes

### 2026-02-26 (Docs + sitemap maintenance)
- Updated docs index (`docs/README.md`) to match current multi-page architecture and commands.
- Documented clearly that Supabase remains active and local DB is additive (not a replacement).
- Refined sitemap structure with route coverage + `lastmod` entries.
- Confirmed robots sitemap reference remains aligned.

### 2026-02-26 (Local database foundation for scalability)
- Added local Postgres via `docker-compose.yml` (service: `postgres`).
- Added backend scaffold in `server/` using Express + Prisma.
- Added Prisma schema for leads pipeline (`server/prisma/schema.prisma`).
- Added root scripts for local DB and API operations:
  - `db:up`, `db:down`, `db:migrate`, `db:seed`, `api:dev`
- Added setup docs: `docs/LOCAL_DATABASE.md`

### 2026-02-25 to 2026-02-26 (Core platform + UX)
- Added audience-separated pages and routing.
- Refined homepage sections for scannability and conversion focus.
- Introduced shared shell/layout patterns.
- Improved navigation behavior and mobile semantics.

### 2026-02-26 (Design system updates)
- Switched site font to Poppins.
- Updated primary color system around `#3DBBFB` + darker blue pair.
- Set primary-on-blue text/icons to white for contrast clarity.
- Made CTA buttons fully rounded with sweep hover effect.

### 2026-02-26 (Demo stabilization)
- Reworked message auto-scroll to stay inside chat container.
- Prevented page jumping during AI typing playback.
- Increased top spacing to clear floating navbar.

### 2026-02-26 (Content + SEO expansion)
- Added blog landing page and article templates.
- Added 3 ad-focused mock articles and supporting mockup images.
- Added blog links in footer only (not navbar).
- Updated homepage metadata and social metadata wording.
- Added `public/sitemap.xml` and linked it via `public/robots.txt`.

## Files Added (High Impact)
- `src/pages/Blog.tsx`
- `src/pages/BlogArticle.tsx`
- `src/content/blogPosts.ts`
- `public/mockups/blog-intent-signals.svg`
- `public/mockups/blog-publisher-ops.svg`
- `public/mockups/blog-creative-patterns.svg`
- `public/sitemap.xml`
- `docs/CHANGELOG.md`
- `docs/LOCAL_DATABASE.md`
- `docker-compose.yml`
- `server/package.json`
- `server/.env.example`
- `server/src/index.js`
- `server/prisma/schema.prisma`
- `server/prisma/seed.js`
- `.env.local-db.example`

## Files Updated (High Impact)
- `src/App.tsx`
- `src/components/HeroSection.tsx`
- `src/components/AudienceSection.tsx`
- `src/components/StatsSection.tsx`
- `src/components/FAQSection.tsx`
- `src/components/CTASection.tsx`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/components/ui/button.tsx`
- `src/pages/Demo.tsx`
- `src/index.css`
- `tailwind.config.ts`
- `index.html`
- `public/robots.txt`
- `package.json`

## Current Known Notes
- Build is passing.
- Lint has existing warning-only entries in shared UI/sdk files (`react-refresh/only-export-components`), no blocking errors.
