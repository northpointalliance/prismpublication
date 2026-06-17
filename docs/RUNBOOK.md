# Prism — Runbook (operations & troubleshooting)

Day-2 operations and a symptom→fix guide built from real incidents during the migration/cutover.
Master doc: [../HANDOVER.md](../HANDOVER.md).

---

## Routine operations

### Deploy the frontend
Just push to `main` → Vercel auto-builds & deploys. Manual: Vercel → Deployments → **Redeploy**
(uncheck "Use existing Build Cache" if env vars changed). Roll back: **Promote** a previous deployment.

### Deploy the backend (Edge Functions)
```bash
supabase login                                   # one-time (browser, your own account)
supabase link --project-ref botnabfogcjrkpmdjgpr
~/.deno/bin/deno check --config supabase/functions/deno.json supabase/functions/api/index.ts   # typecheck first
supabase functions deploy api
supabase functions deploy queue-worker
```
(Once `SUPABASE_ACCESS_TOKEN` is a GitHub repo secret, push-to-deploy handles this automatically.)

### View logs
Supabase Dashboard → Edge Functions → `api` (or `queue-worker`) → **Logs**. CLI: `supabase functions logs api`.

### Set / change a function secret
```bash
supabase secrets set KEY="value"        # then redeploy so warm instances pick it up:
supabase functions deploy api
```

### Inspect the queue
```sql
SELECT jobname, schedule, active FROM cron.job;
SELECT * FROM pgmq.metrics('webhook_processing');
SELECT * FROM pgmq.metrics('payout_processing');
```

### Connect to the DB (psql)
Use the **pooler** strings in [SUPABASE_CONNECTION.md](SUPABASE_CONNECTION.md) (the direct `db.<ref>` host is
IPv6-only). From this machine, `docker exec aiads-postgres psql '<session-pooler-url>'` works (the container
has matching PG tools).

---

## Troubleshooting (symptom → cause → fix)

### Frontend is a blank white page
**Cause:** the `VITE_*` env vars weren't set in Vercel **at build time**, so `supabase.createClient(undefined,…)`
throws (`Uncaught Error: supabaseUrl is required.`). Vite inlines env at build time.
**Fix:** Vercel → Settings → Environment Variables → add all four `VITE_*` (Production + Preview) →
**Redeploy with "Use existing Build Cache" unchecked.** (Values: [FRONTEND_DEPLOY.md](FRONTEND_DEPLOY.md).)

### "error loading dynamically imported module" / chunk fails / endless reload loop
Two possible causes:
1. **Service worker** (now removed). An old SW cached/looped chunk requests. Fix is already shipped
   (`main.tsx` unregisters, `service-worker.js` self-destructs). A stuck visitor just needs a **hard refresh**
   (Ctrl/Cmd+Shift+R); the SW cleans itself up.
2. **Domain split-brain** during a half-finished domain move: the custom domain was added in Vercel (so the
   `.vercel.app` URL 307-redirects to it) but DNS still pointed elsewhere → chunk requests bounced to a
   different origin. **Fix:** finish the DNS move (point the domain at Vercel) — see "Domain still served by
   the old tunnel" below.

### Vercel build fails: `ENOENT … src/integrations/supabase/client`
**Cause:** a bare folder name in `.vercelignore` (e.g. `supabase`) matched the nested `src/integrations/supabase/`.
**Fix:** anchor ignore patterns to the repo root with a leading slash (`/supabase`, `/server`, …). Already done.

### Vercel: "deployment blocked — commit author did not have contributing access" (Hobby)
**Cause:** Vercel Hobby only deploys commits whose author is the account owner; it can't add team members.
**Fix:** author commits as the client's GitHub identity. This repo's git is already set to
`northpointalliance <20086637+northpointalliance@users.noreply.github.com>`. Verify with `git log -1 --pretty='%an <%ae>'`.
Long-term: upgrade Vercel to **Pro** (then you can add members and author normally).

