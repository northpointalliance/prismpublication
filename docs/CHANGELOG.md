# CHANGELOG

This file tracks the website evolution from the first major redesign pass to the current state.

## 2026-02-28 (CPM pricing engine — budget enforcement, auto-revenue, admin rate table)

### Business model — now fully wired

Previously, advertiser spend and publisher earnings were completely disconnected ledgers: advertisers reserved a budget upfront (one wallet deduction at campaign launch), but there was no per-impression pricing logic and no automatic publisher credit. This release connects them.

#### Ad model new fields
- `dailyBudgetCents Int @default(0)` — maximum spend per calendar day
- `lifetimeBudgetCents Int @default(0)` — maximum total spend for the campaign's lifetime
- `endsAt DateTime?` — optional hard stop date (set automatically from `durationDays` at creation)

#### CPM rate table (admin-configurable)
- Rates stored in `PlatformSettings` under keys `cpm_text_cents`, `cpm_card_cents`, `cpm_banner_cents`.
- Default rates: text = $10 CPM, card = $20 CPM, banner = $15 CPM.
- Admin can edit all three rates live from **Admin → Settings → Base Rate Table**.
- The rate table UI shows for each format: advertiser CPM, per-impression cost (¢), publisher earnings after fee, and platform net.

#### Auto-revenue on impression
- When `POST /api/track/impression` fires for a budget-managed ad (one with `dailyBudgetCents > 0` or `lifetimeBudgetCents > 0`), the server automatically creates a `revenue` AdEvent for the publisher bot at the configured CPM rate.
- `chargeAmountCents = Math.max(1, Math.round(cpmCents / 1000))` — minimum 1¢ per impression.
- The revenue event carries `metadata: { source: "auto_cpm", cpmCents }` for auditability.
- Failure to generate the auto-revenue event is non-blocking (logs error, impression still recorded).
- Ads **without** a budget (`dailyBudgetCents = 0`, `lifetimeBudgetCents = 0`) continue to work with manually submitted publisher SDK revenue events, unchanged.

#### Budget enforcement in ad selection
- `selectAdForRequest` now filters the active ad pool in two steps before weighted random selection:
  1. **Expiry filter** — ads with `endsAt < now` are excluded.
  2. **Budget filter** — for budget-managed ads, two `adEvent.groupBy` queries compute today's revenue spend and all-time revenue spend. Ads that have hit their daily or lifetime cap are excluded for the rest of that period.

#### Publisher earnings automatically populated
- Publisher Payouts panel now reflects earnings from auto-CPM events — no manual SDK calls needed for budget-managed campaigns.
- The existing `calcPublisherAvailable` fee calculation is unchanged; auto-revenue events use the same `amount` (cents) field.

#### Advertiser portal
- Campaign creation now sends `dailyBudgetCents`, `lifetimeBudgetCents`, `durationDays` to the API so they're persisted in the DB.
- Campaign edit PATCH also sends updated budget fields; lifetime budget is capped at the original reservation to prevent unintended free overruns.

#### Budget edit behavior (important)
- Wallet deduction happens **once at campaign launch** for the full lifetime budget.
- Editing a campaign later updates the DB pacing caps but does NOT auto-adjust the wallet:
  - **Decreasing daily budget** → ad paces slower (spends less per day), runs longer.
  - **Decreasing lifetime budget** → ad stops sooner (this is a refund-free reduction).
  - **Increasing lifetime budget** → capped at original reservation to prevent free overruns.
  - **Increasing daily budget** → no extra charge; the rate at which the reserved budget is consumed increases, so the campaign ends sooner.

#### New helper functions (`server/src/money-utils.js`)
- `cpmiCents(cpmCents)` — returns per-impression cost in whole cents (min 1¢).
- `getPlatformCpmRate(format, prisma)` — reads CPM from PlatformSettings with fallback to defaults.

#### New admin route
- `PUT /api/admin/platform-settings/rates` — updates CPM rates for text/card/banner; writes `RATE_TABLE_UPDATE` audit log entry.
- `GET /api/admin/platform-settings` now includes `cpmTextCents`, `cpmCardCents`, `cpmBannerCents` in response.

