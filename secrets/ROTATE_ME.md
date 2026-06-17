# Secrets — backup & rotation

## What's in this folder
- `root.env.gpg` / `server.env.gpg` — **AES256-encrypted** backups of `/.env` and `/server/.env`
  (safe to keep in the repo). Decrypt: `gpg --decrypt secrets/root.env.gpg` (passphrase is stored OUTSIDE
  the repo). The plaintext copies were **removed** from the repo and are gitignored.

## ⚠️ Why rotation is still needed
The plaintext secrets existed in **earlier git history** before removal. Deleting files doesn't purge
history. The repo is **private** (`northpointalliance/test1`), so this is medium-severity — but anyone the
client later grants repo access to (contractors, CI) could read those old values. The clean fix is to
**rotate** the sensitive ones so the historical copies become worthless.

## Current reality (as of handover)
- **Supabase publishable key** — public by design; no action.
- **DB password** (`wTEPOX5I6M2DC9dn`) — **rotate** (in history). Cascade below.
- **`ADMIN_API_KEY` / `PRISM_API_KEY`** — currently **dev placeholders** (`dev_admin_api_key_local_only`,
  `dev_botgrid_api_key_local_only`). Set to strong real values before serious traffic.
- **PayPal** — `PAYPAL_CLIENT_ID/SECRET` were placeholders in env; the **real** PayPal creds live in the
  `platform_settings` DB table (set via Admin → Settings). Rotate those in the PayPal dashboard if exposed.
- **Upstash / Sentry / Lovable** — rotate if you actually use them.

## Rotate the DB password (full cascade — update ALL or the app breaks)
1. Supabase → Database → **Reset database password** → copy `<NEW>`.
2. `supabase secrets set DB_URL="postgresql://postgres.botnabfogcjrkpmdjgpr:<NEW>@aws-1-eu-west-2.pooler.supabase.com:6543/postgres"`
   then `supabase functions deploy api queue-worker`.
3. GitHub repo secret **`SUPABASE_DB_PASSWORD`** = `<NEW>` (migrations Action).
4. `server/.env` `DATABASE_URL`/`DIRECT_URL` (legacy stack only).
5. `docs/SUPABASE_CONNECTION.md` (documented password).
6. Re-encrypt backups: regenerate `secrets/*.env.gpg`.
7. Verify: `curl https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/health` → `database: connected`.

## Rotate the admin / SDK keys
1. Pick strong values (`openssl rand -hex 32`).
2. `supabase secrets set ADMIN_API_KEY="<new>" PRISM_API_KEY="<new>"` → `supabase functions deploy api queue-worker`.
   - ⚠️ `ADMIN_API_KEY` is also the **queue-worker secret** used by the pg_cron header — update the cron job's
     `x-worker-secret` to match (re-create the `drain-queues` job), or the worker stops being triggered.
3. Re-issue `PRISM_API_KEY` to any SDK consumers (it's the master ad-serving key).

## If the repo is ever exposed publicly
Treat all of the above as compromised and rotate immediately. Prefer a vault (Doppler / 1Password /
Supabase secrets) over committing secrets at all.