### Login doesn't work on the live domain
**Cause:** the domain isn't in Supabase Auth's allowlist.
**Fix:** Dashboard → Authentication → URL Configuration → **Site URL** = `https://prismpublication.com`,
add `https://prismpublication.com/**` + `https://www.prismpublication.com/**` to **Redirect URLs**.

### API calls blocked by CORS
**Cause:** the frontend origin isn't in `API_CORS_ORIGIN`.
**Fix:** `supabase secrets set API_CORS_ORIGIN="https://prismpublication.com,https://www.prismpublication.com,https://prismpublication.vercel.app,http://localhost:5173"`
then `supabase functions deploy api`. Verify with a preflight:
```bash
curl -sI -X OPTIONS https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/blog \
  -H "Origin: https://prismpublication.com" -H "Access-Control-Request-Method: GET" | grep -i access-control-allow-origin
```

### Edge-function request count is unexpectedly high (>1k)
**Cause:** a client-side reload loop (historically the service worker) re-firing API calls on every reload.
**Fix:** the SW is removed; counts should be normal. If it recurs, check for any reintroduced SW / a redirect
loop and inspect the Network tab for repeated identical requests.

### Domain still served by the old Cloudflare tunnel (not Vercel)
**Fix (complete the cutover):** in Vercel → Domains, add `prismpublication.com` (+`www`) and read the records
it shows. In Cloudflare DNS: delete the `*.cfargotunnel.com` CNAMEs for `@`/`www`, add Vercel's records
(`A @ 76.76.21.21`, `CNAME www cname.vercel-dns.com`), set both to **DNS-only (grey cloud)** so Vercel handles
SSL. Verify: `curl -sI https://prismpublication.com | grep -i server` → `Vercel`.

### Queue not draining (webhooks/payouts stuck)
**Check:** `SELECT * FROM cron.job WHERE jobname='drain-queues';` (active?), `SELECT * FROM pgmq.metrics('payout_processing');`
(growing queue_length?). Manually trigger the worker:
```bash
curl -s -X POST https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/queue-worker \
  -H "x-worker-secret: <ADMIN_API_KEY>"
```
Causes: `ADMIN_API_KEY` mismatch between the secret and the pg_cron header; `pg_net`/`pg_cron` disabled;
worker errors (check its logs).

### Supabase advisor warnings
- `rls_enabled_no_policy` (INFO, ×tables) → **expected/intended** (deny-all). Leave them.
- `pg_net in public` (WARN) → **benign**; non-relocatable, functions live in `net` schema. Leave it.
- `leaked_password_protection` → enable in Dashboard → Authentication → Attack Protection.
- `rls_disabled_in_public` (CRITICAL) → would mean a table lost RLS; re-run `supabase/rls.sql`.

---

## Rotating the DB password (cascade)
Resetting the Supabase DB password touches several places — update **all** of them or things break:
1. Supabase Dashboard → Database → **Reset database password** → copy new password.
2. `supabase secrets set DB_URL="postgresql://postgres.botnabfogcjrkpmdjgpr:<NEW>@aws-1-eu-west-2.pooler.supabase.com:6543/postgres"` → `supabase functions deploy api queue-worker`.
3. GitHub repo secret `SUPABASE_DB_PASSWORD` → set to `<NEW>` (for the migrations Action).
4. `server/.env` `DATABASE_URL`/`DIRECT_URL` (only matters if you ever run the legacy stack again).
5. `docs/SUPABASE_CONNECTION.md` (update the documented password).
Then verify `/api/health` → `{"status":"ok","database":"connected"}`. See `secrets/ROTATE_ME.md` for the full key list.

## Decommission reference (already done)
Local stack stopped + disabled, boot watchdog removed:
```bash
sudo systemctl disable --now prism-aiads-tunnel prism-aiads-web prism-aiads-api prism-aiads.target
crontab -l | grep -v 'prism_stack.sh' | crontab -      # remove @reboot autostart
```
Do **not** touch `cloudflared-stolenbikes` / generic `cloudflared.service` (other projects).
To bring the legacy stack back (emergency rollback): `sudo systemctl enable --now prism-aiads-{api,web,tunnel}`
and re-point DNS to the tunnel.