#### New frontend component
- `src/components/portal/admin/RateTableForm.tsx` — rate table card with 3 format inputs, save button, and live breakdown table (advertiser pays / per impression / publisher receives / platform keeps).

## 2026-02-28 (Platform hardening: tests, HMAC default-on, image validation, audit log, webhooks, component extraction)

### Integration tests for money flows
- **New test suites** — `server/test/money-flows-wallet.test.js` and `server/test/money-flows-payouts.test.js` added (48 tests total, all passing).
  - Wallet suite covers: PayPal order creation, capture (first call + idempotent duplicate), spend (success + insufficient funds 402).
  - Payouts suite covers: balance calculation with fee deduction, withdraw (success, below-$1 minimum, in-flight 409 guard), PayPal email save, admin process payout, admin manual status update.
  - All stubs use `node:test`'s `mock.fn()` / `mock.module()` — no new test dependencies.
- **New shared math module** — `server/src/money-utils.js` extracted from duplicate payout calculations; re-used in route handlers and test stubs.

### HMAC default changed to opt-out
- `server/src/config.js` — `requireSdkHmac` changed from `=== "true"` (opt-in) to `!== "false"` (opt-out). HMAC enforcement is now **on by default** in all environments.
- `server/.env.example` — comment updated to reflect the new default; `REQUIRE_SDK_HMAC=false` is now the escape hatch for migration windows only.
- `docs/README.md` Production Checklist and Security Baseline sections already reflect the opt-out default.

### Server-side image validation
- **New module** — `server/src/image-validation.js`: `validateImageUrl(url)` async helper.
  - Rejects non-HTTPS URLs and private/loopback IPs (SSRF guard: 10.x, 192.168.x, 127.x, ::1, fd\*\* ranges).
  - Issues a `HEAD` request with a 5-second timeout; verifies 2xx status, `Content-Type: image/*`, and `Content-Length ≤ 10 MB`.
- Integrated in `server/src/routes/advertiser.js` (campaign create and update) and `server/src/routes/admin.js` (admin ad create). Invalid image URLs return `400 { error: "Image validation failed: <reason>" }`.

### Audit log
- **New Prisma model** — `AuditLog` with fields: `action` (enum), `actorUserId`, `organizationId`, `resourceId`, `resourceType`, `before` (JSON), `after` (JSON), `ipAddress`, `createdAt`. Indexed on `(action, createdAt)`, `(organizationId, createdAt)`, and `resourceId`.
- **New enum** — `AuditAction`: `AD_APPROVE`, `AD_REJECT`, `AD_TAKEDOWN`, `WALLET_TOPUP`, `PAYOUT_REQUEST`, `PAYOUT_PROCESS`, `PAYOUT_STATUS_UPDATE`, `PLATFORM_FEE_UPDATE`, `PAYPAL_CONFIG_UPDATE`.
- **New module** — `server/src/audit.js`: `logAudit(params)` helper. Fire-and-forget (never throws; audit failure logs to stderr but does not abort the main request).
- Integrated in:
  - `server/src/routes/admin.js` — AD_APPROVE, AD_REJECT, PAYOUT_PROCESS, PAYOUT_STATUS_UPDATE, PLATFORM_FEE_UPDATE, PAYPAL_CONFIG_UPDATE.
  - `server/src/routes/wallet.js` — WALLET_TOPUP on successful capture.
  - `server/src/routes/payouts.js` — PAYOUT_REQUEST on successful withdraw submission.
- Schema applied via `prisma db push`.

### PayPal webhook handler
- **New route file** — `server/src/routes/webhooks.js` mounted at `/api/webhooks` (no auth middleware).
- Webhook signature verification via PayPal's `/v1/notifications/verify-webhook-signature` REST API (full cert verification, not manual HMAC). Returns `400` if `verification_status !== "SUCCESS"`.
- Handled events:
  - `PAYMENT.CAPTURE.COMPLETED` — confirms a wallet top-up; logs audit.
  - `PAYMENT.CAPTURE.DENIED` / `.REVERSED` — reverses wallet credit with a `refund` WalletTransaction; logs audit.
  - `PAYOUT_ITEM.SUCCEEDED` — updates PayoutRequest status → `paid`, sets `processedAt`; logs audit.
  - `PAYOUT_ITEM.FAILED` — updates PayoutRequest status → `failed`; logs audit.
