import express from "express";
import { prisma } from "../db.js";
import { leadSchema } from "../schemas.js";
import { requireAdminKey } from "../portal.js";
import { logger } from "../logger.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const lead = await prisma.lead.create({ data: parsed.data });
    return res.status(201).json({ id: lead.id, status: lead.status });
  } catch (err) {
    logger.error("Lead insert failed", err);
    return res.status(500).json({ error: "Failed to store lead" });
  }
});

router.get("/", requireAdminKey, async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return res.json(leads);
  } catch (err) {
    logger.error("Lead list failed", err);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

export default router;
