/**
 * Publish a blog draft to production via Prisma.
 *
 * Usage (from server/):
 *   DATABASE_URL="postgresql://..." node scripts/publish-blog-post.mjs ../blog-drafts/scheduled/2026-07-22-wellness-chatbot-api-costs.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const draftArg = process.argv[2];
const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;

if (!draftArg) {
  console.error("Usage: DATABASE_URL=... node scripts/publish-blog-post.mjs <draft-file.md>");
  process.exit(1);
}
if (!dbUrl) {
  console.error("Error: set DATABASE_URL or DB_URL in server/.env or environment");
  process.exit(1);
}

const draftPath = path.resolve(__dirname, "..", draftArg.startsWith("..") ? draftArg : path.join("..", draftArg));
const raw = fs.readFileSync(draftPath, "utf8");

function parseDraft(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const titleLine = lines.find((l) => l.startsWith("# "));
  if (!titleLine) throw new Error("Draft missing # title line");

  const meta = {};
  for (const line of lines) {
    const m = line.match(/^\*\*(\w[\w ]*):\*\*\s*(.+)$/);
    if (m) meta[m[1].toLowerCase().replace(/ /g, "")] = m[2].trim();
  }

  const divider = normalized.indexOf("\n---\n");
  if (divider === -1) throw new Error("Draft missing --- body divider");
  let body = normalized.slice(divider + 5).trim();
  const lastDivider = body.lastIndexOf("\n---\n");
  if (lastDivider > body.length - 400) {
    const footer = body.slice(lastDivider + 5).trim();
    body = body.slice(0, lastDivider).trim() + "\n\n" + footer;
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
const prisma = new PrismaClient();

try {
  const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
  const now = new Date();

  if (existing) {
    await prisma.blogPost.update({
      where: { slug: post.slug },
      data: {
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        category: post.category,
        readingTime: post.readingTime,
        published: true,
        publishedAt: existing.publishedAt ?? now,
      },
    });
    console.log(`Updated and published: ${post.slug}`);
  } else {
    await prisma.blogPost.create({
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body: post.body,
        category: post.category,
        readingTime: post.readingTime,
        published: true,
        publishedAt: now,
      },
    });
    console.log(`Created and published: ${post.slug}`);
  }

  console.log(`Live URL: https://prismpublication.com/blog/${post.slug}`);
} finally {
  await prisma.$disconnect();
}
