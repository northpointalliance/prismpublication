/**
 * notify-signup
 * Fires when a new user registers. Sends an email notification to the admin.
 *
 * Triggered by: Supabase Database Webhook on INSERT to auth.users
 *
 * Required secret (set in Supabase dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY  — get a free key at resend.com
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const NOTIFY_TO = "dan72ros@gmail.com";
const NOTIFY_FROM = "Prism Alerts <alerts@prismpublication.com>";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("NOTIFY_WEBHOOK_SECRET") ?? "";

serve(async (req) => {
  // Optional: verify the webhook secret header so only Supabase can call this
  const secret = req.headers.get("x-webhook-secret");
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Supabase DB webhook sends { type, table, record, old_record }
  const record = payload?.record as Record<string, unknown> | undefined;
  if (!record) {
    return new Response("No record", { status: 400 });
  }

  const email = String(record.email ?? "unknown");
  const id = String(record.id ?? "unknown");
  const createdAt = String(record.created_at ?? new Date().toISOString());

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — skipping email");
    return new Response("Missing RESEND_API_KEY", { status: 500 });
  }

  const emailBody = {
    from: NOTIFY_FROM,
    to: [NOTIFY_TO],
    subject: `New Prism signup: ${email}`,
    html: `
      <p>Someone just created a Prism account.</p>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td><strong>${email}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">User ID</td><td><code>${id}</code></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Signed up</td><td>${new Date(createdAt).toLocaleString()}</td></tr>
      </table>
      <p style="margin-top:16px">
        <a href="https://supabase.com/dashboard/project/botnabfogcjrkpmdjgpr/auth/users"
           style="background:#6C47FF;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;">
          View in Supabase
        </a>
      </p>
    `,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(emailBody),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    return new Response("Email failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
