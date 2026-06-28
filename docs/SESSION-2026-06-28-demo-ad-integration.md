# Session Log: Demo Ad Integration — 2026-06-28

## What Dan asked

The demo URL (https://prism-publication-demo.vercel.app/) has 3 chat bots (FitTrack, Confidant, Calmly). They were generating generic text and not pulling from the Prism ad library. Dan had already loaded 4 affiliate ads into the system and wanted the demo to surface real ads from the SDK so it works as a proper sales tool for showing advertisers and publishers what Prism does.

---

## What was investigated

**Demo repo:** `github.com/northpointalliance/prism-demo` (separate from this repo), local path: `C:\Users\dan72\Desktop\Prismpublication June 2026\prism-demos`

**Root causes found by reading the source:**

1. **Generic bot responses** — `lib/DemoChat.js` used a single hardcoded string `"Got it — noted."` as the bot reply for every message across all 3 apps.

2. **Broken CTA link** — `DemoChat.js` rendered `ad.ctaUrl` but the Prism SDK returns `ad.clickUrl`. Every CTA button linked to `#`.

3. **Ad serving silently broken** — `pages/api/ad/[niche].js` required Vercel environment variables (`PRISM_SDK_KEY_FITNESS`, `PRISM_BOT_ID_FITNESS`, etc.) that were never set. Every ad request returned a 400 error and no ad appeared. The chat looked like it was working but no ads ever loaded.

4. **Wrong API endpoint** — even if the env vars had been set, `lib/prismClient.js` was calling `POST /ads` (the authenticated SDK endpoint) with an incorrectly structured body (`{ botId, topic, adFormat }` instead of the required `{ botId, context: { topic }, format }`). This would have 400'd anyway.

**Note on the deployed version at prism-publication-demo.vercel.app:** that deployment uses a different build (the JS bundles showed hardcoded fake brands — FlexAid, LeanFuel, Calmwave, etc. — with client-side keyword matching). The local prism-demos repo is a cleaner rewrite that was never fully wired up.

---

## What was suggested and what worked

### Fix 1 — Bot responses (`lib/DemoChat.js`)

Replaced the single hardcoded string with per-niche response arrays (6 replies each), randomly picked on each turn. Responses are contextually appropriate per bot:

- **FitTrack** (health-fitness): training consistency, recovery, protein, progressive overload, hydration
- **Calmly** (wellness): stillness, sleep, box breathing, journaling, anchor habits, social connection
- **Confidant** (persona-app): curiosity in conversation, authenticity, confidence, first impressions, humor

**Worked.** Bots now give varied, relevant responses instead of the same dead reply every time.

### Fix 2 — CTA link field name (`lib/DemoChat.js`)

Changed `ad.ctaUrl` → `ad.clickUrl` to match what `toSdkAd()` in `supabase/functions/_shared/ads.ts` actually returns.

**Worked.** CTA buttons now link to the real affiliate URLs.

### Fix 3 — Ad serving (`pages/api/ad/[niche].js`)

Replaced the authenticated SDK endpoint approach (which required unset env vars and a misconfigured request body) with a direct call to the **public Prism demo endpoint**:

```
POST https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/demo/ads
Body: { format: "card", context: { topic: <user message> } }
```

No API key or bot registration needed. Pulls live from the same `ads` table. The user's message text is passed as the topic — `selectAdForRequest` tries to match by ad tags, then falls back to weighted-random from all active ads if no match.

**Worked.** Ads now load on every message from the live ad library.

### Fix 4 — Click tracking (`pages/api/click/[niche].js`)

Replaced the authenticated `trackClick` call (same env var problem) with the public demo track endpoint:

```
POST https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/demo/track/click
Body: { adId }
```

**Worked.** Clicks are now recorded in `ad_events` with `botId = 'demo-public'`.

---

## Files changed (in prism-demos repo)

| File | Change |
|---|---|
| `lib/DemoChat.js` | Added per-niche BOT_REPLIES arrays + getBotReply(); fixed `ad.ctaUrl` → `ad.clickUrl` |
| `pages/api/ad/[niche].js` | Full rewrite — dropped env var / SDK auth approach, now calls `/api/demo/ads` directly |
| `pages/api/click/[niche].js` | Full rewrite — drops `trackClick` from prismClient, now calls `/api/demo/track/click` directly |

---

## What to watch for

- **Ad not appearing:** the 4 affiliate ads need `isActive = true` and no `deletedAt`. If the demo API returns `{ success: true, data: [] }`, the records need checking in Supabase.
- **Topics:** the ads were inserted without known tag values. If `ad.topics` is empty, `selectAdForRequest` falls back to weighted-random pick from all active ads — which is fine for demo purposes.
- **Future:** if you add more ads with specific topic tags (e.g. `["fitness", "health"]`), the matching will get more contextual automatically. No code changes needed.
- **The `lib/bots.js` and `lib/prismClient.js` files are unused by the demo now** but kept in place — they're the right architecture for when real publisher bots are registered with SDK keys and the demo graduates to a proper publisher integration.
