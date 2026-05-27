# Prism Docs

This folder is the source of truth for project context, architecture, and operational setup.

## Current Product Snapshot

The website is now a multi-page marketing/product experience with:

- Home (`/`)
- Product (`/product`)
- Use Cases (`/use-cases`)
- Publishers (`/publishers`)
- Advertisers (`/advertisers`)
- How It Works + Demo (`/demo`)
- Legacy SDK URL redirect (`/sdk` -> `/demo`)
- Company (`/company`)
- Contact (`/contact`)
- Website Docs (`/docs`)
- Ad Policy (`/ad-policy`)
- Admin (`/notadmin`, key-protected)
- App Login (`/app/login`)
- Workspace Selector (`/app/choose-workspace`)
- Advertiser App (`/app/advertiser`)
- Bot Developer App (`/app/publisher`)
- Admin App (`/app/admin`)
- Blog (`/blog`) and article pages (`/blog/:slug`)

Demo page notes:
- `/demo` now combines "How It Works", SDK quickstart snippets, and live conversation playback in one page.
- Demo playback uses a scripted sponsored sequence with local creative assets in `public/demo-ads/`.
- Demo CTA buttons route to `/contact` with source metadata.

Ad Policy notes:
- `/ad-policy` has 5 sections: Prohibited Categories, Restricted Categories (case-by-case), Creative Requirements, Enforcement Process, Reporting.
- Gambling is in the "Restricted" tier — allowed case-by-case with valid licensing, US state-level legality, and local-law compliance for international markets.
- Illegal/unlicensed gambling operations remain in the fully prohibited list.

Homepage / shell notes:
- Shared brand mark now uses `public/prismlogo.png` in the navbar and footer.
- Browser favicon now resolves to `public/favicon.ico`, generated from the Prism logo, with `public/prismlogo.svg` kept as an SVG fallback.
- The homepage CTA section now uses a local SVG background asset at `public/login-assets/pattern.svg`.
- Navbar CTAs are standardized to two app-facing button styles:
  - `primary`: blue gradient main action
  - `secondary`: black background with white text
- Footer is now a full-width section instead of a card, with a centered `PRISM` watermark in the background.

## Tech Stack

- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind + shadcn/ui + Lucide icons
- Routing: React Router
- Data Layer (current): Supabase client remains active for auth/session
- Local DB option (added): PostgreSQL + Prisma + Node API (`server/`)

## Database Status

Supabase was **not removed**.

- Existing frontend Supabase integration remains in `src/integrations/supabase`.
- Login credentials are stored in Supabase Auth (database-backed, not hardcoded in code/docs).
- Local-first DB foundation was added in parallel for future scalability.
- Unified app login uses Supabase auth + backend entry-context APIs.
- You can migrate incrementally endpoint-by-endpoint without breaking current frontend behavior.

See: [LOCAL_DATABASE.md](/home/tokyo/Desktop/AIADS/docs/LOCAL_DATABASE.md)

## SEO/Indexing Status

- Sitemap exists at `public/sitemap.xml`
- Robots references sitemap in `public/robots.txt`
- Blog/article routes are included in sitemap
- Admin route is intentionally excluded from sitemap

