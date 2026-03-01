# Prism — Setup & Handoff Guide

> Written for non-technical operators. No coding experience required to follow this guide.
> If something breaks, the "Who to call" section at the bottom tells you what to hand to a developer.

---

## What is Prism?

Prism is an ad marketplace that connects three types of users:

| Who | What they do |
|-----|-------------|
| **Advertisers** | Pay to run ads inside AI chatbots |
| **Publishers (Bot Developers)** | Register their bots to show ads and earn money |
| **Admins** | Review ads, approve payouts, and configure platform settings |

The platform has a website (public marketing pages) and a private app (the three portals above).

---

## The Two Config Files You Need to Fill In

There are two plain text files that control how the platform connects to external services. Both are named `.env` and live in different folders. Think of them as a list of passwords and settings.

> **How to edit them:** Open the file in any text editor (Notepad, TextEdit, VS Code). Change the value after the `=` sign. Do not add spaces around the `=`. Save the file.

---

### File 1 — Frontend settings
**Location:** `AIADS/.env`

```
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_PAYPAL_CLIENT_ID="your-paypal-client-id"
```

| Setting | What it does | Where to get it |
|---------|-------------|-----------------|
| `VITE_SUPABASE_PROJECT_ID` | Identifies your Supabase project | Supabase dashboard → Project Settings → General → Reference ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public API key for login | Supabase dashboard → Project Settings → API → `anon` key |
| `VITE_SUPABASE_URL` | URL of your Supabase project | Supabase dashboard → Project Settings → API → Project URL |
| `VITE_PAYPAL_CLIENT_ID` | *(Optional)* Fallback PayPal client ID for the browser | PayPal Developer Dashboard → My Apps → your app → Client ID |

> **Note:** `VITE_PAYPAL_CLIENT_ID` is now optional. The frontend automatically fetches the active PayPal Client ID from the backend (whatever the admin saved via Admin → Settings → PayPal Gateway). You only need to set this as a fallback for local development before credentials are entered. Set it to `"test"` for dummy PayPal buttons with no real payments.

---

### File 2 — Backend (server) settings
**Location:** `AIADS/server/.env`

```
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
PRISM_API_KEY="replace-with-strong-random-key"
ADMIN_API_KEY="replace-with-strong-random-key"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_MODE="sandbox"
PAYPAL_WEBHOOK_ID="your-webhook-id"
```

| Setting | What it does | Where to get it |
|---------|-------------|-----------------|
| `DATABASE_URL` | Connection string to your PostgreSQL database | Your hosting provider (Railway, Render, Supabase DB, etc.) |
| `SUPABASE_URL` | Same as frontend — server also verifies logins | Same as above |
| `SUPABASE_PUBLISHABLE_KEY` | Same as frontend anon key | Same as above |
| `PRISM_API_KEY` (or `BOTGRID_API_KEY`) | Secret key that AI bots use to request ads | Generate a random 32+ character string (see below) |
| `ADMIN_API_KEY` | Secret key for admin API calls | Generate a different random 32+ character string |
| `PAYPAL_CLIENT_ID` | Same value as `VITE_PAYPAL_CLIENT_ID` | PayPal Developer Dashboard |
| `PAYPAL_CLIENT_SECRET` | Private PayPal key (never share this) | PayPal Developer Dashboard → your app → Secret |
| `PAYPAL_MODE` | `sandbox` = test mode, `live` = real money | Set to `live` when ready for real payments |
| `PAYPAL_WEBHOOK_ID` | Lets PayPal notify you of payment events | See PayPal Webhooks section below |

