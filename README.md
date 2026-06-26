# Prism (AIADS)

An ad marketplace connecting **advertisers**, **publishers / bot-developers**, and **admins** — a public
marketing site plus a private 3-portal app, for serving ads inside AI chatbots.

> **Status: LIVE.** Frontend on **Vercel** at **https://prismpublication.com**, backend fully on **Supabase**.

## Stack
| Layer | Tech | Where |
|---|---|---|
| Frontend | Vite + React + Tailwind/shadcn, Supabase Auth | static SPA on **Vercel** (`prismpublication.com`) |
| Backend API | Deno + Hono + postgres.js | **Supabase Edge Functions** (`supabase/functions/api`) |
| Database | Supabase Postgres 17 | project `botnabfogcjrkpmdjgpr` (eu-west-2) |
| Queue | pgmq + pg_cron | same project (`supabase/functions/queue-worker`) |
| Storage | Supabase Storage (`blog-images`) | same project |
| Auth | Supabase Auth | — |
| Payments | PayPal (REST) | creds in `platform_settings` table |

## Start here
| You want to… | Read |
|---|---|
| **Operate / understand the whole system** | **[HANDOVER.md](HANDOVER.md)** ← start here |
| Fix something / day-2 operations | **[docs/RUNBOOK.md](docs/RUNBOOK.md)** |
| See the architecture in depth | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Deploy / redeploy the frontend | [docs/FRONTEND_DEPLOY.md](docs/FRONTEND_DEPLOY.md) |
| How auto-deploy (CI/CD) works | [docs/CI_CD.md](docs/CI_CD.md) |
| Supabase project & credentials | [docs/SUPABASE_CONNECTION.md](docs/SUPABASE_CONNECTION.md) |
| Operate as a non-technical admin | [SETUP_GUIDE.md](SETUP_GUIDE.md) |
| Browse all docs | [docs/README.md](docs/README.md) |

## How deploys work
A single `git push` to `main` on **`github.com/northpointalliance/test1`** deploys everything:
- **Vercel** (Git integration) rebuilds + deploys the **frontend** automatically.
- A **GitHub Action** deploys the **Supabase Edge Functions** (once the `SUPABASE_ACCESS_TOKEN` repo secret is set).

> ⚠️ Vercel is on the **Hobby** plan, which only deploys commits whose author is the account owner. This
> repo is therefore configured to author commits as **`northpointalliance`** — keep it that way (see
> [docs/CI_CD.md](docs/CI_CD.md)) or upgrade Vercel to Pro.

## Changelog

### Advertiser experience improvements — June 2026

Addressed a set of gaps in what the advertiser-facing UI and portal communicated. The platform had the underlying functionality but didn't explain it clearly enough for an advertiser to understand what they were buying or how it worked. Changes made across four files:

**`src/components/portal/advertiser/CampaignGuideTab.tsx`**

- **Moderation timeline** — Step 4 ("Submit for review") now states the 1-business-day SLA explicitly, rather than the vague "our team checks compliance."
- **Creative Specs table** — Added a new "Creative Specs" section with a table of exact character limits and image requirements pulled from the platform's validation schema (title: 4–140 chars, description: 8–400, CTA: 2–60, image URLs: HTTPS + recommended dimensions per format). Advertisers previously had no way to know these limits before submitting.
- **Delivery Mechanics section** — Added a new section explaining weight-based selection (no auction, no bidding), how the daily cap works, what triggers an impression vs. a click, and why ads can't currently target specific publisher bots by name.
- **Brand Safety section** — Added a new section explaining what block adjacency and category filters actually do: how publishers declare content categories at bot registration, how advertisers can block specific categories, and how allowlists differ from blocklists.
- **Fraud & Quality section** — Added a new section covering server-side deduplication, bot traffic filtering, anomalous-rate flagging, and the credit recourse process for verified invalid traffic.
- **Support & Legal section** — Added a new section covering: support email and response SLA, DPA availability (signed on request), how to request a pilot or volume deal, how to get inventory/reach estimates by topic, and how quickly ads go live after a publisher integrates the SDK.
- **Sidebar nav** — Updated to include all new sections.

**`src/components/portal/advertiser/BillingPanel.tsx`**

- **Billing Terms block** — Added a grid of billing terms below the transaction history: minimum top-up ($1), USD-only currency, PayPal-only payment method, how to get formal invoices, refund policy (unspent budget returns to wallet; wallet balance is non-refundable to PayPal), VAT/GST handling, chargeback policy, and enterprise billing availability. None of this was visible to advertisers before.

**`src/pages/AdPolicy.tsx`**

- **Review Timeline section** — Added a new section between Enforcement and Reporting that covers: the 1-business-day review SLA, exactly what the review team checks (creative specs, URL resolution, policy violations, misleading claims, landing page match), and what happens on rejection (written reason, resubmit queue, account review on repeated violations). The enforcement process was documented but the operational timing was not.
- **Nav updated** — "Review Timeline" added to the sticky section nav.

**`src/components/portal/advertiser/CreateCampaignWizard.tsx`**

- **Inline character limits** — Every text field now shows its limit in the label (title: max 140, description: max 400, CTA: max 60) and enforces it via `maxLength`. Previously there were no visible limits and submissions could fail silently.
- **HTTPS label** — Destination URL field now shows "HTTPS required" in the label.
- **CPM prices in format picker** — Format dropdown options now include the CPM rate (Card $20, Text $10, Banner $15) so advertisers see pricing at the point of selection.
- **Targeting help text** — Added a sub-label under the topics field explaining that topics are matched against publisher bots' declared content categories, with guidance on specificity (3–5 keywords, each max 60 chars).
- **Weight field description** — Updated to clarify there is no auction — higher weight means higher probability of serving when multiple campaigns match, not a bid price.

## Develop
```bash
npm install
npm run dev      # frontend (Vite) on http://localhost:5173
npm run build    # production build -> dist/

# Backend (Supabase Edge Functions)
~/.deno/bin/deno check --config supabase/functions/deno.json supabase/functions/api/index.ts   # typecheck
supabase functions deploy api                                                                  # deploy
```

> `server/` is the **legacy Express backend** (pre-migration), kept for reference only — it is **no longer
> running**. All backend work happens in `supabase/functions/`. See [HANDOVER.md](HANDOVER.md).
