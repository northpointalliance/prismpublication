-- Row-Level Security for all public tables.
--
-- WHY: PostgREST (https://<ref>.supabase.co/rest/v1/...) exposes every `public` table to the public
-- anon/publishable key (which ships in the frontend bundle). With RLS disabled this lets anyone read,
-- edit, and delete all data. Enabling RLS with NO policies = deny-all for anon/authenticated.
--
-- SAFE FOR THIS APP: nothing accesses these tables through PostgREST. The Edge Functions connect as the
-- table-owner `postgres` role (postgres.js) which BYPASSES RLS, and Storage uses the service-role key.
-- So deny-all closes the hole without breaking the app. (Add policies only if you ever want direct
-- from-browser table access via the anon key.)
--
-- RE-RUN this after any `prisma migrate deploy` that creates new tables (Prisma does not manage RLS).
-- Idempotent: ENABLE ROW LEVEL SECURITY is a no-op if already enabled.

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- Verify: every public table should report rowsecurity = true.
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
