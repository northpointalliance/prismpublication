import express from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { logger } from "../logger.js";

const router = express.Router();

// GET /api/blog — list published posts newest-first (no auth)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        imageUrl: true,
        category: true,
        readingTime: true,
        publishedAt: true,
      },
    });
    return res.json(posts);
  } catch (err) {
    logger.error("Blog list failed", err);
    return res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// GET /api/blog/:slug — single published post by slug (no auth)
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, published: true },
    });
    if (!post) return res.status(404).json({ error: "Not found" });
    return res.json(post);
  } catch (err) {
    logger.error("Blog post fetch failed", err);
    return res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

export default router;
