# CHANGELOG

This file tracks the website evolution from the first major redesign pass to the current state.

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

## Current Known Notes
- Build is passing.
- Lint has existing warning-only entries in shared UI/sdk files (`react-refresh/only-export-components`), no blocking errors.
