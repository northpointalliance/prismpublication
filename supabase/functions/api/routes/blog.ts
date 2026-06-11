import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";

// Mounted at /api/blog. Public, no auth. Ports server/src/routes/blog.ts.
const blog = new Hono<Env>();

// GET /api/blog — published posts, newest first.
blog.get("/", async (c) => {
  try {
    const posts = await sql`
      SELECT "id", "title", "slug", "excerpt", "imageUrl", "category", "readingTime", "publishedAt"
      FROM blog_posts
      WHERE "published" = true
      ORDER BY "publishedAt" DESC NULLS LAST`;
    return c.json(posts);
  } catch (err) {
    console.error("Blog list failed", err);
    return c.json({ error: "Failed to fetch blog posts" }, 500);
  }
});

// GET /api/blog/:slug — single published post.
blog.get("/:slug", async (c) => {
  try {
    const rows = await sql`
      SELECT * FROM blog_posts WHERE "slug" = ${c.req.param("slug")} AND "published" = true LIMIT 1`;
    if (rows.length === 0) return c.json({ error: "Not found" }, 404);
    return c.json(rows[0]);
  } catch (err) {
    console.error("Blog post fetch failed", err);
    return c.json({ error: "Failed to fetch blog post" }, 500);
  }
});

export default blog;