- `PAYPAL_WEBHOOK_ID` env var added to `server/.env.example` and `server/src/config.js`.

### Portal component extraction
- Extracted **17 new presentational components** from the three large portal pages; all state management and API calls remain in the parent page files.
- New components:
  - **Shared**: `src/components/portal/ChartTooltip.tsx`
  - **Advertiser**: `AdvertiserSummaryMetrics`, `CampaignPerformanceChart`, `CampaignList`, `BillingPanel`, `CreateCampaignWizard`, `EditCampaignModal`
  - **Publisher**: `PublisherSummaryMetrics`, `BotPerformanceChart`, `BotRegistry` (also exports `BotListItem` / `BotMetrics` interfaces), `RegisterBotPanel`, `PayoutsPanel`, `BotDeleteDialog`
  - **Admin**: `ReviewQueueTab`, `FinancePanel`, `PayPalConfigForm`, `PlatformFeeForm`
- Parent pages reduced: `AdvertiserPortal.tsx` 914 → 461 lines, `PublisherPortal.tsx` 627 → 271 lines, `AdminPortal.tsx` 699 → 317 lines.
- TypeScript compiles clean (`tsc --noEmit`), all 48 backend tests pass, Vite builds without errors.

### Bug fixes
- **Advertiser pagination shape** — `/advertiser/campaigns` returns `{ items, nextCursor, hasMore }` (not a plain array). `AdvertiserPortal.tsx` was calling `.map()` on the response object, crashing with `campRes.map is not a function`. Fixed: typed correctly, using `campRes.items ?? []`.
- **Publisher pagination shape** — same issue with `/publisher/bots`. `PublisherPortal.tsx` was storing the response object as the bot list. Fixed: using `botList.items ?? []`.
- **PayPal buttons not rendering** — `VITE_PAYPAL_CLIENT_ID` in `.env` was set to the literal placeholder string. Changed to `"test"` (PayPal sandbox magic value) so PayPal buttons render in the local dev environment without real credentials.

### Non-technical operator guide
- **New file** — `SETUP_GUIDE.md` at project root: plain-English setup guide for non-technical operators covering environment file configuration, Supabase/PayPal/Postgres account setup, PayPal sandbox-to-live switchover, webhook registration, admin portal first-time checklist, user roles, day-to-day operations, and developer handoff checklist.

## 2026-02-27 (Server hardening: observability, reliability, security, and monolith split)

### Observability
- **Structured JSON logger** — new `server/src/logger.js`. All server output is now newline-delimited JSON with level, timestamp, message, and serialized meta (Errors expand to `err` + `stack`). Respects `LOG_LEVEL` env var (default `info`). Writes info/debug to stdout, warn/error to stderr.
- **Request ID middleware** — every request gets a `req.id` (from `X-Request-Id` header or random UUID, max 64 chars) echoed back as `X-Request-Id`. All structured log lines include the request ID for tracing across services.
- **Request logging** — response finish hook logs `method`, `path`, `status`, and `ms` for every request.
- **Security response headers** — added `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` to all responses.

### Payment safety
- **PayPal capture idempotency** — `capturePayPalOrder` now sends `PayPal-Request-Id: capture-${orderId}` on the PayPal API call so PayPal deduplicates retried captures server-side. A second server-side guard checks for an existing `WalletTransaction` with the same `paypalOrderId` before crediting the wallet, returning the current balance early if already captured.
- **Payout double-submit guard** — `POST /api/payouts/withdraw` returns `409 Conflict` if the org already has a payout request in `pending` or `processing` status, preventing simultaneous withdrawal submissions.

