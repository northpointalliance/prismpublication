/**
 * Generate Supabase SQL to publish a blog draft (no DB connection required).
 *
 * Usage:
 *   node scripts/generate-blog-publish-sql.mjs blog-drafts/scheduled/2026-07-22-wellness-chatbot-api-costs.md
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const draftPath = process.argv[2];
if (!draftPath) {
  console.error("Usage: node scripts/generate-blog-publish-sql.mjs <draft-file.md>");
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(draftPath), "utf8");

function parseDraft(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const titleLine = lines.find((l) => l.startsWith("# "));
  if (!titleLine) throw new Error("Missing # title");

  const meta = {};
  for (const line of lines) {
    const m = line.match(/^\*\*(\w[\w ]*):\*\*\s*(.+)$/);
    if (m) meta[m[1].toLowerCase().replace(/ /g, "")] = m[2].trim();
  }

  const divider = normalized.indexOf("\n---\n");
  if (divider === -1) throw new Error("Missing --- divider");
  let body = normalized.slice(divider + 5).trim();
  const lastDivider = body.lastIndexOf("\n---\n");
  if (lastDivider > body.length - 400) {
    body = body.slice(0, lastDivider).trim() + "\n\n" + body.slice(lastDivider + 5).trim();
  }

  const readingTimeMatch = (meta.readingtime || "").match(/(\d+)/);

  return {
    title: titleLine.replace(/^#\s+/, "").trim(),
    slug: meta.slug,
    excerpt: meta.excerpt ?? "",
    category: meta.category ?? "",
    readingTime: readingTimeMatch ? parseInt(readingTimeMatch[1], 10) : null,
    body,
  };
}

const post = parseDraft(raw);
const id = randomUUID();
const tag = "prism_body_" + post.slug.replace(/-/g, "_");

const sql = `-- Publish: ${post.title}
-- Run in Supabase Dashboard > SQL Editor > Run
-- Live URL: https://prismpublication.com/blog/${post.slug}

INSERT INTO blog_posts (
  id, title, slug, excerpt, body, category, "readingTime",
  published, "publishedAt", "createdAt", "updatedAt"
) VALUES (
  '${id}',
  ${sqlQuote(post.title)},
  ${sqlQuote(post.slug)},
  ${sqlQuote(post.excerpt)},
  $${tag}$${post.body}$${tag}$,
  ${sqlQuote(post.category)},
  ${post.readingTime ?? "NULL"},
  true,
  now(),
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  "readingTime" = EXCLUDED."readingTime",
  published = true,
  "publishedAt" = COALESCE(blog_posts."publishedAt", now()),
  "updatedAt" = now();
`;

function sqlQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const outPath = path.join(
  path.dirname(path.resolve(draftPath)),
  `publish-${post.slug}.sql`,
);
fs.writeFileSync(outPath, sql, "utf8");
console.log(`Wrote ${outPath}`);
console.log(`Open Supabase SQL Editor and run this file.`);
