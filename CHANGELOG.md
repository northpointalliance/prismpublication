# Changelog

## 2026-07-05 — Vercel deployment fix for SDK build pipeline

### What was failing
- Vercel deployments were failing during the build step after pushes to main.
- The frontend depends on the SDK bundle at [packages/sdk/dist/index.mjs](packages/sdk/dist/index.mjs) and [packages/sdk/dist/react.mjs](packages/sdk/dist/react.mjs), but a fresh Vercel clone does not have that dist folder unless it is generated during the build.
- Earlier deployments had been succeeding only because the last local build had left the SDK artifacts on disk; the clean build environment did not.
- The first SDK build failure was a native esbuild binary issue in the packaging step, which surfaced as "no runnable esbuild binary was found" and later as an esbuild platform mismatch during local verification.

### What was fixed
- Added a root build step so Vercel runs the SDK build before the Vite frontend build: `npm --prefix packages/sdk ci && npm --prefix packages/sdk run build`.
- Updated the root build script to run that prebuild step automatically before `vite build`.
- Added the required build dependency at the repo root and adjusted the SDK build script so the package can be built reliably in the Vercel environment.
- Verified the SDK package builds locally before pushing the fix to main.

### Deployment note for handoff
- If the SDK source changes, the deployment pipeline now rebuilds the SDK automatically on Vercel. Do not assume the dist files are already present in the repo checkout.

## 0.4.0 — 2026-06-26

### Advertiser portal — clarity pass
- **CampaignGuideTab:** added Creative Specs table (exact character limits from validation schema), Delivery Mechanics section (weight-based selection, no auction), Brand Safety section (block adjacency, category filters explained), Fraud & Quality section (dedup, bot vetting, credit recourse), Support & Legal section (contact, DPA on request, pilot/enterprise path, reach estimates, SDK go-live timing). Step 4 now states 1-business-day review SLA. Sidebar nav updated.
- **BillingPanel:** added Billing Terms block — minimum top-up ($1), USD only, PayPal only, refund policy, VAT/GST note, chargeback policy, enterprise billing path.
- **AdPolicy:** added Review Timeline section (1-business-day SLA, what gets checked, what happens on rejection). Added to sticky nav.
- **CreateCampaignWizard:** inline character limits on every field (enforced via maxLength), HTTPS label on URL field, CPM prices shown in format dropdown, targeting help text explaining how topics map to publisher bots, weight field description clarified (no bidding).

### SEO / AEO / GEO — FAQ rewrite
- Replaced 6 vague FAQ items with 12 specific, self-contained questions covering: what Prism is, how to integrate, publisher earnings, supported stacks, integration time, UX impact, ad targeting, format pricing, minimum budget, fraud protection, enterprise/private bots, and the AdSense analogy.
- All three FAQ surfaces updated in sync: `FAQSection.tsx` (rendered UI), `FAQPage` JSON-LD block in `index.html`, and the hidden `#static-seo` static HTML section.

### Build pipeline fix
- **Root cause:** `packages/sdk/dist/` is gitignored, so Vercel's clean build environment never had the compiled SDK. `vite.config.ts` aliases point to `packages/sdk/dist/index.mjs` and `packages/sdk/dist/react.mjs`, causing every Vercel build to fail at the Vite step. The site had been running on the last deployment from when the developer was active locally.
- **Fix:** added `prebuild:sdk` script to root `package.json` (`npm --prefix packages/sdk ci && npm --prefix packages/sdk run build`). Updated `build` script to run `prebuild:sdk` before `vite build`. SDK source code untouched.

### ScrollVideoSection — "Now Live" overlay (and JSX breakage)
- The original hero video had "Launching Soon" text baked into the video file itself. To update this without re-editing the video, a "Now Live" text overlay div was added in `ScrollVideoSection.tsx` to visually cover the baked-in text. A separate animated "Now Live" badge (green dot + label) was also added as a second overlay.
- During this manual edit a closing `</div>` tag was accidentally dropped, creating a JSX tag mismatch that failed the Vite build (`Unexpected closing "section" tag does not match opening "div" tag`). Fixed by restoring the missing `</div>` after the button element.
- Note for future: the cleanest long-term fix is to replace the video file itself with one that has no baked-in text, removing the need for CSS overlays entirely.

## 0.3.1 — 2026-03-20

### Changed
- **Ad policy:** moved gambling from fully prohibited to a new "Restricted Categories" section with case-by-case review — requires valid licensing, US state-level legality for chatbot publishers, and compliance with local laws for international markets
- **Sitemap:** added missing `/contact` and `/ad-policy` pages, removed `/sdk` redirect, updated all `lastmod` dates
- **Typography:** bumped body text from `text-sm` to `text-base` across landing page sections (Hero, HowItWorks, Stats, Audience, FAQ, Footer) and inner pages for improved readability
- **Demo page:** replaced Nike Air Force 1 asset with generic sneakers image, updated ad copy

## 0.3.0 — 2026-02-26

TypeScript backend, Sentry, BullMQ, tests, CI pipeline.

## 0.2.0 — 2026-02-20

Blog system, ad policy page, page redesigns, portal docs tabs.

## 0.1.2 — 2026-02-15

Branding cleanup.

## 0.1.1 — 2026-02-14

Remove legacy botGrid naming from public code examples, clarify copyright.

## 0.1.0 — 2026-02-13

Initial release — seed data removed, docs updated.
