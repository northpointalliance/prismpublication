# Multi-Portal Platform Plan (Advertisers + Bot Developers + Admin)

## Objective
Replace the single advertiser-only plan with a full platform plan that supports:
- Advertisers who buy inventory
- Bot Developers (publishers) who integrate SDK and monetize bots
- Platform Admins who run policy, quality, billing, and operations

Use one unified login entrypoint, then route users by selected role/workspace.

## Portal Overview

## 1) Advertiser Portal
Who uses it:
- Brand, agency, growth, performance teams

What they see:
- Account and team
- Campaigns and ad creatives
- Targeting and budget controls
- Approval status and policy feedback
- Performance reporting (impressions, clicks, CTR, spend)

What they can do:
- Create/edit campaigns
- Upload creatives by format (`text`, `card`, `banner`)
- Set daily/total budget caps
- Submit for review, pause/resume approved campaigns
- View and export reports

## 2) Bot Developer Portal
Who uses it:
- Bot builders, publishers, AI product teams

What they see:
- Bots and environments (dev/staging/prod)
- SDK keys and integration settings
- Placement rules and ad frequency controls
- Revenue dashboard and payout history
- Bot-level ad quality/performance

What they can do:
- Register/manage bots
- Generate/rotate SDK keys
- Configure placement rules (frequency, topics, exclusions)
- View serving health and integration diagnostics
- Manage payout and tax profile

## 3) Admin Portal (Platform Operator)
Who uses it:
- You and internal operators/reviewers

What you see:
- Global system overview and health
- Advertiser queue and campaign moderation
- Bot developer approvals and integration quality checks
- Fraud/risk alerts
- Billing/payout controls
- Support and audit logs

What you can do:
- Approve/reject campaigns and bots
- Override statuses and freeze entities
- Tune serving constraints globally
- Manage users, roles, and organization access
- Review incident timelines and event logs

## Access and Role Model

## Identity
- Supabase Auth for user sign-in/session.
- Local DB as source of truth for business entities and authorization mapping.
- No separate advertiser vs publisher login pages.
- One login, then role/workspace selection.

## Organization Model
- Every user belongs to at least one organization.
- Organization type: `advertiser_org`, `publisher_org`, or both.

## Roles
- Advertiser side:
  - `advertiser_owner`
  - `advertiser_member`
  - `advertiser_finance`
- Bot developer side:
  - `publisher_owner`
  - `publisher_dev`
  - `publisher_ops`
- Platform side:
  - `reviewer`
  - `admin`
  - `super_admin`

## Unified Login and Role Selection Flow
1. User opens `/app/login` and signs in.
2. System checks memberships in `organization_members`.
3. If user has one valid workspace, redirect directly to that portal.
4. If user has multiple workspaces/roles, show `/app/choose-workspace`:
  - "I am an Advertiser"
  - "I am a Bot Developer"
  - Admin options if role exists
5. Save last selection as `default_workspace_id` + `default_role`.
6. Future logins go directly to default portal, with a "switch workspace" control in app header.

Benefits:
- Less friction (one auth flow).
- Cleaner onboarding.
- Easier for users who operate both demand and supply sides.

## Main System Flows

## A) Advertiser Campaign Lifecycle
1. Create campaign draft.
2. Add creatives + targeting + budget.
3. Submit for review.
4. Reviewer decision:
  - Approve -> campaign can go live.
  - Reject -> advertiser receives reason and edits.
5. Live campaign serves if:
  - active
  - approved
  - budget not exhausted
  - not blocked by risk policy.

## B) Bot Developer Integration Lifecycle
1. Register bot and environment.
2. Generate SDK key and configure base URL.
3. Define placement/frequency policy.
4. Integration health checks pass.
5. Bot starts receiving eligible ads.
6. Revenue and payout data accrues.

## C) Admin Operations Lifecycle
1. Monitor global dashboard.
2. Triage moderation queues.
3. Handle risk alerts and quality flags.
4. Manage disputes/support tickets.
5. Approve payouts and close billing periods.

## What Each Portal Screen Should Contain

## Advertiser UI
- Overview:
  - spend today
  - active campaigns
  - approvals pending
  - top creatives
- Campaigns:
  - table with status, budget, spend, CTR
- Campaign detail:
  - creatives tab
  - targeting tab
  - budget tab
  - policy feedback tab
  - metrics tab
- Billing:
  - wallet balance
  - transactions
  - invoices (phase 2)

## Bot Developer UI
- Overview:
  - total requests
  - fill rate
  - eCPM / revenue
  - integration health
- Bots:
  - bot status, environments, keys
- Integrations:
  - SDK snippet, webhook config, error logs
