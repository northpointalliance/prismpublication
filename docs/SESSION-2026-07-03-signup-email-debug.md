# Session Log: Signup Email Debugging — 2026-07-03

_Last updated: 2026-07-03 19:10 IDT_

## Goal
Dan created a test publisher account with dan73ros@gmail.com and got no email. Figure out why, and make sure Dan (the owner) gets notified whenever a real publisher or advertiser signs up.

## What went wrong

Two completely separate email systems got tangled together, and both turned out to be broken in different ways.

### 1. The admin alert email (`notify-signup`) was never turned on
`supabase/functions/notify-signup/index.ts` was written in the 2026-06-26 session to email `dan72ros@gmail.com` every time someone signs up, triggered by a Supabase Database Webhook on `INSERT` to `auth.users`. That session's notes explicitly flagged it as "not yet deployed." Confirmed this session via a Gmail search (`in:anywhere`, no date filter) — zero emails have ever arrived from that pipeline, at any point. It was written but never deployed, and the webhook was never created.

### 2. Supabase Auth's built-in confirmation email started failing live
Separately, Dan had set up custom SMTP through Resend for Supabase Auth about a week before this session ("it is supposed to work"). But signing up a real test account (dan73ros@gmail.com) produced a visible red error on the signup form: **"Error sending confirmation email."** This string doesn't exist anywhere in the Prism codebase — it's Supabase's own GoTrue error, meaning the SMTP send itself was failing at signup time, not silently dropping to spam.

Root cause: the Resend sending domain was never actually verified. On `resend.com/domains/add`, the **Name** field had been submitted as `https://prismpublication.com/` (full URL, with protocol and trailing slash) instead of the bare domain `prismpublication.com`. Resend flagged this as invalid, so the domain was never checked/added, and any mail sent from an `@prismpublication.com` address had nowhere valid to route through.

