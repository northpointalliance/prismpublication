# Blog content workflow

How to produce **2 SEO/AEO/optimized articles per week** for Prism Publication and publish them through the admin panel.

## Who this is for

Founders and operators building **personal B2C chatbots** in:

- **Health / wellness** (fitness coaches, nutrition, mental health companions)
- **Travel** (itinerary planners, booking assistants)
- **Lifestyle** (personal assistants people chat with daily)

Each article should address at least one of:

1. **LLM API cash burn** (inference cost, free-tier math, unit economics)
2. **Contextual monetization** (partner integrations at the right moment, trust-safe formats)

Goal: **organic traffic** from Google and citations from AI search engines.

---

## Admin panel (where posts go live)

| Step | Action |
|---|---|
| 1 | Log in at [prismpublication.com/app/login](https://prismpublication.com/app/login) |
| 2 | Open admin at `/notadmin` (Blog tab) |
| 3 | Click **+ New Post** |
| 4 | Fill **Title**, **Slug**, **Excerpt**, **Body** (Markdown), **Category**, **Reading time** |
| 5 | **Save** |
| 6 | Upload **Cover image** (drag and drop) |
| 7 | Click **Publish** |

### Field mapping

| Admin UI | Source |
|---|---|
| Title | Draft header or `#` line |
| Slug | `**Slug:**` in draft (auto-generated from title if blank on create) |
| Excerpt | `**Excerpt:**` (shown on `/blog` listing; keep under 500 chars) |
| Article body | Markdown below the `---` divider in draft file |
| Category | `Publishers`, `Monetization`, `Wellness`, `Travel`, `Industry` |
| Reading time | Minutes at ~200 words/minute |

### API (for reference)

- `GET/POST /api/admin/portal/blog` — list / create
- `PUT /api/admin/portal/blog/:id` — update
- `POST /api/admin/portal/blog/:id/publish` — toggle published
- `POST /api/admin/portal/blog/:id/image` — cover upload (Supabase Storage `blog-images` bucket)

Public routes:

- `GET /api/blog` — published list
- `GET /api/blog/:slug` — single article

Live URL: `https://prismpublication.com/blog/{slug}`

There is **no separate meta title or meta description field** today. Optimize **title** and **excerpt** for search snippets.

---

## Editorial system in this repo

```
blog-drafts/
├── README.md              ← checklist
├── content-calendar.md    ← 2x/week topic queue
├── _template.md           ← copy for each new post
└── scheduled/             ← drafts ready to paste into admin

.cursor/skills/prism-blog-content/
└── SKILL.md               ← Cursor agent instructions for drafting
```

### Weekly rhythm

| Day | Task |
|---|---|
| **Mon** | Review calendar; pick Tue + Thu topics |
| **Tue AM** | Draft post #1 → `scheduled/` → admin publish |
| **Thu AM** | Draft post #2 → `scheduled/` → admin publish |
| **Fri** | Mark calendar rows `published`; note live URLs |

In Cursor, prompt example:

> Write this week's blog posts from content-calendar.md using prism-blog-content skill.

---

## SEO / AEO / GEO standards

### Google (SEO)

- Title matches search intent (question or "how to" phrasing)
- Excerpt reads like a meta description (140–160 chars ideal)
- Long-form depth (2,000+ words when possible)
- Internal links to `/`, `/publishers`, `/demo`, `/blog`, related posts
- Unique slug per post

### AI search (AEO / GEO)

- **Question-based H2 headings** (LLMs extract Q→A pairs)
- **Direct answer in first 2–3 sentences** under each H2
- **FAQ block** at the end (4–6 questions)
- Concrete numbers, scenarios, and definitions
- Refresh posts every **90 days**

### Prism style

- **No em dashes**
- No buzzwords ("unlock", "synergy", "future-proof")
- Prefer "partner integrations surfaced at the right moment" over generic "contextual ads" in publisher-facing copy

---

## Cover images

Upload in admin after first save. Options:

- Use existing assets in `public/mockups/` (blog-*.svg)
- Generate with Cursor **GenerateImage** (see `.cursor/skills/prism-blog-content/SKILL.md` cover section)
- Match live site colors: white background, sky blue primary, teal/orange accents. **Not purple.**

---

## After publish

1. Mark row **published** in `content-calendar.md` with live URL
2. Hard-refresh `/blog` to confirm listing
3. Open `/blog/{slug}` in incognito to verify render
4. Optional: share link on LinkedIn / founder communities for traffic signal

---

## Cursor automation (optional)

To run on a schedule, use a Cursor Automation or weekly reminder to prompt:

> Draft the next two posts from blog-drafts/content-calendar.md per prism-blog-content skill.

Human review before publish is required (admin paste + cover image).
