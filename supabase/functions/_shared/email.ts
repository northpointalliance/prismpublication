/**
 * Email helper — sends transactional emails via Resend.
 * Requires RESEND_API_KEY to be set as a Supabase function secret.
 *
 * "from" defaults to onboarding@resend.dev (works on Resend free plan without domain verification).
 * Once prismpublication.com is verified in Resend, change the default to noreply@prismpublication.com.
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("email: RESEND_API_KEY not set — skipping");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from ?? "Prism Publication <onboarding@resend.dev>",
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("email: Resend request failed", res.status, text);
  }
}
