# AI Flow Network Docs

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
- Admin (`/admin`, key-protected)
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
- On first login, choose Advertiser, Bot Developer, or Admin.
- The selected role creates the first workspace automatically.
- Admin workspace creation requires `ADMIN_API_KEY` and is intended for platform operators.
- Advertiser portal can create campaigns and move them between Review/Live states.
- Bot Developer portal can register bots and generate/rotate SDK keys (token shown once at creation).
- Dashboard pages load DB-backed records through real API endpoints.

## Persona Quick Start

### Advertiser

1. Go to `/app/advertiser`.
2. Use **Create Campaign** to add title/description/CTA/click URL/format/topics/weight.
3. Campaigns are created in **Review** by default.
4. Use **Go Live / Move to Review** actions in campaign cards to control active state.

### Bot Developer

1. Go to `/app/publisher`.
2. Use **Add Bot** to register a bot/environment.
3. An initial SDK key is created immediately (full token shown once).
4. Use **New SDK Key** per bot for rotation.
5. Integrate with:
   - `Authorization: Bearer <sdk-key>`
   - `botId` value shown in portal bot list
   - `POST /api/ads` + `POST /api/track/:eventType`

## Security Baseline

- Local credential files (`.env`, `server/.env`) are intentionally not tracked.
- Use `.env.example` and `server/.env.example` as templates.
- API startup requires both `BOTGRID_API_KEY` and `ADMIN_API_KEY`.
- Portal API calls are expected to include Supabase bearer session tokens for authenticated workspace routes.
- `GET /api/leads` is admin-key protected (same key family as other admin endpoints).
- Browser-bundled `VITE_*` vars must not contain `BOTGRID_API_KEY` or `ADMIN_API_KEY`.
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
