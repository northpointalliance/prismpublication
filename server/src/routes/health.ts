import express from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";

const router = express.Router();

router.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (_err) {
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});

export default router;
