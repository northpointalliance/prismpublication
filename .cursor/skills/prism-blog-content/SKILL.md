---
name: prism-blog-content
description: Write and publish SEO/AEO/GEO-optimized Prism blog articles for the admin panel. Use when drafting blog posts, content calendar items, publisher monetization articles, contextual advertising content, LLM API cost topics, or when the user asks for 2x/week organic traffic content for health, wellness, travel, or personal B2C chatbot ICPs.
---

# Prism Blog Content

Write articles that drive organic traffic from Google and get cited by AI search (ChatGPT, Claude, Perplexity). Every post targets **chatbot publishers** building personal B2C bots in **health/wellness**, **travel**, or **lifestyle** verticals.

## Admin panel publish flow

Articles live in Postgres `blog_posts` and are managed at **Admin portal → Blog** (`/notadmin`, Blog tab).

| Admin field | Draft file header | Rules |
|---|---|---|
| Title | `# Title` (H1 in draft header only; body uses `##` H2s) | Clear, search-intent match, under 200 chars |
| Slug | `**Slug:**` | Lowercase, hyphenated, primary keyword |
| Excerpt | `**Excerpt:**` | 140–160 chars ideal; doubles as listing blurb |
| Category | `**Category:**` | `Publishers`, `Monetization`, `Industry`, or vertical (`Wellness`, `Travel`) |
| Reading time | `**Reading time:**` | Estimate at 200 wpm |
| Body | Markdown below `---` | Paste into "Article body (Markdown)" field |
| Cover image | Upload in admin after save | JPEG/PNG/WebP, under 5 MB |

**Publish steps:** New Post → fill fields → Save → upload cover → Publish toggle.

Public URL: `https://prismpublication.com/blog/{slug}`

## Content pillars (rotate 2x/week)

1. **API burn / unit economics** — inference cost per message, free-tier math, subscription conversion gaps
2. **Contextual monetization** — partner integrations at the right moment, trust-safe ad formats, vertical CPM logic
3. **Vertical ICP depth** — wellness coaches, travel planners, personal lifestyle assistants (real user scenarios)

Alternate pillars week to week. Do not publish two generic "what is contextual advertising" posts back to back.

## SEO / AEO / GEO rules

### Structure (Gold Plan)
- **2,000–2,900+ words** when possible (minimum 1,200 for a publishable draft)
- **Question-based H2s** only (e.g. `## How much does a wellness chatbot cost per user?`)
- Each section: **2–3 sentence direct answer** → supporting detail → **TL;DR** one-liner → internal link where relevant
- End with **## Frequently Asked Questions** (4–6 Q&As, bold question lines)
- Close with one-line Prism CTA linking to [prismpublication.com](https://prismpublication.com)

### Style (Prism voice)
- **No em dashes.** Use commas, periods, or parentheses instead.
- No buzzwords: avoid "unlock", "synergy", "future-proof", "game-changer"
- Prefer **"partner integrations surfaced at the right moment"** over "contextual ads" in B2B-facing copy
- Light, direct, founder-to-founder tone. Concrete numbers and scenarios beat abstract claims.

### Internal links (include 3–5 per article)
- [Publishers](https://prismpublication.com/publishers)
- [Advertisers](https://prismpublication.com/advertisers)
- [Demo](https://prismpublication.com/demo)
- [Docs](https://prismpublication.com/docs)
- [Blog index](https://prismpublication.com/blog)
- Link to 1–2 related published posts when they exist

### Keywords to weave naturally
- contextual advertising AI chat
- chatbot monetization
- LLM inference costs
- AI app unit economics
- wellness chatbot / travel chatbot / personal AI assistant
- native conversational ads

## Cover images (GenerateImage)

Match the **live site** at prismpublication.com, not legacy docs that mention purple.

| Use | Colors |
|---|---|
| Background | White / off-white, subtle dot grid optional |
| Primary accent | Sky blue `#38bdf8` (matches `--primary` / Tailwind `sky-400`) |
| Secondary accents | Teal/cyan, soft orange/peach |
| Text | Dark charcoal / near-black, medium grey body |
| Gradient (optional) | Blue → teal → green → yellow → orange → red (like homepage "conversation") |
| Logo accents | Yellow, teal, small magenta in the P mark only |

**Use:** `#38bdf8` or Tailwind `sky-400` / `primary` for accents.

**Avoid:** purple (`#6C47FF`) as a dominant cover color.

**GenerateImage prompt pattern (16:9):**
```
16:9 blog cover, white background, subtle light dot grid,
sky blue primary accent, teal and soft orange secondary accents,
clean minimal B2B SaaS editorial style, dark charcoal text if any,
[vertical theme: wellness/travel/lifestyle], abstract chat UI,
no purple, no em dashes in any text
```

Save to `blog-drafts/assets/{slug}-cover.png`. User uploads via admin Cover image field.

## Draft file format

Save to `blog-drafts/scheduled/YYYY-MM-DD-slug.md`. Copy `_template.md` structure.

After drafting, run the checklist in `blog-drafts/README.md` before pasting into admin.

## Calendar

Follow `blog-drafts/content-calendar.md`. Mark status: `planned` → `draft` → `published`.

When user says "write this week's posts", read the calendar, draft both slots, save files, and summarize admin paste instructions.

## Reference examples

Good tone and structure:
- `blog-drafts/contextual-advertising-ai-chat-2026.md`
- `blog-drafts/ai-app-publisher-monetization-2026.md`