### Architecture
- **Monolith split** — `server/src/index.js` was 2574 lines; it is now an 116-line thin orchestrator. All logic extracted into named modules:
  - `server/src/db.js` — singleton Prisma client
  - `server/src/config.js` — all env-var exports
  - `server/src/schemas.js` — all Zod validation schemas
  - `server/src/helpers.js` — crypto helpers, ad selection, `summarizeBotMetrics`
  - `server/src/seed.js` — workspace mock-data seeding
  - `server/src/paypal.js` — PayPal token, order, capture, and payout functions
  - `server/src/portal.js` — Supabase token verification, workspace resolution, all Express middleware
  - `server/src/security-utils.js` — `getBearerToken`, `secureEqual`, `verifyHmac`
  - `server/src/portal-roles.js` — role priority, compatibility, and mapping helpers
  - Route files: `health`, `auth`, `me`, `advertiser`, `wallet`, `publisher`, `payouts`, `admin`, `sdk`, `demo`, `leads`
- **Rate limiter circuit breaker** — Redis fallback now uses a 30-second cooldown (`nextExternalRetryAt`) instead of permanently disabling external rate limiting after a single failure. Allows automatic recovery when Redis comes back.

### Reliability
- **Cursor-based pagination** — `GET /api/advertiser/campaigns` and `GET /api/publisher/bots` now return `{ items, nextCursor, hasMore }` with `limit` (max 100) and `cursor` query params.
- **Soft-delete** — `Ad` and `PublisherBot` models gained `deletedAt DateTime?`. All list/fetch queries now filter `deletedAt: null`. Delete actions set `deletedAt + isActive: false` rather than hard-deleting rows. Admin ad reject and bot delete both use soft-delete. `DELETE /api/advertiser/campaigns/:id` endpoint added (was missing). Schema applied via `prisma db push`.

### Security
- **HMAC request signing for SDK calls** — `POST /api/ads` and `POST /api/track/:eventType` now support signed requests:
  - Client sends `X-Prism-Timestamp: <unix-seconds>` and `X-Prism-Signature: sha256=<hmac-hex>`.
  - Signed payload: `<timestamp>\n<raw-utf8-body>`.
  - Server verifies HMAC-SHA256 using the bearer token as the shared secret and rejects timestamps outside a ±5-minute window (replay protection).
  - Raw body is captured via `express.json({ verify })` before JSON parsing.
  - Controlled by `REQUIRE_SDK_HMAC=true` env var. When `false` (default), signature mismatches log a warning but do not block — enabling a gradual rollout.

### Environment variables added
- `LOG_LEVEL` (debug | info | warn | error, default `info`)
- `REQUIRE_SDK_HMAC` (`true` to enforce HMAC signing on SDK calls, default `false`)

## 2026-02-27 (Admin portal routing, PayPal DB-config, workspace visibility)

- **`/notadmin` is now the admin portal** — replaced the old legacy admin panel at that URL with the new `AdminPortal` component.
- **Admin route guard** — new `RequireAdminAccess` guard (`src/components/portal/PortalRouteGuards.tsx`): checks that the logged-in user has an admin workspace membership; does not require it to be the "selected" workspace, so `/notadmin` works as a direct URL without going through the workspace chooser.
- **Admin workspace hidden from workspace chooser** — `src/pages/ChooseWorkspace.tsx` filters out `role === "admin"` workspaces so regular users never see the admin option.
- **`/app/admin` redirects to `/notadmin`** for backwards compatibility.
- **PayPal credentials now configurable from admin console** — credentials are stored in the `platform_settings` DB table and read at runtime; no server restart required when updated:
  - New `getPayPalConfig()` async function reads `paypal_client_id`, `paypal_client_secret`, `paypal_mode` from DB, falling back to env vars.
  - New `PUT /api/admin/platform-settings/paypal` route saves credentials to DB (admin only).
  - `GET /api/admin/platform-settings` now returns `paypalClientIdMasked` (first 6 + last 4 chars) and `paypalFromDb` flag.
  - `AdminPortal` Settings tab — PayPal Gateway card replaced with a live editable form: Client ID, Client Secret (password input), Mode toggle (Sandbox / Live), connection status indicator.
- **PayPal env placeholders added** to `server/.env` and `.env` / `.env.example` files.
- **Admin bootstrap script** — `server/scripts/bootstrap-admin.js`: one-time script to grant a user admin access via the DB (`node scripts/bootstrap-admin.js your@email.com`).
- **Build**: `✓ built in 11.48s` — no errors.

## 2026-02-27 (PayPal payment gateway — advertiser top-up + publisher payouts + admin fee control)

