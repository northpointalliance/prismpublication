# Publisher smoke test — live site (2026-07-16)

Timed walkthrough of whether a real developer can use Prism today: register a bot, get SDK keys, and receive ads from the library.

**Tester:** Cursor agent (browser + API)  
**Environment:** Production (`prismpublication.com`)

---

## Executive summary

| Layer | Works today? | Notes |
|---|---|---|
| Public demo (`/demo`) | **Yes** | Live ads from DB; first ad ~18s into scripted playback |
| Demo API (`POST /api/demo/ads`) | **Yes** | ~1.0s response; returns card from ad library |
| npm SDK (`@prismpublication/sdk`) | **Yes** | v1.0.0 on npm; install ~6s |
| Publisher signup → bot → SDK key | **Not verified** | Requires account; login page loads |
| Production `POST /api/ads` with bot key + HMAC | **Not verified** | Needs portal-issued key |

**Bottom line:** Ad serving from the library **works** on the public demo path. The full publisher SDK path is **documented and wired in code**, but end-to-end verification stops at login without a test account.

---

## Timings

| Step | Duration | Result |
|---|---|---|
| API health check | **447ms** (curl) | `{"status":"ok","database":"connected"}` |
| Demo ad request (`POST /api/demo/ads`) | **~1.0s** | Notion AI card returned |
| npm install `@prismpublication/sdk` | **~6.0s** | 28 packages, no errors |
| Demo page → first ad visible | **~18s** | "Try Notion AI" sponsored card inline |
| Publishers landing load | **<3s** | Marketing page OK |
| Docs page load | **<3s** | SDK overview OK |

---

## What we verified

### 1. Ad library → live demo (PASS)

Demo API request:

```json
POST /api/demo/ads
{ "format": "card", "context": { "topic": "wellness workout recovery" } }
```

Response (abbreviated):

```json
{
  "success": true,
  "data": [{
    "id": "cmmdrmbrk0002nnwqy2x6twlj",
    "title": "Try Notion AI — Your Second Brain",
    "advertiser": "Enmanuel Yasell Advertiser Workspace",
    "tags": ["ai", "notes", "productivity", ...]
  }]
}
```

On `/demo`, clicking **Start Demo** showed the same Notion AI card inline after the first bot reply. Counter showed **1 Ads Served**.

### 2. SDK package (PASS)

```bash
npm install @prismpublication/sdk
# → version 1.0.0 published on npm
```

Docs page shows correct install command and REST base URL.

### 3. Developer instructions (PARTIAL)

Documented path for a real publisher:

1. Sign up at `/app/login`
2. Choose **Publisher** workspace
3. **Register Bot** (name + environment) → auto SDK key
4. Copy token (shown once)
5. `npm install @prismpublication/sdk`
6. Server-side: `POST /api/ads` with `botId`, API key, HMAC headers
7. Track impressions via `POST /api/track/impression`

Portal UI exists in code (`RegisterBotPanel`, `BotRegistry`, `SdkDocsTab`). Full portal flow was **not** exercised (no credentials).

---

## Screenshots (knowledge center)

Captured during this run:

| File | Screen |
|---|---|
| [kc-02-publishers-landing.png](./kc-02-publishers-landing.png) | `/publishers` hero + integration steps |
| [kc-03-demo-ad-served.png](./kc-03-demo-ad-served.png) | `/demo` with live Notion AI sponsored card |
| [kc-04-docs-developer.png](./kc-04-docs-developer.png) | `/docs` developer experience + SDK tiles |

Local copies live in `docs/knowledge-center/`.

---

## Known gaps for real developers

1. **Auth on live domain** — Supabase redirect URLs for `prismpublication.com` were a known pending item; confirm signup/login works before onboarding docs go wide.
2. **HMAC required** — SDK must sign requests (`X-Prism-Timestamp`, `X-Prism-Signature`); docs explain this but it adds integration friction vs demo API.
3. **Full docs behind portal** — Public `/docs` is overview; detailed SDK reference is in Publisher Portal **SDK Docs** tab after login.
4. **No step-by-step portal onboarding** — Dashboard exists but HANDOVER notes missing guided first-run checklist.

---

## Recommended next test (with your account)

1. Sign up as publisher (~2 min)
2. Add bot "Test Wellness Bot" (~30 sec)
3. Copy SDK key (~10 sec)
4. Run minimal Node script calling `POST /api/ads` (~5 min)
5. Confirm fill from ad library + impression tracked

Target: **under 10 minutes** for a developer who already has Node installed.

---

## Quick API reference

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/health` | None | Status |
| `POST /api/demo/ads` | None | Public demo ad fetch |
| `POST /api/ads` | SDK key + HMAC | Production ad fetch |
| `POST /api/track/impression` | SDK key + HMAC | Billing / metrics |

Base URL: `https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api`  
(Also proxied at `https://prismpublication.com/api/*`)
