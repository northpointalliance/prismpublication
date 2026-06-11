# Secrets backup — read this

This directory contains a backup of the project's environment secrets, committed at the
owner's explicit request.

- `root.env` / `server.env` — **PLAINTEXT** copies of `/.env` and `/server/.env`.
- `root.env.gpg` / `server.env.gpg` — AES256 symmetric-encrypted copies (safe to share). Decrypt with:
  `gpg --decrypt secrets/root.env.gpg`  (you'll be prompted for the passphrase, stored OUTSIDE this repo).

## ⚠️ Exposure warning
Plaintext secrets in git history are **permanent** — deleting the files later does NOT remove them from
history, clones, or GitHub's cache. This is only acceptable while `northpointalliance/test1` stays
**private**. If this repo is ever made public, forked publicly, or a token leaks, treat ALL of the
following as compromised and rotate them immediately:

- [ ] `PAYPAL_CLIENT_SECRET` (and `PAYPAL_CLIENT_ID`) — PayPal developer dashboard
- [ ] `PAYPAL_WEBHOOK_ID` — re-create the webhook
- [ ] `ADMIN_API_KEY` — regenerate + redeploy
- [ ] `PRISM_API_KEY` (master SDK key) — regenerate + re-issue to SDK consumers
- [ ] Supabase keys (`SUPABASE_PUBLISHABLE_KEY` / service role) — Supabase dashboard → API → roll keys
- [ ] `DATABASE_URL` / `DIRECT_URL` password — reset the Postgres password in Supabase
- [ ] `UPSTASH_REDIS_REST_TOKEN` — Upstash console
- [ ] `SENTRY_DSN` — Sentry project settings
- [ ] `LOVABLE_API_KEY` — Lovable AI gateway

## Recommendation
Prefer the encrypted `.gpg` copies and a vault (Doppler / 1Password / Supabase secrets) over plaintext.
