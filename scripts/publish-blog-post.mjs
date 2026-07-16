/**
 * Publish a blog draft from blog-drafts/scheduled/*.md to production Postgres.
 *
 * Usage:
 *   DB_URL="postgresql://..." node scripts/publish-blog-post.mjs blog-drafts/scheduled/2026-07-22-wellness-chatbot-api-costs.md
 *
 * Requires direct Postgres access (Supabase pooled connection on port 6543).
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const draftPath = process.argv[2];
const dbUrl = process.env.DB_URL || process.env.DATABASE_URL;

if (!draftPath) {
  console.error("Usage: DB_URL=... node scripts/publish-blog-post.mjs <draft-file.md>");
  process.exit(1);
}
if (!dbUrl) {
  console.error("Error: set DB_URL or DATABASE_URL");
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(draftPath), "utf8");

function parseDraft(markdown) {
  const lines = markdown.split("\n");
  const titleLine = lines.find((l) => l.startsWith("# "));
  if (!titleLine) throw new Error("Draft missing # title line");

  const meta = {};
  for (const line of lines) {
    const m = line.match(/^\*\*(\w[\w ]*):\*\*\s*(.+)$/);
    if (m) meta[m[1].toLowerCase().replace(/ /g, "")] = m[2].trim();
  }

  const divider = markdown.indexOf("\n---\n");
  if (divider === -1) throw new Error("Draft missing --- body divider");
  let body = markdown.slice(divider + 5).trim();
  // Strip trailing footer divider block if present (keep CTA paragraph)
  const lastDivider = body.lastIndexOf("\n---\n");
  if (lastDivider > body.length - 400) {
    body = body.slice(0, lastDivider).trim() + "\n\n" + body.slice(lastDivider + 5).trim();
  }

  const readingTimeMatch = (meta.readingtime || "").match(/(\d+)/);

  return {
    title: titleLine.replace(/^#\s+/, "").trim(),
    slug: meta.slug,
    excerpt: meta.excerpt,
    category: meta.category,
    readingTime: readingTimeMatch ? parseInt(readingTimeMatch[1], 10) : null,
    body,
  };
}

const post = parseDraft(raw);
if (!post.slug || !post.title || !post.body) {
  console.error("Parsed post missing required fields:", post);
  process.exit(1);
}

const sql = postgres(dbUrl, { prepare: false, max: 1 });
const id = crypto.randomUUID();
const now = new Date();

try {
  const existing = await sql`SELECT id, published FROM blog_posts WHERE slug = ${post.slug} LIMIT 1`;

  if (existing.length) {
    await sql`
      UPDATE blog_posts SET
        title = ${post.title},
        excerpt = ${post.excerpt ?? null},
        body = ${post.body},
        category = ${post.category ?? null},
        "readingTime" = ${post.readingTime},
        published = true,
        "publishedAt" = COALESCE("publishedAt", ${now}),
        "updatedAt" = ${now}
      WHERE slug = ${post.slug}`;
    console.log(`Updated and published existing post: ${post.slug}`);
  } else {
    await sql`
      INSERT INTO blog_posts (
        id, title, slug, excerpt, body, category, "readingTime",
        published, "publishedAt", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${post.title}, ${post.slug}, ${post.excerpt ?? null}, ${post.body},
        ${post.category ?? null}, ${post.readingTime},
        true, ${now}, ${now}, ${now}
      )`;
    console.log(`Created and published: ${post.slug}`);
  }

  console.log(`Live URL: https://prismpublication.com/blog/${post.slug}`);
} finally {
  await sql.end();
}
