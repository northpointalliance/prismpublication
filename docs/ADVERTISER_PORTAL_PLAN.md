# Advertiser Portal Plan

## Goal
Build a secure advertiser portal where users can:
- sign up and log in
- submit ad creatives in supported formats
- define budget and targeting
- track campaign status and performance

## Primary Outcome
An advertiser can go from account creation to a submitted campaign without manual engineering support.

## Success Criteria
- Advertiser account creation and login works reliably.
- Advertiser can create campaign drafts and submit for review.
- Reviewer/admin can approve or reject with reason.
- Approved campaigns can be activated and served.
- Advertiser can see core metrics: impressions, clicks, CTR, spend.

## Scope (MVP)
1. Authentication and role-based access.
2. Advertiser workspace/profile.
3. Campaign creation flow.
4. Creative management for `text`, `card`, `banner`.
5. Budget setup (daily cap + total cap).
6. Review workflow.
7. Basic reporting dashboard.

## Out of Scope (MVP)
- Advanced attribution modeling.
- Complex billing automation (full invoicing engine).
- Multi-currency treasury features.

## Roles
- `advertiser`: owns campaigns and creatives.
- `reviewer`: reviews submissions.
- `admin`: full system access, overrides, configuration.

## Core User Flows
1. Advertiser sign up -> create company profile -> create first campaign draft.
2. Advertiser adds creatives + budget + targeting -> submits for review.
3. Reviewer approves/rejects with feedback.
4. Approved campaign goes live when active and funded.
5. Advertiser monitors metrics and adjusts campaign.

## Suggested Architecture
- Auth: Supabase Auth (email/password, reset, session).
- Business data: local Postgres + Prisma.
- API: Express service under `server/`.
- Frontend: React routes under `src/pages`.
- Event tracking: existing `ad_events` extended for spend reporting.

## Data Model Additions
- `organizations`
- `organization_members`
- `advertiser_profiles`
- `campaigns`
- `ad_creatives`
- `campaign_targeting`
- `campaign_budget_rules`
- `review_decisions`
- `spend_ledger`
- `invoices` (phase 2)

## API Endpoints (Proposed)
- `POST /api/auth/sync-user`
- `GET /api/advertiser/profile`
- `PUT /api/advertiser/profile`
- `GET /api/advertiser/campaigns`
- `POST /api/advertiser/campaigns`
- `PATCH /api/advertiser/campaigns/:id`
- `POST /api/advertiser/campaigns/:id/submit`
- `GET /api/advertiser/campaigns/:id/metrics`
- `GET /api/reviewer/queue`
- `POST /api/reviewer/campaigns/:id/decision`

## Frontend Pages (Proposed)
- `/portal/login`
- `/portal/onboarding`
- `/portal/campaigns`
- `/portal/campaigns/:id/edit`
- `/portal/campaigns/:id/metrics`
- `/portal/billing` (phase 2)
- `/reviewer/queue` (internal)

## Validation Rules (Key)
- URL must be valid and HTTPS.
- Image dimensions and size limits enforced by format.
- Required copy fields enforced by format.
- Budget must include positive daily and/or total cap.
- Campaign cannot submit without at least one valid creative.

## Delivery Plan

## Phase 1 (1-2 weeks): Account + Submission
- Supabase auth integration.
- Advertiser profile + organization ownership.
- Campaign draft create/edit.
- Creative create/edit for all formats.
- Submit for review.
- Reviewer approve/reject flow.

## Phase 2 (1-2 weeks): Budget + Reporting
- Budget enforcement rules in serving path.
- Spend ledger from event stream.
- Advertiser metrics dashboard.
- Campaign pause/resume controls.

## Phase 3 (1 week): Hardening
- Audit logs and activity history.
- Better policy checks and moderation helpers.
- CSV export for reports.
- UX polish and error handling improvements.

## Technical Risks and Mitigation
- Auth/data split complexity:
  - Keep Supabase for identity only; map to local `organization_members`.
- Budget overspend risk:
  - Enforce hard caps at serve time and track spend atomically.
- Moderation bottleneck:
  - Start with simple reviewer queue and status filters.

## Implementation Checklist
- [ ] Finalize schema and run Prisma migration.
- [ ] Add auth middleware and role guards.
- [ ] Build advertiser campaign CRUD APIs.
- [ ] Build reviewer queue + decision APIs.
- [ ] Build portal UI pages.
- [ ] Add metrics queries and dashboard cards.
- [ ] Add tests for campaign status transitions.
- [ ] Update docs and runbook.