## Project Commands

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:server
```

CI (GitHub Actions) runs the same validation stack on push/PR:
- `npm run lint`
- `npm run test`
- `npm run test:server`
- `npm run build`

### Local DB + API (new)

```bash
npm run db:up
npm run db:migrate
npm run db:seed
npm run api:dev
npm run db:down
```

### Full local stack (background)

```bash
./scripts/prism_stack.sh start
./scripts/prism_stack.sh status
./scripts/prism_stack.sh logs
./scripts/prism_stack.sh stop
```

This now starts:
- Local API (`:8080`)
- Vite (`:5173`)
- Cloudflare tunnel

### Start on reboot (`systemd`)

The background stack script above does not auto-run after a machine reboot by itself. It only starts processes when you invoke it manually.

For boot-time startup, install the unit templates in [`deploy/systemd/README.md`](/home/tokyo/Desktop/AIADS/deploy/systemd/README.md).

On the current host, the enabled boot services are unrelated `cloudflared` units; there is no installed `aiads` or `prism-aiads` app service yet.

## First-Run App Flow

There are no hardcoded portal test credentials now.

Use `/app/login` and:
- Create a new account.
- On first login, choose Advertiser or Bot Developer.
- The selected role creates the first workspace automatically.
- Admin workspaces are platform-operator only and are not exposed in the first-run UI.
- Advertiser portal can create campaigns and move them between Review/Live states.
- Bot Developer portal can register bots, rotate SDK keys, and delete bots.
- Dashboard pages load DB-backed records through real API endpoints.

## Persona Quick Start

### Advertiser

1. Go to `/app/advertiser`.
2. Use **Create New Ad** to open the 3-step modal flow.
3. Step 1 captures ad details, weight, budget, and optional image upload/drag-drop preview media.
4. Step 2 shows a live creative preview.
5. Step 3 collects payment details, lets you top up wallet funds, and submits for review.
6. Use **Go Live / Move to Review** and **Edit** on campaign cards to manage delivery.

### Bot Developer

1. Go to `/app/publisher`.
2. Use **Add Bot** to register a bot/environment.
3. An initial SDK key is created immediately (full token shown once).
4. Use **Rotate (Invalidate Old)** per bot to rotate keys. Rotation revokes the previous active key.
5. Use **Copy New Key** right after rotation/creation. Old full tokens are never re-shown.
6. Integrate with:
   - `Authorization: Bearer <sdk-key>`
   - `botId` value shown in portal bot list
   - `POST /api/ads` + `POST /api/track/:eventType`

#### HMAC request signing (required in production)

HMAC signing is **on by default**. Each SDK request must include two additional headers (set `REQUIRE_SDK_HMAC=false` only during a migration window):

```
X-Prism-Timestamp: <unix-seconds>        # e.g. Math.floor(Date.now() / 1000)
X-Prism-Signature: sha256=<hex>          # HMAC-SHA256 signature
```

The signature covers `<timestamp>\n<raw-utf8-body>` using the raw SDK key as the HMAC secret:

```js
import crypto from "node:crypto";

const timestamp = String(Math.floor(Date.now() / 1000));
const body = JSON.stringify(payload);
const sig = crypto
  .createHmac("sha256", sdkKey)
  .update(`${timestamp}\n${body}`)
  .digest("hex");

