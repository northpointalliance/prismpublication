-- CreateEnum
CREATE TYPE "LeadRole" AS ENUM ('publisher', 'advertiser', 'demo', 'general');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'archived');

-- CreateEnum
CREATE TYPE "AdFormat" AS ENUM ('text', 'card', 'banner');

-- CreateEnum
CREATE TYPE "AdEventType" AS ENUM ('impression', 'click', 'revenue');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('advertiser', 'publisher', 'admin');

-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('advertiser_owner', 'advertiser_member', 'advertiser_finance', 'publisher_owner', 'publisher_dev', 'publisher_ops', 'reviewer', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "BotEnvironment" AS ENUM ('development', 'staging', 'production');

-- CreateEnum
CREATE TYPE "BotHealth" AS ENUM ('healthy', 'warning', 'degraded');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('topup', 'spend', 'refund');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('AD_APPROVE', 'AD_REJECT', 'AD_TAKEDOWN', 'WALLET_TOPUP', 'PAYOUT_REQUEST', 'PAYOUT_PROCESS', 'PAYOUT_STATUS_UPDATE', 'PLATFORM_FEE_UPDATE', 'PAYPAL_CONFIG_UPDATE', 'PAYPAL_WEBHOOK_CAPTURE_REVERSED', 'PAYPAL_WEBHOOK_PAYOUT_SETTLED', 'RATE_TABLE_UPDATE', 'BLOG_POST_CREATE', 'BLOG_POST_UPDATE', 'BLOG_POST_DELETE', 'BLOG_POST_PUBLISH');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "role" "LeadRole" NOT NULL DEFAULT 'general',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "message" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultOrganizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "walletBalanceCents" INTEGER NOT NULL DEFAULT 0,
    "paypalEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paypalOrderId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paypalEmail" TEXT NOT NULL,
    "paypalBatchId" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL,
    "clickUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "advertiser" TEXT NOT NULL,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "format" "AdFormat" NOT NULL DEFAULT 'card',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "dailyBudgetCents" INTEGER NOT NULL DEFAULT 0,
    "lifetimeBudgetCents" INTEGER NOT NULL DEFAULT 0,
    "endsAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_events" (
    "id" TEXT NOT NULL,
    "adId" TEXT,
    "eventType" "AdEventType" NOT NULL,
    "botId" TEXT NOT NULL,
    "userId" TEXT,
    "topic" TEXT,
    "amount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publisher_bots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "environment" "BotEnvironment" NOT NULL DEFAULT 'production',
    "health" "BotHealth" NOT NULL DEFAULT 'healthy',
    "requests7d" INTEGER NOT NULL DEFAULT 0,
    "fillRateHint" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sdkErrorsHint" INTEGER NOT NULL DEFAULT 0,
    "placementPolicy" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publisher_bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorUserId" TEXT,
    "organizationId" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT,
    "readingTime" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_sdk_keys" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_sdk_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_role_createdAt_idx" ON "leads"("role", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "organizations_type_createdAt_idx" ON "organizations"("type", "createdAt");

-- CreateIndex
CREATE INDEX "wallet_transactions_organizationId_createdAt_idx" ON "wallet_transactions"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- CreateIndex
CREATE INDEX "payout_requests_organizationId_createdAt_idx" ON "payout_requests"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "payout_requests_status_createdAt_idx" ON "payout_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_role_idx" ON "organization_members"("organizationId", "role");

-- CreateIndex
CREATE INDEX "organization_members_userId_role_idx" ON "organization_members"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_userId_organizationId_role_key" ON "organization_members"("userId", "organizationId", "role");

-- CreateIndex
CREATE INDEX "ads_isActive_deletedAt_createdAt_idx" ON "ads"("isActive", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "ads_advertiser_deletedAt_idx" ON "ads"("advertiser", "deletedAt");

-- CreateIndex
CREATE INDEX "ad_events_eventType_createdAt_idx" ON "ad_events"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "ad_events_adId_createdAt_idx" ON "ad_events"("adId", "createdAt");

-- CreateIndex
CREATE INDEX "ad_events_botId_createdAt_idx" ON "ad_events"("botId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "publisher_bots_publicId_key" ON "publisher_bots"("publicId");

-- CreateIndex
CREATE INDEX "publisher_bots_organizationId_deletedAt_createdAt_idx" ON "publisher_bots"("organizationId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "publisher_bots_organizationId_isActive_deletedAt_idx" ON "publisher_bots"("organizationId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "audit_logs"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_published_publishedAt_idx" ON "blog_posts"("published", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "bot_sdk_keys_tokenHash_key" ON "bot_sdk_keys"("tokenHash");

-- CreateIndex
CREATE INDEX "bot_sdk_keys_botId_createdAt_idx" ON "bot_sdk_keys"("botId", "createdAt");

-- CreateIndex
CREATE INDEX "bot_sdk_keys_botId_revokedAt_idx" ON "bot_sdk_keys"("botId", "revokedAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_defaultOrganizationId_fkey" FOREIGN KEY ("defaultOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_events" ADD CONSTRAINT "ad_events_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publisher_bots" ADD CONSTRAINT "publisher_bots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_sdk_keys" ADD CONSTRAINT "bot_sdk_keys_botId_fkey" FOREIGN KEY ("botId") REFERENCES "publisher_bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

