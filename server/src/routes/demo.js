import express from "express";
import { prisma } from "../db.js";
import { demoAdRequestSchema, demoTrackEventSchema } from "../schemas.js";
import { selectAdForRequest, toSdkAd, demoTrackEventTypes } from "../helpers.js";
import { logger } from "../logger.js";

const router = express.Router();

router.post("/ads", async (req, res) => {
  const parsed = demoAdRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid demo ad request", details: parsed.error.flatten() });
  }

  try {
    const selected = await selectAdForRequest({
      format: parsed.data.format,
      topic: parsed.data.context?.topic || "",
    });
    if (!selected) {
      return res.json({ success: true, data: [] });
    }

    return res.json({ success: true, data: [toSdkAd(selected)] });
  } catch (err) {
    logger.error("Demo ad fetch failed", err);
    return res.status(500).json({ success: false, error: "Failed to fetch demo ads" });
  }
});

router.post("/track/:eventType", async (req, res) => {
  const eventType = req.params.eventType;
  if (!demoTrackEventTypes.has(eventType)) {
    return res.status(400).json({ error: "Invalid demo event type" });
  }

  const parsed = demoTrackEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid demo tracking payload", details: parsed.error.flatten() });
  }

  try {
    await prisma.adEvent.create({
      data: {
        eventType,
        adId: parsed.data.adId,
        botId: "demo-public",
        userId: parsed.data.userId,
        topic: parsed.data.topic,
        metadata: { source: "public_demo" },
      },
    });
    return res.status(201).json({ success: true });
  } catch (err) {
    logger.error("Demo event track failed", err);
    return res.status(500).json({ error: "Failed to track demo event" });
  }
});

export default router;
