# Publisher Signals MVP

Niche-agnostic conversation scoring for chatbot publishers. Ads remain optional when the recommended action is `offer`.

## What shipped

| Piece | Location |
|---|---|
| Scorer (heuristic + optional LLM) | `supabase/functions/_shared/signals.ts` |
| Score API | `POST /api/signals/score` (`supabase/functions/api/routes/signals.ts`) |
| Usage metering | table `signal_events`; `GET /api/publisher/signals/usage` |
| SDK | `PrismAds.scoreTurn()` in `packages/sdk` |
| Portal | LLM toggle per bot, Signals usage card, SDK Docs → Signals |

## Decisions

- **Engine:** heuristics always; LLM when `placementPolicy.signals.useLlm === true` (needs `LOVABLE_API_KEY`)
- **Billing:** meter only (no paywall)
- **Schema:** broad enums (intent / emotion / stage / action), no vertical packs yet

## Deploy

1. Migration already applied to live DB as `signal_events` (RLS enabled). For other environments:

```bash
cd server && npx prisma migrate deploy
# or run server/prisma/migrations/20260721000000_signal_events/migration.sql
# then re-run supabase/rls.sql (or: ALTER TABLE public.signal_events ENABLE ROW LEVEL SECURITY;)
```

2. Deploy the API function:

```bash
supabase functions deploy api --project-ref botnabfogcjrkpmdjgpr
```

3. Optional: set `LOVABLE_API_KEY` as a Supabase function secret so hybrid scoring works when publishers enable LLM.

4. Rebuild/publish SDK when ready (`packages/sdk`) so `scoreTurn` is on npm. Until then, publishers can call REST `/api/signals/score` with the same HMAC auth as `/api/ads`.

## Smoke test

```bash
# 1) Heuristic score (HMAC required if REQUIRE_SDK_HMAC is on)
# Sign body: timestamp + "\n" + raw JSON, HMAC-SHA256 with SDK key

curl -sS -X POST "$API/signals/score" \
  -H "Authorization: Bearer $SDK_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Prism-Timestamp: $TS" \
  -H "X-Prism-Signature: sha256=$SIG" \
  -d '{"botId":"YOUR_PUBLIC_BOT_ID","messages":[{"role":"user","content":"I want to buy a plan today"}],"includeOffer":false}'

# Expect: success, action likely "offer" or "recommend", engine "heuristic"

# 2) Enable LLM in portal (bot → Use LLM scoring), re-call → engine "hybrid" if LOVABLE_API_KEY is set

# 3) Portal → Signals usage card increments; SQL:
# SELECT count(*) FROM signal_events WHERE "botId" = 'YOUR_PUBLIC_BOT_ID';
```

## Publisher policy

Stored on `publisher_bots.placementPolicy`:

```json
{ "signals": { "useLlm": true } }
```