fetch("/api/ads", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${sdkKey}`,
    "Content-Type": "application/json",
    "X-Prism-Timestamp": timestamp,
    "X-Prism-Signature": `sha256=${sig}`,
  },
  body,
});
```

The server rejects signatures with a timestamp outside ±5 minutes (replay protection).

## Supabase + Production Env Checklist

Frontend (`.env` in web app):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Backend (`server/.env`):
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `API_CORS_ORIGIN` with all allowed origins, for example:
  - `https://prismpublication.com,https://www.prismpublication.com,http://localhost:5173`

Supabase Auth dashboard:
- Set **Site URL** to production domain.
- Add **Redirect URLs** for production (`www` + apex) and localhost development.

## Production Deployment Checklist

Before accepting real money or real users, verify every item below.

### HMAC SDK signing
- `REQUIRE_SDK_HMAC` defaults to **`true`** — do **not** set it to `false` in production.
- If you need a migration window (old SDK clients that don't sign yet), set `REQUIRE_SDK_HMAC=false` temporarily and watch the warning logs for `hmac-missing` / `hmac-invalid` entries. Re-enable once all clients are updated.
- The signing algorithm is documented in the [Bot Developer quick start](#bot-developer) section below.

### API keys
- Rotate `PRISM_API_KEY` and `ADMIN_API_KEY` before go-live. Use at least 32 bytes of random hex (`openssl rand -hex 32`).
- Never commit actual key values. Use `server/.env.example` as the template and keep `server/.env` out of version control.

### PayPal
- Set `PAYPAL_MODE=live` and supply live credentials via the Admin portal (Settings → PayPal Configuration).
- Register the webhook endpoint in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) → Apps → Webhooks:
  - URL: `https://<your-domain>/api/webhooks/paypal`
  - Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REVERSED`, `PAYOUT_ITEM.SUCCEEDED`, `PAYOUT_ITEM.FAILED`
- Copy the **Webhook ID** from the dashboard into `server/.env` as `PAYPAL_WEBHOOK_ID`.

### Supabase
- Enable Row Level Security (RLS) on all Supabase tables.
- Set **Site URL** and **Redirect URLs** to production domains in the Supabase Auth dashboard.

### Database
- Run `prisma migrate deploy` (not `dev`) in production to apply migrations without interactive prompts.
- Ensure automated backups are configured on your Postgres host.

## Security Baseline

- Local credential files (`.env`, `server/.env`) are intentionally not tracked.
- Use `.env.example` and `server/.env.example` as templates.
- API startup requires both `PRISM_API_KEY` and `ADMIN_API_KEY`.
- Portal API calls are expected to include Supabase bearer session tokens for authenticated workspace routes.
- `GET /api/leads` is admin-key protected (same key family as other admin endpoints).
- Browser-bundled `VITE_*` vars must not contain `PRISM_API_KEY` or `ADMIN_API_KEY`.
- `/api/demo/*` endpoints are rate-limited and are intended only for scripted public demo playback.
- Distributed rate limiting is supported via optional `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in `server/.env`. Rate limiter uses a 30-second circuit-breaker cooldown so recovery is automatic if Redis goes down.
- SDK keys created by bot developers are scoped to their bot `botId` for `/api/ads` and `/api/track/:eventType`.
- All responses include `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` headers.
- Every request gets a unique `X-Request-Id` (from client header or server-generated UUID) for end-to-end tracing.
- **SDK HMAC request signing** — HMAC enforcement is **on by default**. SDK clients must sign every request with `X-Prism-Timestamp` + `X-Prism-Signature: sha256=<hmac>`. Set `REQUIRE_SDK_HMAC=false` only during a migration window; mismatches log a warning instead of rejecting. See [Bot Developer quick start](#bot-developer) for the signing algorithm.

## Portal Frontend Structure

The three portal page files are thin orchestrators. All visual blocks live in extracted components under:

```
src/components/portal/
├── ChartTooltip.tsx                     # Shared recharts tooltip
├── advertiser/
│   ├── AdvertiserSummaryMetrics.tsx     # 5 KPI cards row
│   ├── CampaignPerformanceChart.tsx     # 7-day bar chart
│   ├── CampaignList.tsx                 # Campaign cards with actions
│   ├── BillingPanel.tsx                 # Wallet balance + PayPal top-up + history
│   ├── CreateCampaignWizard.tsx         # 3-step creation modal
│   └── EditCampaignModal.tsx            # Edit campaign modal
├── publisher/
│   ├── PublisherSummaryMetrics.tsx      # 4 KPI cards row
│   ├── BotPerformanceChart.tsx          # Bar chart by bot
│   ├── BotRegistry.tsx                  # Bot list with keys/actions (exports BotListItem, BotMetrics)
│   ├── RegisterBotPanel.tsx             # Add bot form + token reveal
│   ├── PayoutsPanel.tsx                 # Earnings + PayPal email + withdraw
│   └── BotDeleteDialog.tsx              # AlertDialog confirmation wrapper
└── admin/
    ├── ReviewQueueTab.tsx               # Pending + live ads with approve/reject
    ├── FinancePanel.tsx                 # Payouts + top-ups sub-tabs
    ├── PayPalConfigForm.tsx             # PayPal credentials form
    └── PlatformFeeForm.tsx              # Platform fee % form
```

All data fetching and state management stays in the parent pages (`AdvertiserPortal.tsx`, `PublisherPortal.tsx`, `AdminPortal.tsx`). Components receive everything via props.

## Documentation Map

- [CHANGELOG.md](/home/tokyo/Desktop/AIADS/CHANGELOG.md): Release summary (root)
- [docs/CHANGELOG.md](/home/tokyo/Desktop/AIADS/docs/CHANGELOG.md): Detailed evolution log and verification checklist
- [LOCAL_DATABASE.md](/home/tokyo/Desktop/AIADS/docs/LOCAL_DATABASE.md): Local Postgres + Prisma setup
- [DEEP_DIVE.md](/home/tokyo/Desktop/AIADS/docs/DEEP_DIVE.md): Technical deep-dive
- [INTEGRATION_EXAMPLES.md](/home/tokyo/Desktop/AIADS/docs/INTEGRATION_EXAMPLES.md): SDK/integration examples
- [BUSINESS_IDEA.md](/home/tokyo/Desktop/AIADS/docs/BUSINESS_IDEA.md): Product/business framing
- [SETUP_GUIDE.md](/home/tokyo/Desktop/AIADS/SETUP_GUIDE.md): Non-technical operator setup and handoff guide

## Notes

- Build is passing.
- Lint has existing warning-only entries in shared UI/sdk files (`react-refresh/only-export-components`).
