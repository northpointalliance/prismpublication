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
| Cover image | `blog-drafts/assets/{slug}-cover.png` | JPEG/PNG/WebP, under 5 MB; upload to Storage and link `imageUrl` (see below) |

**Publish steps (admin UI):** New Post → fill fields → Save → upload cover from `blog-drafts/assets/` → Publish toggle.

**Publish steps (Supabase SQL, preferred for agents):** Draft → generate cover → save to `blog-drafts/assets/` → `INSERT` post via `execute_sql` → upload cover to Storage → `UPDATE imageUrl` → verify → mark calendar **published**.

Public URL: `https://prismpublication.com/blog/{slug}`

## Cover images (GenerateImage → assets → Storage → DB)

Do not stop at generating the image. Finish the full cover pipeline so the live post has a hero image without a manual handoff.

### Step 1: Generate and save locally

1. Call **GenerateImage** (16:9) using the prompt pattern below.
2. **Immediately copy** the output into the repo at:
   ```
   blog-drafts/assets/{slug}-cover.png
   ```
   GenerateImage may write to a Cursor temp path first. Always normalize to `{slug}-cover.png` under `blog-drafts/assets/` so admin upload and Storage upload use the same file.
3. Confirm the file exists before publishing the article.

### Step 2: Publish the article

Either admin UI (see above) or Supabase `execute_sql` INSERT into `blog_posts` (save a matching `.sql` file under `blog-drafts/scheduled/`). Posts inserted via SQL **do not** get `imageUrl` automatically; complete steps 3–4.

### Step 3: Upload cover to Supabase Storage

Bucket: **`blog-images`** (public). Project ref: **`botnabfogcjrkpmdjgpr`**.

**Option A — Supabase CLI (fastest for agents when CLI is linked):**
```bash
supabase storage cp "blog-drafts/assets/{slug}-cover.png" "ss:///blog-images/{slug}-cover.png" --project-ref botnabfogcjrkpmdjgpr --content-type image/png
```

**Option B — Admin portal:** Blog tab → edit post → drag `blog-drafts/assets/{slug}-cover.png` onto Cover image. Works when the post was created in admin (sets `imageUrl` on upload).

**Option C — User upload:** If CLI is unavailable, tell the user to upload from `blog-drafts/assets/{slug}-cover.png` in admin, then run step 4 yourself to confirm `imageUrl` is set.

Use a stable object name `{slug}-cover.png` when uploading via CLI so the public URL is predictable.

### Step 4: Link `imageUrl` on the post (required after SQL publish)

After the object is in Storage, set the column (admin upload does this automatically; SQL publish does not):

```sql
UPDATE blog_posts
SET "imageUrl" = 'https://botnabfogcjrkpmdjgpr.supabase.co/storage/v1/object/public/blog-images/{slug}-cover.png',
    "updatedAt" = now()
WHERE slug = '{slug}';
```

Run via Supabase MCP `execute_sql`.

### Step 5: Verify

```sql
SELECT slug, "imageUrl", published FROM blog_posts WHERE slug = '{slug}';
```

Confirm `imageUrl` is non-null and the image loads on:

- `https://prismpublication.com/blog/{slug}`
- `https://prismpublication.com/blog` (listing card)

### Visual spec

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

Filename convention: **`blog-drafts/assets/{slug}-cover.png`** (always).

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

## Draft file format

Save to `blog-drafts/scheduled/YYYY-MM-DD-slug.md`. Copy `_template.md` structure.

After drafting, run the checklist in `blog-drafts/README.md` before pasting into admin.

## Calendar

Follow `blog-drafts/content-calendar.md`. Mark status: `planned` → `draft` → `published`.

When user says "write this week's posts", read the calendar, draft both slots, save files, generate covers to `blog-drafts/assets/`, publish via SQL, upload covers to Storage, link `imageUrl`, and summarize live URLs plus any LinkedIn repost blurbs.

## Reference examples

Good tone and structure:
- `blog-drafts/contextual-advertising-ai-chat-2026.md`
- `blog-drafts/ai-app-publisher-monetization-2026.md`