- **Payment model**: Prism now has a real money pipeline: advertisers pay Prism, Prism pays publishers, Prism keeps a configurable platform fee.
- **Database schema** — new Prisma models pushed to DB:
  - `WalletTransaction` — records each advertiser top-up, spend, or refund with PayPal order reference.
  - `PayoutRequest` — records each publisher withdrawal request; tracks PayPal batch ID and status lifecycle (`pending → processing → paid / failed`).
  - `PlatformSettings` — key-value store for live admin-controlled settings; currently stores `platform_fee_pct`.
  - `Organization` — added `walletBalanceCents` (server-authoritative balance) and `paypalEmail` (publisher PayPal destination).
- **Server routes added** (`server/src/index.js`):
  - PayPal helpers: `getPayPalToken`, `createPayPalOrder`, `capturePayPalOrder`, `sendPayPalPayout` (all use native `fetch`, ESM).
  - `GET  /api/wallet/balance` — returns advertiser org wallet balance + last 20 transactions.
  - `POST /api/wallet/paypal/create-order` — creates a PayPal Orders v2 order, returns `orderID` to frontend.
  - `POST /api/wallet/paypal/capture-order` — captures approved order, credits `walletBalanceCents` via DB transaction.
  - `POST /api/wallet/spend` — deducts reserved campaign budget from wallet atomically.
  - `GET  /api/payouts/balance` — returns publisher gross earnings, paid-out total, and net available (after platform fee).
  - `PUT  /api/payouts/paypal-email` — saves publisher's PayPal email to their org record.
  - `POST /api/payouts/withdraw` — triggers PayPal Payouts API call (if configured) or queues pending request; deducts platform fee before sending.
  - `GET  /api/admin/platform-settings` — returns current fee rate and PayPal connection status.
  - `PUT  /api/admin/platform-settings/fee` — live-updates platform fee percentage (admin only).
  - `GET  /api/admin/wallet-transactions` — lists all advertiser top-ups (admin only).
  - `GET  /api/admin/payout-requests` — lists all publisher withdrawal requests (admin only).
  - `POST /api/admin/payout-requests/:id/process` — admin manually triggers PayPal payout for a pending request.
  - `PUT  /api/admin/payout-requests/:id/status` — admin manually marks a payout as paid/failed.
- **Environment variables** (add to `server/.env`):
  - `PAYPAL_CLIENT_ID` — from PayPal Developer Dashboard.
  - `PAYPAL_CLIENT_SECRET` — from PayPal Developer Dashboard.
  - `PAYPAL_MODE` — `sandbox` (default) or `live`.
  - `VITE_PAYPAL_CLIENT_ID` — same client ID, exposed to frontend (safe to expose).
- **PayPal account requirements**:
  - Receiving payments (Orders API v2): any PayPal Business account, no special approval.
  - Sending payouts (Payouts API): requires PayPal Payouts feature enabled on your business account. Request in Developer Dashboard → Sandbox (instant), Live (requires PayPal approval).
- **Frontend** — installed `@paypal/react-paypal-js ^9.0.0`:
  - `src/App.tsx` — wrapped with `PayPalScriptProvider` (uses `VITE_PAYPAL_CLIENT_ID`).
  - `src/pages/AdvertiserPortal.tsx`:
    - Replaced fake card-number form with real `PayPalButtons` component.
    - Wallet balance now loaded from server (`GET /api/wallet/balance`), not localStorage.
    - Campaign submission calls `POST /api/wallet/spend` to deduct budget from server wallet atomically.
    - Recent transaction history displayed in billing panel.
  - `src/pages/PublisherPortal.tsx`:
    - Added "Payouts" card in right sidebar showing: total earned, total paid, available (after fee).
    - Publisher enters their PayPal email (saved via `PUT /api/payouts/paypal-email`).
    - "Withdraw" button calls `POST /api/payouts/withdraw`; payout status updates shown in history.
  - `src/pages/AdminPortal.tsx` — full Finance section added:
    - PayPal gateway status card (Connected / Not configured, Sandbox / Live mode).
    - Platform fee editor — live input, save with one click; shows Prism % vs publisher %.
    - Platform revenue summary — total top-ups, total paid out, net platform revenue.
    - Payout requests panel with tabbed view (Payouts / Top-Ups):
      - Pending payouts show "Send via PayPal" and "Mark Paid" actions.
      - Processing/paid/failed payouts show status badges and PayPal batch IDs.