After fixing the domain field to just `prismpublication.com`, Resend generated the required DNS records (DKIM, SPF, DMARC, MX) and offered a one-click **"Go to Cloudflare"** auto-configure button (detected because the domain's DNS lives on Cloudflare). That button failed to connect this session, despite Dan having used it successfully before. Root cause of that specific failure was not resolved — deferred rather than blocking the actual goal.

## What we did to fix it

Rather than keep chasing DNS/Resend verification (which wasn't the real blocker — Dan doesn't actually need publishers to receive a confirmation email, he needs *himself* notified), we split the fix in two:

**A. Unblock real signups now, no DNS dependency:**
Recommended turning OFF "Confirm email" in Supabase dashboard → Authentication → Settings. This stops Supabase from attempting to send any email during signup at all, so the "Error sending confirmation email" failure can't happen — accounts get created instantly. This is independent of Resend/domain verification entirely.

**B. Get the owner-notification email working, also with no DNS dependency:**
Edited `supabase/functions/notify-signup/index.ts`: changed `NOTIFY_FROM` from `"Prism Alerts <alerts@prismpublication.com>"` (the unverified custom domain) to `"Prism Alerts <onboarding@resend.dev>"` — Resend's shared test sender, which works immediately with just a valid `RESEND_API_KEY` and zero domain setup. Comment left in the code to swap back to the branded address once `prismpublication.com` shows "Verified" in Resend.

Provided Dan with dashboard-only steps (no CLI) to:
1. Deploy `notify-signup` via Supabase Dashboard → Edge Functions → Deploy a new function (code pasted directly into the browser editor)
2. Confirm/set the `RESEND_API_KEY` secret under Edge Functions → Secrets
3. Create a Database Webhook: schema `auth`, table `users`, event `Insert`, type Edge Function, target `notify-signup`
4. Test with a fresh signup and check dan72ros@gmail.com

## Files changed this session
- `supabase/functions/notify-signup/index.ts` — `NOTIFY_FROM` switched to Resend's shared `onboarding@resend.dev` sender to remove the domain-verification dependency. Later reverted to the branded `alerts@prismpublication.com` once the domain verified (see Resolution below).

## Domain got verified — then a second, bigger surprise turned up

Later the same day, `prismpublication.com` finished verifying in Resend. The Cowork Supabase connector also got reconnected, which for the first time gave direct read/write access to the actual project (`botnabfogcjrkpmdjgpr`) instead of only dashboard-click instructions. That direct access uncovered something important:

**There were two competely separate, previously-unknown-to-each-other notification systems already fighting for the same job:**

1. The `notify-signup` Edge Function this session had been iterating on (fires on `auth.users` INSERT, admin-alert email, code lives in this repo).
2. A **pre-existing Postgres trigger `on_publisher_signup`** on `public.organizations`, calling a function `notify_publisher_signup()` — written by someone/something else (likely an earlier Lovable-assisted session, not part of this repo's tracked code), firing whenever a new `organizations` row is inserted with `type` of `publisher` or `advertiser`. This is actually the *more correct* signal — a bare `auth.users` row doesn't yet know if someone is a publisher or advertiser; the `organizations` insert (created via the Choose Workspace step) does.

Worse: `notify_publisher_signup()` had a **live Resend API key hardcoded in plaintext directly in the SQL function body** (`re_5JoV23Vw_...`). That's a real secret sitting unencrypted in the database, discoverable by anyone able to read function definitions.

Also found: the Edge Function actually deployed under the `notify-signup` slug in Supabase did **not** match this repo's code at all — it was a generic AI-scaffolded template (sends a "Welcome!" email to the *new signer-upper*, not an admin alert; `verify_jwt` was `true`, which would have silently 401'd any database webhook call before the code even ran). And no Database Webhook trigger existed on `auth.users` at all — so neither version could have ever fired.

## Resolution (same session, via direct Supabase access)

1. Redeployed `notify-signup` with this repo's correct code, `verify_jwt: false` (required — database webhooks don't send user JWTs).
2. Confirmed no webhook/trigger existed on `auth.users` (`information_schema.triggers` returned empty).
3. Decided **not** to wire a new `auth.users` trigger. Instead, kept the pre-existing `organizations`-based trigger since it's the semantically correct signal ("a publisher or advertiser signed up," not "literally anyone created an account").
4. Fixed the exposed secret: moved the Resend API key into **Supabase Vault** (`vault.create_secret`) and rewrote `notify_publisher_signup()` to read it from there instead of hardcoding it. Also pinned `search_path` and revoked direct RPC execute access from `anon`/`authenticated` (the Supabase security advisor flagged both functions as publicly callable via `/rest/v1/rpc/...`, which they should never be — they're only meant to run via their triggers).
5. Reverted `notify-signup`'s `NOTIFY_FROM` back to the branded `alerts@prismpublication.com` now that the domain is verified.
6. **Tested end-to-end**: inserted a throwaway `organizations` row (`type: 'publisher'`), confirmed via `net._http_response` that Resend returned a real message ID, confirmed the email actually landed in dan72ros@gmail.com ("New publisher signed up: Test Trigger Check Publisher"), then deleted the test row.

**Confirmed working as of 2026-07-03 14:20 UTC**: any new row in `public.organizations` with `type = 'publisher'` or `type = 'advertiser'` now reliably emails dan72ros@gmail.com and info@prismpublication.com.

## Still worth doing
1. **Rotate the Resend API key** (`re_5JoV23Vw_...`) in the Resend dashboard as a precaution — it sat hardcoded in plaintext SQL for an unknown period before this fix, even though it's now moved to Vault with restricted access.
2. **Confirm signup + password reset work for a real user now that the domain is verified.** This session proved the *admin notification* path end-to-end, but the original complaint (dan73ros@gmail.com never got a confirmation or password-reset email) was tested against Supabase Auth's own SMTP path, which isn't controllable via SQL/direct DB access — that needs one real signup/reset attempt from the actual login page to confirm it's fixed now that the domain shows Verified.
3. Consider whether `notify-signup` (the Edge Function) is still needed at all now that the `organizations` trigger covers the actual use case — it's left deployed and working but currently has nothing wired to call it.

---

## Part 2: Welcome email + real onboarding blockers found (2026-07-03, ~17:00–19:10 IDT)

### Welcome email now links to the integration docs (~17:00 IDT)
Dan asked that when a publisher/advertiser signs up, the welcome email include a link to the actual integration steps, not just a generic "you're in." Added an `id="integration-flow"` anchor to the public `/docs` page (the "Four steps to your first ad" section) and updated `notify_new_member_welcome()` (a new Postgres trigger on `organization_members` INSERT for `publisher_owner`/`advertiser_owner` roles — separate from the admin-alert trigger in Part 1) to include a styled link to `https://prismpublication.com/docs#integration-flow` for publishers, or a campaign-setup nudge for advertisers. Tested end-to-end with a throwaway signup using Dan's real dan73ros@gmail.com test account — confirmed via Resend response IDs.

### Dan tried a real signup and hit a wall of friction (~17:30 IDT)
Dan actually tried to onboard as a publisher end-to-end and reported "massive headaches" — enough that he said a real third-party developer would hit "full game over." Investigation found this wasn't him doing anything wrong:

1. **`npm install @prism/sdk` (the package shown in every doc/code example) has never been published to npm.** Confirmed via direct registry check (404). Step 1 of the "Four steps" fails for literally everyone who tries it.
2. **The SDK Docs tab's REST/curl examples pointed at `https://api.prism.so`** — a domain that doesn't even resolve in DNS (confirmed via `getent hosts`). Should have been `https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api`. Fixed in `SdkDocsTab.tsx` and `docs/FREQUENCY_CAPPING.md`.
3. **Duplicate workspace bug**: querying `organization_members`/`organizations` for dan73ros@gmail.com showed *two* identical publisher workspaces ("Daniel Test Rosenthal Bot Developer Workspace"), created 3 minutes apart on 2026-06-22 — likely a double-submit on the Create Workspace button. Not yet fixed in code; flagged for follow-up.
4. **No in-portal onboarding guidance** — `PublisherPortal.tsx`'s dashboard shows an empty metrics wall (0 bots, $0 revenue) and a bare "Register Bot" form with zero connection to the "4 steps" from the marketing page. Flagged, not yet built.
5. Confirmed the actual SDK source (`packages/sdk/src/index.ts`) was never wrong — it already defaults to the real Supabase URL. Only the *shown examples* were broken, and the package itself had simply never been published.

### Publishing the SDK — needed to match Dan's actual goal (~18:00–19:10 IDT)
Motivation: Dan is building a separate mobile app ("Skylar") using Claude's design tool, and wants to integrate the Prism SDK into it for real — not just fix the docs. That requires the SDK to actually exist on npm.

- Checked `@prism/sdk` scope availability — unclear if Dan could claim the `prism` npm org. Dan created an npm account/org named **`prismpublication`** instead.
- Renamed the package from `@prism/sdk` to **`@prismpublication/sdk`** across all 17 references in the repo (package.json, tsconfig/vite path aliases, source, docs, marketing pages). Rebuilt and verified clean.
- **npm publish saga** (multiple real blockers, in order hit):
  1. PowerShell blocked `npm` entirely ("running scripts is disabled on this system") — worked around by using Command Prompt instead of PowerShell (no security settings changed).
  2. `npm publish` failed with `E403` — npm requires 2FA (or a bypass-2FA granular token) to publish. Dan enabled 2FA via an authenticator app on his npm account.
  3. First publish attempt showed a misleading success-looking line (`+ @prismpublication/sdk@1.0.0`) but the registry kept returning 404 on repeated checks (`registry.npmjs.org` and `npm view`, both directly verified). The browser-based auth-approval step likely wasn't completed the first time.
  4. Retried; this time hit `403 ... cannot publish over a previously published version` for `1.0.0` — npm's version-immutability rule means that version number is permanently burned even though it never became visible. Bumped the package to **`1.0.1`**, rebuilt, and had Dan re-run `npm publish --access public`. **Not yet confirmed successful as of this log entry** — last action was Dan re-running the publish command with the bumped version.
- **Local git got stuck**: a stale `.git/index.lock` file blocked all `git add`/`commit`/`reset` operations, both from this Cowork sandbox (`rm` returned `Operation not permitted`) and from Dan's own Windows machine (`del` also failed with "another git process..."). Root cause not resolved — likely a sync client (OneDrive/Dropbox) or antivirus holding the file open, or a stray git/VS Code process. **As of this log entry, the SDK rename and doc updates in this repo are saved to disk but NOT committed to git or pushed to GitHub/Vercel.**

### Claude Design import attempted, blocked on wrong URL type (~19:05 IDT)
Dan asked to import a separate design file ("Skylar Onboarding.dc.html") from Claude's design tool via Vercel's `import-claude-design-from-url` tool. The link he provided (`https://claude.ai/design/p/<id>?file=...`) is the **editor/viewer page**, not a fetchable file — the tool requires a URL on the `claudeusercontent.com` host specifically, obtained via a **Share/Export/Publish** action on the file inside the Claude Design tool. Import failed with a clear error identifying this; not yet retried with the correct link.

## Status as of 2026-07-03 19:10 IDT (end of session)
- Admin-alert and welcome-email triggers: **confirmed working**.
- SDK rename to `@prismpublication/sdk`: **done in code**, not yet committed to git (stuck lock file).
- npm publish: **in progress**, version bumped to 1.0.1 after burning 1.0.0, last publish attempt result unconfirmed.
- Docs fixes (fake API domain): **done in code**, not yet committed to git.
- Duplicate workspace bug and missing in-portal onboarding guidance: **known, not yet fixed**.
- Claude Design import for "Skylar Onboarding": **blocked on getting the correct claudeusercontent.com link from Dan**.
- Git: local working directory has real, verified changes sitting uncommitted due to a stuck `.git/index.lock`; needs resolving (likely a stray process or sync client on Dan's machine) before any of tonight's code changes can reach GitHub/Vercel.
