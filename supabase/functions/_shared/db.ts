// Postgres client for Edge Functions. Uses postgres.js over the Supabase transaction pooler.
// prepare:false is REQUIRED for the 6543 transaction-mode pooler (no prepared statements).
import postgres from "postgres";
import { dbUrl } from "./config.ts";

export const sql = postgres(dbUrl, {
  prepare: false,
  // Edge invocations are short-lived; keep the pool tiny.
  max: 5,
  idle_timeout: 20,
  connect_timeout: 15,
});

export type Sql = typeof sql;
