import express from "express";
import type { Request, Response } from "express";
import { generateSkylarReply } from "../chat.js";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const message = typeof req.body?.message === "string" ? req.body.message : "";
  return res.json({ success: true, reply: generateSkylarReply(message) });
});

export default router;