- **Build**: `✓ built in 11.31s` — no errors.
- **DB**: `npx prisma db push` applied schema successfully in 539ms.

## 2026-02-27 (Portal redesign: insights, 3-step wizard, publisher payout UX)

- **AdvertiserPortal** complete rewrite:
  - General insights BarChart (Impressions vs Clicks per campaign, 7d).
  - `StepIndicator` for 3-step campaign wizard: Info → Creative Preview → Budget & Launch.
  - Step 3: `dailyBudget × durationDays = total commitment` model replaces confusing lifetime input.
  - Per-campaign: 6 labeled stat boxes (Impressions, Clicks, CTR, Spend, Conv., Weight).
  - Billing panel always visible on dashboard.
- **PublisherPortal** complete rewrite:
  - General insights BarChart (Requests 7d + Revenue per bot).
  - 4 primary + 4 secondary metric boxes per bot.
  - `AlertDialog` replacing `window.confirm` for destructive delete.
  - "Rotate Key" label (was "Rotate (Invalidate Old)").
- **AppLogin**: standalone centered auth page, labels, forgot password flow (`supabase.auth.resetPasswordForEmail`).
- **ChooseWorkspace**: removed duplicate back button and "Demand Side"/"Supply Side" jargon.
- **Demo**: scenario context card (Alex's evening plan), dark slate ad cards, horizontal How It Works grid.
- **Docs**: sticky section nav, numbered `SectionHeader`, `CodeBlock` component, visual Portal Guide, Troubleshooting accordion.
- Build: `✓ built in 7.32s`.

## 2026-02-27 (Boot-time startup runbook)

- Operations:
  - diagnosed reboot startup failure as missing `systemd` units for the Prism app stack.
  - added `deploy/systemd/` unit templates for API, web, tunnel, and a grouping target.
- Docs:
  - documented the reboot/startup gap and linked install steps from `docs/README.md`.

## 2026-02-27 (Prism brand assets + favicon refresh)

- Branding:
  - finalized product naming around `Prism` across docs, SDK references, metadata, and site copy.
  - replaced the shared robot logo in the navbar and footer with the local Prism brand mark.
- Assets:
  - added `public/prismlogo.png` as the shared visible logo asset.
  - added `public/prismlogo.svg` as a local SVG wrapper for favicon/browser support.
  - regenerated `public/favicon.ico` from the Prism logo and wired the document head to use it first.
- Documentation:
  - updated docs titles and examples to remove leftover legacy naming such as `AI Flow Network` and `botGrid`.

## 2026-02-27 (Homepage shell polish + button system cleanup)

- Homepage CTA:
  - applied a local SVG background asset to the `Validate your chatbot ad strategy in minutes.` section.
  - standardized CTA pairing to blue primary + black secondary.
- Navbar:
  - reduced top-level CTA set to two buttons: `Demo` and `Login` / `Open App`.
  - remapped navbar CTA usage to the simplified button system.
- Footer:
  - removed card-style container in favor of a full-width footer section.
  - added centered `PRISM` watermark in the footer background.
  - improved footer section-heading contrast and typography.
- Button system:
  - simplified app-facing naming to two variants:
    - `primary` = blue gradient main action
    - `secondary` = black background, white text
  - removed temporary naming churn from app usage so buttons now follow the same two-style convention across the site shell and portal surfaces.

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
  - removed non-production default fallbacks for `PRISM_API_KEY` and `ADMIN_API_KEY`.
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
  - removed `VITE_PRISM_API_KEY` and `VITE_ADMIN_KEY` usage from frontend runtime/env templates.
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
  - production requires secure key envs (`PRISM_API_KEY`, `ADMIN_API_KEY`)
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

- Replaced demo page mock ad provider with real SDK runtime calls (`@prism/sdk`) against local API routes.
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
  - local alias mapping for `@prism/sdk` and `@prism/sdk/react`
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
