-- Publisher Signals usage metering (POST /api/signals/score).
CREATE TABLE IF NOT EXISTS "signal_events" (
  "id" TEXT NOT NULL,
  "botId" TEXT NOT NULL,
  "organizationId" TEXT,
  "engine" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "intent" TEXT,
  "stage" TEXT,
  "safetyOk" BOOLEAN NOT NULL DEFAULT true,
  "usedLlm" BOOLEAN NOT NULL DEFAULT false,
  "latencyMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "signal_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "signal_events_botId_createdAt_idx" ON "signal_events"("botId", "createdAt");
CREATE INDEX IF NOT EXISTS "signal_events_organizationId_createdAt_idx" ON "signal_events"("organizationId", "createdAt");
