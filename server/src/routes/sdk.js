import express from "express";
import { prisma } from "../db.js";
import { adRequestSchema, trackEventSchema } from "../schemas.js";
import { requireSdkKey, requireSdkSignature, ensureSdkBotScope } from "../portal.js";
import { selectAdForRequest, toSdkAd, sdkTrackEventTypes } from "../helpers.js";
import { logger } from "../logger.js";

const router = express.Router();

router.post("/ads", requireSdkKey, requireSdkSignature, async (req, res) => {
  const parsed = adRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid ad request", details: parsed.error.flatten() });
  }

  try {
    const scope = ensureSdkBotScope(req, parsed.data.botId);
    if (!scope.ok) {
      return res.status(scope.status).json({ error: scope.error });
    }

    const selected = await selectAdForRequest({
      format: parsed.data.format,
      topic: parsed.data.context?.topic || "",
    });
    if (!selected) {
      return res.json({ success: true, data: [] });
    }

    return res.json({ success: true, data: [toSdkAd(selected)] });
  } catch (err) {
    logger.error("Ad fetch failed", err);
    return res.status(500).json({ success: false, error: "Failed to fetch ads" });
  }
});

router.post("/track/:eventType", requireSdkKey, requireSdkSignature, async (req, res) => {
  const eventType = req.params.eventType;
  if (!sdkTrackEventTypes.has(eventType)) {
    return res.status(400).json({ error: "Invalid event type" });
  }

  const parsed = trackEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid tracking payload", details: parsed.error.flatten() });
  }

  try {
    const scope = ensureSdkBotScope(req, parsed.data.botId);
    if (!scope.ok) {
      return res.status(scope.status).json({ error: scope.error });
    }

    await prisma.adEvent.create({
      data: {
        eventType,
        adId: parsed.data.adId,
        botId: parsed.data.botId,
        userId: parsed.data.userId,
        topic: parsed.data.topic,
        amount: parsed.data.amount,
        metadata: parsed.data.metadata,
      },
    });
    return res.status(201).json({ success: true });
  } catch (err) {
    logger.error("Event track failed", err);
    return res.status(500).json({ error: "Failed to track event" });
  }
});

export default router;
