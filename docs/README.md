# AI Flow Network Docs

This folder is the source of truth for project context, architecture, and operational setup.

## Current Product Snapshot

The website is now a multi-page marketing/product experience with:

- Home (`/`)
- Product (`/product`)
- Publishers (`/publishers`)
- Advertisers (`/advertisers`)
- How It Works / SDK (`/sdk`)
- Company (`/company`)
- Demo (`/demo`)
- Website Docs (`/docs`)
- Admin (`/admin`, key-protected)
- App Login (`/app/login`)
- Workspace Selector (`/app/choose-workspace`)
- Advertiser App (`/app/advertiser`)
- Bot Developer App (`/app/publisher`)
- Admin App (`/app/admin`)
- Blog (`/blog`) and article pages (`/blog/:slug`)

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
- Dashboard pages load mock records through real API endpoints backed by database rows.

## Security Baseline

- Local credential files (`.env`, `server/.env`) are intentionally not tracked.
- Use `.env.example` and `server/.env.example` as templates.
- Portal API calls are expected to include Supabase bearer session tokens for authenticated workspace routes.
- `GET /api/leads` is admin-key protected (same key family as other admin endpoints).
- Browser-bundled `VITE_*` vars must not contain `BOTGRID_API_KEY` or `ADMIN_API_KEY`.
- `/api/demo/*` endpoints are rate-limited and are intended only for scripted public demo playback.

## Documentation Map

- [CHANGELOG.md](/home/tokyo/Desktop/AIADS/docs/CHANGELOG.md): Evolution log and verification checklist
- [LOCAL_DATABASE.md](/home/tokyo/Desktop/AIADS/docs/LOCAL_DATABASE.md): Local Postgres + Prisma setup
- [DEEP_DIVE.md](/home/tokyo/Desktop/AIADS/docs/DEEP_DIVE.md): Technical deep-dive
- [INTEGRATION_EXAMPLES.md](/home/tokyo/Desktop/AIADS/docs/INTEGRATION_EXAMPLES.md): SDK/integration examples
- [BUSINESS_IDEA.md](/home/tokyo/Desktop/AIADS/docs/BUSINESS_IDEA.md): Product/business framing

## Notes

- Build is passing.
- Lint has existing warning-only entries in shared UI/sdk files (`react-refresh/only-export-components`).
