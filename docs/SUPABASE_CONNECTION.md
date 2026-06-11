# Supabase Connection & Credentials (handover)

> ⚠️ **Sensitive.** This file contains the live database password. It lives in the **private**
> `northpointalliance/test1` repo. If this repo is ever made public or leaked, reset the DB password
> in Supabase and update this file. See `secrets/ROTATE_ME.md`.

## Project
- **Project ref:** `botnabfogcjrkpmdjgpr`
- **Project URL:** https://botnabfogcjrkpmdjgpr.supabase.co
- **Region:** `eu-west-2` (London)
- **Postgres version:** 17.6
- **Dashboard:** https://supabase.com/dashboard/project/botnabfogcjrkpmdjgpr

## Database
- **DB password:** `wTEPOX5I6M2DC9dn`
- **Direct host** `db.botnabfogcjrkpmdjgpr.supabase.co:5432` is **IPv6-only** — usually NOT reachable from
  local/Docker (IPv4) networks. Use the **pooler** hosts below (IPv4) instead.

### Connection strings (used in `server/.env`)
```
# DATABASE_URL — transaction pooler (app runtime)
postgresql://postgres.botnabfogcjrkpmdjgpr:wTEPOX5I6M2DC9dn@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# DIRECT_URL — session pooler (Prisma migrations / DDL)
postgresql://postgres.botnabfogcjrkpmdjgpr:wTEPOX5I6M2DC9dn@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```
Note the pooler username is `postgres.<project-ref>` (not just `postgres`), and the host scheme is
`aws-1-eu-west-2` (newer Supabase projects use the `aws-1-` prefix, not `aws-0-`).

## Auth (frontend) — already configured
- `VITE_SUPABASE_URL` / `SUPABASE_URL` = https://botnabfogcjrkpmdjgpr.supabase.co
- `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_3OE-gh5j9AhXsAIlNySH5A_Nqo3VRUi`
  (publishable/anon key — semi-public by design; used for Auth only)

## How the DB was migrated (May–Jun 2026)
- Prisma baseline migration `server/prisma/migrations/0_init` applied via `npm --prefix server run prisma:deploy`.
- 13 app tables created; data migrated from the local Docker Postgres via `pg_dump | psql`.
- Rollback: comment the Supabase URLs in `server/.env`, uncomment the local-docker ones, restart.

## Other service credentials
Stored in `server/.env` / `.env` and backed up in `secrets/`. PayPal creds are currently placeholders
(sandbox not yet configured). Admin/SDK keys are dev-only values — replace before production.
