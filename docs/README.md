# Prism Docs

This folder is the source of truth for project context, architecture, and operational setup.

## Current Product Snapshot

The website is now a multi-page marketing/product experience with:

- Home (`/`)
- Product (`/product`)
- Publishers (`/publishers`)
- Advertisers (`/advertisers`)
- How It Works + Demo (`/demo`)
- Legacy SDK URL redirect (`/sdk` -> `/demo`)
- Company (`/company`)
- Contact (`/contact`)
- Website Docs (`/docs`)
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
- Demo CTA buttons ("Shop Nike Air Force 1", "Reserve a Table", "Order Flowers") route to `/contact` with source metadata.

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
- Local API (`:8787`)
- Vite (`:8080`)
- Cloudflare tunnel

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

## Supabase + Production Env Checklist

Frontend (`.env` in web app):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Backend (`server/.env`):
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `API_CORS_ORIGIN` with all allowed origins, for example:
  - `https://prismpublication.com,https://www.prismpublication.com,http://localhost:8080`

Supabase Auth dashboard:
- Set **Site URL** to production domain.
- Add **Redirect URLs** for production (`www` + apex) and localhost development.

## Security Baseline

- Local credential files (`.env`, `server/.env`) are intentionally not tracked.
- Use `.env.example` and `server/.env.example` as templates.
- API startup requires both `PRISM_API_KEY` and `ADMIN_API_KEY`.
- Portal API calls are expected to include Supabase bearer session tokens for authenticated workspace routes.
- `GET /api/leads` is admin-key protected (same key family as other admin endpoints).
- Browser-bundled `VITE_*` vars must not contain `PRISM_API_KEY` or `ADMIN_API_KEY`.
- `/api/demo/*` endpoints are rate-limited and are intended only for scripted public demo playback.
- Distributed rate limiting is supported via optional `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in `server/.env`.
- SDK keys created by bot developers are scoped to their bot `botId` for `/api/ads` and `/api/track/:eventType`.

## Documentation Map

- [CHANGELOG.md](/home/tokyo/Desktop/AIADS/docs/CHANGELOG.md): Evolution log and verification checklist
- [LOCAL_DATABASE.md](/home/tokyo/Desktop/AIADS/docs/LOCAL_DATABASE.md): Local Postgres + Prisma setup
- [DEEP_DIVE.md](/home/tokyo/Desktop/AIADS/docs/DEEP_DIVE.md): Technical deep-dive
- [INTEGRATION_EXAMPLES.md](/home/tokyo/Desktop/AIADS/docs/INTEGRATION_EXAMPLES.md): SDK/integration examples
- [BUSINESS_IDEA.md](/home/tokyo/Desktop/AIADS/docs/BUSINESS_IDEA.md): Product/business framing

## Notes

- Build is passing.
- Lint has existing warning-only entries in shared UI/sdk files (`react-refresh/only-export-components`).
