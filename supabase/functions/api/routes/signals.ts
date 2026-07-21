import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { sql } from "../../_shared/db.ts";
import { newId } from "../../_shared/ids.ts";
import { signalsScoreSchema } from "../../_shared/validation.ts";
import { requireSdkKey, requireSdkSignature, ensureSdkBotScope } from "../../_shared/sdk-auth.ts";
import { scoreConversation, readSignalsPolicy } from "../../_shared/signals.ts";
import { selectAdForRequest, toSdkAd } from "../../_shared/ads.ts";

// Mounted at /api/signals → POST /api/signals/score
const signals = new Hono<Env>();

signals.post("/score", requireSdkKey, requireSdkSignature, async (c) => {
  const started = Date.now();
  const parsed = signalsScoreSchema.safeParse(await readJson(c));
  if (!parsed.success) {
    return c.json({ success: false, error: "Invalid signals request", details: parsed.error.flatten() }, 400);
  }

  try {
    const scope = ensureSdkBotScope(c, parsed.data.botId);
    if (!scope.ok) return c.json({ error: scope.error }, (scope.status ?? 403) as 403);

    const botRows = await sql`
      SELECT "id","publicId","organizationId","placementPolicy"
      FROM publisher_bots
      WHERE "publicId" = ${parsed.data.botId} AND "deletedAt" IS NULL
      LIMIT 1`;
    if (!botRows.length) return c.json({ success: false, error: "Bot not found" }, 404);

    const bot = botRows[0];
    const policy = readSignalsPolicy(bot.placementPolicy);
    const scored = await scoreConversation(parsed.data.messages, { useLlm: policy.useLlm });

    // deno-lint-ignore no-explicit-any
    let offer: any = undefined;
    if (parsed.data.includeOffer && scored.action === "offer") {
      const topic = scored.signals.topics[0] || "";
      const selected = await selectAdForRequest({ format: parsed.data.format, topic });
      if (selected) offer = toSdkAd(selected);
    }

    const latencyMs = Date.now() - started;
    await sql`
      INSERT INTO signal_events (
        "id","botId","organizationId","engine","action","intent","stage","safetyOk","usedLlm","latencyMs","createdAt"
      ) VALUES (
        ${newId()},
        ${bot.publicId},
        ${bot.organizationId},
        ${scored.engine},
        ${scored.action},
        ${scored.signals.intent},
        ${scored.signals.stage},
        ${scored.signals.safety.ok},
        ${scored.engine === "hybrid"},
        ${latencyMs},
        now()
      )`;

    return c.json({
      success: true,
      data: {
        signals: scored.signals,
        action: scored.action,
        actionReason: scored.actionReason,
        engine: scored.engine,
        ...(offer ? { offer } : {}),
      },
    });
  } catch (err) {
    console.error("Signals score failed", err);
    return c.json({ success: false, error: "Failed to score conversation" }, 500);
  }
});

export default signals;
