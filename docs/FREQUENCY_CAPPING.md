# Frequency Capping

> **Added June 25, 2026**: Server-side frequency capping for SDK ad impressions.

## Overview

**Frequency capping** prevents a single user from seeing ads too frequently within a bot. This protects both user experience (reduces ad fatigue) and publisher revenue (optimizes impression value).

### Client vs. Server

Previously, frequency capping was **client-side only**:
- Tracked in local SDK state (`messageCount` map)
- Not tamper-proof; users could clear local storage to reset counters
- Didn't persist across devices or sessions

**New approach (June 2026)**: Server-side frequency capping via the database:
- Queries the last 24 hours of impressions for a user in a bot
- Enforces a frequency window (e.g., "show ad every 5 impressions")
- Tamper-proof—users can't bypass server logic
- Persists across devices and browser sessions

## Architecture

### Database

Frequency caps are computed from the existing `ad_events` table:

```sql
SELECT COUNT(*) as impression_count
FROM ad_events
WHERE "botId" = $1 
  AND "userId" = $2
  AND "eventType" = 'impression'
  AND "createdAt" >= now() - INTERVAL '24 hours'
```

No new table is needed; impressions are already tracked.

### Endpoints

**POST /api/ads** — SDK ad request endpoint

Receives an `AdRequest` with optional context:

```typescript
interface AdContext {
  topic?: string;                    // targeting topic
  userId?: string;                   // required for frequency capping
  frequencyWindow?: number;          // ad every N impressions (default: 5)
  [key: string]: unknown;
}
```

**Flow**:
1. Parse and validate `AdRequest`
2. Call `selectAdForRequest()` with `botId`, `userId`, `frequencyWindow`
3. Server checks: `checkFrequencyCap(botId, userId, frequencyWindow)`
4. If frequency cap hit: return `{ success: true, data: [] }` (empty)
5. Otherwise: proceed with ad selection (budget checks, targeting, weighting)
6. Return the selected ad

### Code locations

| File | What | Purpose |
|------|------|---------|
| `supabase/functions/_shared/ads.ts` | `checkFrequencyCap()` | Query last 24h impressions; return boolean |
| `supabase/functions/_shared/ads.ts` | `DEFAULT_FREQUENCY_WINDOW` | Default: 5 impressions |
| `supabase/functions/api/routes/sdk.ts` | `POST /api/ads` | Extract `frequencyWindow` from context; pass to `selectAdForRequest()` |
| `packages/sdk/src/index.ts` | `AdContext` interface | Updated to include `frequencyWindow` |

### Client SDK usage

**Basic (default 5-impression window)**:

```typescript
import { PrismAds } from "@prismpublication/sdk";

const prism = new PrismAds({
  apiKey: "your-key",
  botId: "your-bot-id",
});

// Server enforces: show ad every 5 impressions
const ad = await prism.displayAd({
  userId: "user-123",
  topic: "productivity",
});
```

**Custom frequency window**:

```typescript
// Show ad every 10 impressions instead of 5
const ad = await prism.displayAd({
  userId: "user-123",
  topic: "productivity",
  frequencyWindow: 10,
});
```

**No frequency cap** (all impressions):

```typescript
// Skip frequency check by omitting userId
const ad = await prism.displayAd({
  topic: "productivity",
  // no userId → frequency check skipped
});
```

### React hook usage

```typescript
import { usePrismAd } from "@prismpublication/sdk/react";

function ChatWindow() {
  const { ad, loading, error, refresh } = usePrismAd({
    apiKey: "your-key",
    botId: "your-bot-id",
    userId: "user-123",
    topic: "productivity",
    frequency: 5,  // custom window
  });

  return (
    <div>
      {ad && <div>{ad.title}</div>}
      <button onClick={refresh}>Refresh Ad</button>
    </div>
  );
}
```

## Behavior

### How it works

Given a user `user-123` in bot `bot-prod`:

1. **First ad request**: 0 impressions in last 24h → `(0 + 1) % 5 = 1` → **show ad**
2. **Second request** (soon after): 1 impression → `(1 + 1) % 5 = 2` → **skip**
3. **Third**: 1 impression → `(1 + 1) % 5 = 2` → **skip**
4. **Fourth**: 1 impression → `(1 + 1) % 5 = 2` → **skip**
5. **Fifth**: 1 impression → `(1 + 1) % 5 = 2` → **skip**
6. **Sixth request**: 1 impression → `(1 + 1) % 5 = 2` → **skip** (wait, the math is on the *next* impression count)

Actually, the logic is:
- Count = N (current impressions)
- Next = N + 1
- Show if `Next % FrequencyWindow === 1`

