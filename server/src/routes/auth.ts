import express from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { syncUserSchema } from "../schemas.js";
import { validatePortalSession, buildEntryContextByUserId } from "../portal.js";
import { logger } from "../logger.js";

const router = express.Router();

router.post("/sync-user", async (req: Request, res: Response) => {
  const parsed = syncUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid sync payload", details: parsed.error.flatten() });
  }

  const email = parsed.data.email.toLowerCase();
  const validation = await validatePortalSession(req, email);
  if (!validation.ok) {
    return res.status(validation.status!).json({ error: validation.error });
  }

  const fallbackName = email.split("@")[0] || "Portal User";
  const name = parsed.data.name?.trim() || fallbackName;

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });

    const entry = await buildEntryContextByUserId(user.id);
    return res.json(entry);
  } catch (err) {
    logger.error("User sync failed", err);
    return res.status(500).json({ error: "Failed to sync user" });
  }
});

export default router;
