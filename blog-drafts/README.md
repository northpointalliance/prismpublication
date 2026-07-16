# Blog drafts

Editorial drafts for [prismpublication.com/blog](https://prismpublication.com/blog). Published posts are stored in the database via the admin panel, not in this folder.

## Workflow (2x per week)

1. Pick the next **planned** row in [content-calendar.md](./content-calendar.md)
2. Copy [_template.md](./_template.md) → `scheduled/YYYY-MM-DD-slug.md`
3. Draft in Cursor (skill: `prism-blog-content`) or by hand
4. Run the pre-publish checklist below
5. Admin portal → **Blog** → **+ New Post** → paste fields → Save → cover image → **Publish**

Full details: [docs/BLOG-CONTENT-WORKFLOW.md](../docs/BLOG-CONTENT-WORKFLOW.md)

## Pre-publish checklist

- [ ] Title matches a real search query your ICP would type
- [ ] Slug is unique (grep `blog-drafts/` and check admin for duplicates)
- [ ] Excerpt under 500 chars, works as a standalone summary
- [ ] Body is Markdown with `##` question H2s only (no `#` in body)
- [ ] 1,200+ words (2,000+ preferred for SEO/AEO)
- [ ] No em dashes anywhere
- [ ] 3–5 internal links to prismpublication.com pages
- [ ] FAQ section with 4–6 questions
- [ ] Reading time filled in
- [ ] Cover image uploaded (1200×630 or 16:9 works well)
- [ ] Calendar row marked **published** with live URL

## Folders

| Path | Purpose |
|---|---|
| `blog-drafts/*.md` | Legacy/reference drafts (already written) |
| `blog-drafts/scheduled/` | Upcoming posts ready to paste into admin |
| `blog-drafts/content-calendar.md` | 2x/week topic queue |