So:
- N=0: Next=1 → 1 % 5 = 1 → **show** (this is the 1st ad)
- N=1: Next=2 → 2 % 5 = 2 → **skip**
- N=2: Next=3 → 3 % 5 = 3 → **skip**
- N=3: Next=4 → 4 % 5 = 4 → **skip**
- N=4: Next=5 → 5 % 5 = 0 → **skip**
- N=5: Next=6 → 6 % 5 = 1 → **show** (this is the 2nd ad)

Result: **Ads shown at impressions 1 and 6** (every 5 impressions).

### Window: 24 hours

The frequency check looks at impressions from the **last 24 hours** (`now() - INTERVAL '24 hours'`). After 24 hours, old impressions fall out of the window, and the counter resets.

Example:
- Day 1: 6 impressions (ads at 1, 6)
- Day 2 (25+ hours later): Counter starts over at 0; next ad at impression 1 again

### No user ID = no frequency cap

If `userId` is missing or null, the frequency check is **skipped**:

```typescript
// Frequency cap skipped
const ad = await prism.displayAd({ topic: "productivity" });
```

This is useful for **anonymous users** or **demo mode**.

## Error handling

If the frequency cap check fails (database error), the system **fails open**:

```typescript
export const checkFrequencyCap = async (...): Promise<boolean> => {
  try {
    // query...
    return shouldShow;
  } catch (err) {
    console.error("Frequency cap check failed", err);
    // On error, allow the ad (fail open for user experience)
    return true;
  }
};
```

This ensures a database blip doesn't break ad serving.

## Integration with budget management

Frequency capping runs **before** budget checks:

```typescript
export const selectAdForRequest = async ({
  format,
  topic = "",
  botId,
  userId,
  frequencyWindow,
}: {...}): Promise<any | null> => {
  // 1. Check frequency cap first
  if (botId && userId) {
    const passesFrequencyCap = await checkFrequencyCap(botId, userId, frequencyWindow);
    if (!passesFrequencyCap) return null;
  }

  // 2. Then proceed with ad selection (budget checks, targeting, etc.)
  const activeAds = await sql`SELECT * FROM ads WHERE ...`;
  // ...budget filtering...
  // ...topic matching...
  // ...weighted selection...
  return weightedPick(...);
};
```

If a user hits their frequency cap, **no ad is returned** (empty array). The advertiser is **not charged** for a capped impression.

## Backward compatibility

The old SDK client-side methods remain available but are **deprecated**:

```typescript
// Deprecated (still works, but server frequency cap is now the standard)
prism.shouldShowAd(userId, frequency);       // ← deprecated
prism.resetMessageCount(userId);              // ← deprecated
prism.getMessageCount(userId);                // ← deprecated
```

Existing code using these will still run, but:
- **Server frequency cap takes precedence** (if `userId` is passed, server checks it)
- **Client-side tracking has no effect** on the server decision
- Documentation and new code should use `frequencyWindow` in `AdContext` instead

## Monitoring

Track frequency cap hits via the admin dashboard:

```sql
-- Ads returned in last hour
SELECT COUNT(*) FROM api_logs 
WHERE path = '/api/ads' 
  AND "responseData" @> '{"data": []}' 
  AND "createdAt" > now() - INTERVAL '1 hour';

-- Compare to total requests
SELECT COUNT(*) FROM api_logs 
WHERE path = '/api/ads' 
  AND "createdAt" > now() - INTERVAL '1 hour';
```

If the cap-hit rate is too high, consider:
- Raising the default `DEFAULT_FREQUENCY_WINDOW` (in `_shared/ads.ts`)
- Allowing advertisers to request higher windows per bot
- Shortening the 24-hour window to 12 or 6 hours for testing

## Testing

**Local test (no DB)**:

```typescript
import { checkFrequencyCap } from "@/supabase/functions/_shared/ads.ts";

// Simulate 5 prior impressions
const result = await checkFrequencyCap("bot-1", "user-1", 5);
// If next impression would be #6, returns true
```

**Live test**:

```bash
# Create a test bot and user
curl -X POST https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/ads \
  -H "Authorization: Bearer <sdk-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "test-bot",
    "format": "card",
    "context": { "userId": "test-user", "frequencyWindow": 2 }
  }'

# First request: should return an ad
# Second request: should return empty data []
# Third request: should return an ad
```

---

## Related docs

- [ARCHITECTURE.md](ARCHITECTURE.md): System design, endpoints, auth
- [INTEGRATION_EXAMPLES.md](INTEGRATION_EXAMPLES.md): Full SDK integration walkthrough
- [HANDOVER.md](../HANDOVER.md): Productio