#### How to generate a random secret key
Go to [randomkeygen.com](https://randomkeygen.com) and copy any key from the "Fort Knox Passwords" section. Use a different one for `PRISM_API_KEY` and `ADMIN_API_KEY`.

---

## Service Accounts You Need

### 1. Supabase (handles user login)
- Go to [supabase.com](https://supabase.com) → New Project
- Free tier is fine for getting started
- Copy the **Project URL**, **anon key**, and **Reference ID** into both `.env` files
- To add users: Supabase dashboard → Authentication → Users → Invite user

### 2. PayPal Developer (handles payments)
- Go to [developer.paypal.com](https://developer.paypal.com) → Log In with your PayPal business account
- Click **My Apps & Credentials**
- Create an app (or use the default sandbox app)
- Copy **Client ID** and **Secret** into `server/.env`
- The same **Client ID** goes into the frontend `.env` as `VITE_PAYPAL_CLIENT_ID`

#### Switching from Test to Live payments
**Recommended (no restart needed):**
1. Log into Admin portal → Settings → PayPal Gateway
2. Paste your **Live** Client ID and Live Secret (different from sandbox credentials)
3. Switch the toggle to `live`
4. Click Save — takes effect immediately

**Alternative (via `.env`):**
1. In `server/.env`, change `PAYPAL_MODE="sandbox"` → `PAYPAL_MODE="live"`
2. Replace `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` with **Live** credentials
3. Restart the server
4. Note: credentials set in the Admin console take priority over `.env` values

#### Setting up PayPal Webhooks
Webhooks let PayPal automatically tell Prism when a payment succeeds or fails.

1. In PayPal Developer Dashboard → your app → **Webhooks** → Add Webhook
2. Enter URL: `https://yourdomain.com/api/webhooks/paypal`
3. Check these events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REVERSED`
   - `PAYOUT_ITEM.SUCCEEDED`
   - `PAYOUT_ITEM.FAILED`
4. Copy the **Webhook ID** shown after saving → paste into `PAYPAL_WEBHOOK_ID` in `server/.env`

### 3. PostgreSQL Database
The platform needs a database to store campaigns, bots, wallets, and payouts. Options:

| Provider | Notes |
|----------|-------|
| [Railway](https://railway.app) | Easiest, one-click Postgres, free tier available |
| [Render](https://render.com) | Also easy, free tier available |
| [Supabase DB](https://supabase.com) | Your Supabase project includes a Postgres DB |
| Local (Docker) | For development only — not suitable for production |

After creating the database, copy the **connection string** (looks like `postgresql://user:password@host:5432/dbname`) into `DATABASE_URL` in `server/.env`.

---

## Admin Portal — First-Time Setup

Once everything is running, log into the Admin portal at `/app/admin`:

1. **Set the Platform Fee** (Settings tab)
   - This is the percentage Prism keeps from publisher earnings
   - Default recommendation: 30%

2. **Enter PayPal Credentials** (Settings tab)
   - Paste your Client ID and Client Secret
   - Choose Sandbox (testing) or Live (real money)
   - Click Save — takes effect immediately, no restart needed

3. **Review the first ad** (Review Queue tab)
   - New advertiser campaigns go here before going live
   - Click Approve or Reject

4. **Process publisher payouts** (Finance tab → Payouts sub-tab)
   - Pending payout requests appear here
   - Click "Pay via PayPal" to send money directly
   - Or "Mark Paid" if you sent payment manually

---

## User Roles Explained

| Role | Portal | What they can do |
|------|--------|-----------------|
| `advertiser_owner` | `/app/advertiser` | Create/manage campaigns, top up wallet via PayPal |
| `advertiser_member` | `/app/advertiser` | Same as owner (read + write) |
| `publisher_owner` | `/app/publisher` | Register bots, manage SDK keys, request payouts |
| `publisher_dev` | `/app/publisher` | Same as owner |
| `admin` | `/app/admin` | Review ads, manage payouts, configure PayPal & fees |
| `super_admin` | `/app/admin` | Same as admin |
| `reviewer` | `/app/admin` | Review queue only |

To assign a role: ask your developer to run the database seed script or update the `Membership` table directly.

---

## Day-to-Day Operations

### Someone says "my ad isn't showing"
1. Log into Admin portal → Review Queue
2. Find the ad — it's probably stuck in "Pending" status
3. Click Approve

### A publisher wants their money
1. Log into Admin portal → Finance → Payouts tab
2. Find their pending payout request
3. Click "Pay via PayPal" (requires PayPal credentials to be configured)

### An advertiser's payment didn't go through
1. Check Admin portal → Finance → Top-Ups tab to see if it was recorded
2. If missing, check the PayPal dashboard for the transaction
3. If PayPal shows it as completed but Prism doesn't, tell your developer to check the webhook logs

### You need to block an ad that's already live
1. Log into Admin portal → Review Queue → Live Ads section
2. Find the ad → click "Take Down"

---

## What to Give a Developer if Something Breaks

If you need a developer to fix something, give them:

1. **The exact error message** shown on screen (take a screenshot)
2. **Which page** you were on (`/app/advertiser`, `/app/publisher`, etc.)
3. **What you were trying to do** (approve an ad, top up wallet, etc.)
4. **The contents of both `.env` files** — with secrets replaced by `[REDACTED]` for safety
5. Access to the server logs (found at `/tmp/server.log` if running locally)

Key files a developer will want to look at:
- `server/src/routes/` — all API logic
- `server/src/audit.js` — log of every admin action
- `server/prisma/schema.prisma` — database structure

---

## Quick Reference

| Thing | Where |
|-------|-------|
| Website home | `https://yourdomain.com` |
| App login | `https://yourdomain.com/app/login` |
| Admin portal | `https://yourdomain.com/app/admin` |
| API health check | `https://yourdomain.com/api/health` |
| Frontend config | `AIADS/.env` |
| Backend config | `AIADS/server/.env` |
| PayPal dashboard | [developer.paypal.com](https://developer.paypal.com) |
| Supabase dashboard | [app.supabase.com](https://app.supabase.com) |