- Monetization:
  - earnings and payout schedule
- Settings:
  - ad policy defaults
  - team members

## Admin UI
- Global dashboard:
  - active advertisers
  - active bots
  - events per minute
  - anomaly alerts
- Review queues:
  - campaigns pending review
  - bots pending verification
- Risk console:
  - suspicious click patterns
  - quality violations
- Finance console:
  - spend ledger
  - payout approvals
  - reconciliation view
- Audit console:
  - status changes
  - actor logs
  - API key events

## Unified Data Model (Proposed)
- `users` (auth-linked)
- `organizations`
- `organization_members`
- `advertiser_profiles`
- `publisher_profiles`
- `bots`
- `bot_environments`
- `sdk_keys`
- `campaigns`
- `ad_creatives`
- `campaign_targeting`
- `campaign_budget_rules`
- `ad_events`
- `spend_ledger`
- `payout_ledger`
- `review_decisions`
- `risk_flags`
- `audit_logs`

## API Surface (Proposed)

## Shared
- `POST /api/auth/sync-user`
- `GET /api/me/organizations`
- `POST /api/me/switch-organization`
- `GET /api/me/entry-context`
- `POST /api/me/default-workspace`

## Advertiser
- `GET /api/advertiser/dashboard`
- `GET /api/advertiser/campaigns`
- `POST /api/advertiser/campaigns`
- `PATCH /api/advertiser/campaigns/:id`
- `POST /api/advertiser/campaigns/:id/submit`
- `GET /api/advertiser/campaigns/:id/metrics`

## Bot Developer
- `GET /api/publisher/dashboard`
- `GET /api/publisher/bots`
- `POST /api/publisher/bots`
- `PATCH /api/publisher/bots/:id`
- `POST /api/publisher/bots/:id/keys`
- `GET /api/publisher/bots/:id/metrics`

## Admin
- `GET /api/admin/overview`
- `GET /api/admin/reviews/campaigns`
- `POST /api/admin/reviews/campaigns/:id/decision`
- `GET /api/admin/reviews/bots`
- `POST /api/admin/reviews/bots/:id/decision`
- `GET /api/admin/risk/flags`
- `GET /api/admin/finance/reconciliation`

## Routing Plan (Frontend)
- Public:
  - `/`
  - `/publishers`
  - `/advertisers`
  - `/sdk`
  - `/demo`
- App shell:
  - `/app/login`
  - `/app/choose-workspace`
- Advertiser portal:
  - `/app/advertiser`
  - `/app/advertiser/campaigns`
  - `/app/advertiser/campaigns/:id`
- Bot developer portal:
  - `/app/publisher`
  - `/app/publisher/bots`
  - `/app/publisher/bots/:id`
- Admin portal:
  - `/app/admin`
  - `/app/admin/reviews`
  - `/app/admin/risk`
  - `/app/admin/finance`

## Phased Delivery

## Phase 1 (Core Access + Base Portals)
- Unified auth + workspace switcher
- Advertiser campaign draft + submission
- Bot registration + SDK keys
- Admin review queue for campaigns/bots

## Phase 2 (Monetization Controls)
- Budget enforcement in serving path
- Publisher revenue dashboard
- Advertiser spend dashboard
- Admin reconciliation basics

## Phase 3 (Operational Hardening)
- Risk detection and manual investigation tools
- Full audit trails
- Team invites and granular permissions
- CSV exports and scheduled reporting

## Phase 4 (Scale)
- Automated moderation assist
- Payout workflow automation
- Alerting and SLO dashboards
- Multi-region support considerations

## Admin-First Visibility Requirements (Non-Negotiable)
- You must always be able to answer:
  - Which campaigns are live and why
  - Which bots are serving and why
  - Where spend came from and where revenue goes
  - What changed, who changed it, and when
- This means:
  - mandatory status transition logs
  - immutable event history for billing/review decisions
  - organization-level and global rollup dashboards

## Immediate Build Order
1. Implement one login flow + workspace/role selector.
2. Build advertiser and publisher minimal dashboards.
3. Build one admin review surface for both campaign and bot approvals.
4. Connect serve-time gating to approval + budget + risk status.
5. Add reporting and audit views.

## Result
This architecture gives three clear experiences with strict permission boundaries:
- Advertisers buy and optimize demand.
- Bot Developers supply inventory and monitor monetization.
- Admin runs trust, quality, and economics across the entire platform.

## Development Test Credentials

Use these credentials in `/app/login` for local role testing:

- Advertiser test user:
  - Email: `advertiser.demo@local.test`
  - Password: `Advertiser123!`
- Bot developer test user:
  - Email: `botdev.demo@local.test`
  - Password: `BotDeveloper123!`
