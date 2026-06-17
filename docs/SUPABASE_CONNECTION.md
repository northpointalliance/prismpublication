# Supabase Connection & Credentials (handover)

> ⚠️ **Sensitive — contains the live database password.** It lives in the **private**
> `northpointalliance/test1` repo. Rotation of this password is **pending** (it also exists in earlier git
> history); see `secrets/ROTATE_ME.md` for the full update cascade. If the repo is ever made public or a
> token leaks, reset the password immediately and update everywhere it's referenced.

## Project
- **Ref:** `botnabfogcjrkpmdjgpr` · **Region:** `eu-west-2` (London) · **Postgres:** 17 · **Plan:** paid
- **URL:** https://botnabfogcjrkpmdjgpr.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/botnabfogcjrkpmdjgpr

## Database
- **DB password:** `wTEPOX5I6M2DC9dn`  *(rotation pending — see ROTATE_ME.md cascade)*
- The **direct** host `db.botnabfogcjrkpmdjgpr.supabase.co:5432` is **IPv6-only** (not reachable from most
  IPv4 / Docker networks). Use the **pooler** hosts below (IPv4). Pooler username is `postgres.<ref>` and the
  host scheme is `aws-1-eu-west-2` (newer projects use `aws-1-`, not `aws-0-`).

### Connection strings
```
# Transaction pooler (app runtime; used for DB_URL function secret + legacy server DATABASE_URL)
postgresql://postgres.botnabfogcjrkpmdjgpr:wTEPOX5I6M2DC9dn@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Session pooler (migrations / DDL; DIRECT_URL)
postgresql://postgres.botnabfogcjrkpmdjgpr:wTEPOX5I6M2DC9dn@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```
Inside this machine you can also reach it via the local container's PG tools:
`docker exec aiads-postgres psql '<session-pooler-url>'`.

## Where this password is referenced (update ALL on rotation)
1. `DB_URL` **Edge Function secret** (Supabase → Edge Functions → Secrets) → then `supabase functions deploy api queue-worker`
2. `SUPABASE_DB_PASSWORD` **GitHub repo secret** (for the migrations Action)
3. `server/.env` `DATABASE_URL`/`DIRECT_URL` (legacy stack only)
4. This doc
5. `secrets/*.env.gpg` (encrypted backups)

## Auth keys (frontend) — already configured
- `VITE_SUPABASE_URL` / `SUPABASE_URL` = https://botnabfogcjrkpmdjgpr.supabase.co
- `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_3OE-gh5j9AhXsAIlNySH5A_Nqo3VRUi` (publishable/anon —
  semi-public by design; safe to ship in the frontend bundle)
- `service_role` key — used by the `api`/`queue-worker` functions (auto-injected as `SUPABASE_SERVICE_ROLE_KEY`);
  retrieve via `supabase projects api-keys --project-ref botnabfogcjrkpmdjgpr` if needed for Storage scripts.

## Auth URL configuration (must match the live domain)
Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://prismpublication.com`
- **Redirect URLs:** `https://prismpublication.com/**`, `https://www.prismpublication.com/**`
- (CORS for the Edge Functions is the separate `API_CORS_ORIGIN` secret — already includes these + the `.vercel.app` URL.)

## History
- DB + data migrated from a local Docker Postgres to Supabase via Prisma baseline migration
  (`server/prisma/migrations/0_init`) + `pg_dump | psql` (June 2026). RLS deny-all then applied (`supabase/rls.sql`).
- The legacy local stack is **decommissioned**; the local Docker Postgres remains only as a pre-migration snapshot.
