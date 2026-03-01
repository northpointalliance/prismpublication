import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const hashSecret = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");

async function main() {
  // ── Leads ──────────────────────────────────────────────────────────────────
  const leadCount = await prisma.lead.count();
  if (leadCount === 0) {
    await prisma.lead.createMany({
      data: [
        {
          role: "publisher",
          name: "Sample Publisher",
          email: "publisher@example.com",
          company: "Demo Bot Co",
          message: "Interested in monetization rollout.",
          source: "seed",
        },
        {
          role: "advertiser",
          name: "Sample Advertiser",
          email: "advertiser@example.com",
          company: "Growth Ads Inc",
          message: "Looking for intent-based campaign inventory.",
          source: "seed",
        },
      ],
    });
    console.log("  ✓ leads");
  }

  // ── Test Advertiser user + org ─────────────────────────────────────────────
  // Credentials: test-advertiser@prism.dev / (any password works with ALLOW_INSECURE_DEV_AUTH=true)
  let advertiserOrg = await prisma.organization.findFirst({
    where: { name: "Acme Ads Inc", type: "advertiser" },
  });

  if (!advertiserOrg) {
    const advertiserUser = await prisma.user.upsert({
      where: { email: "test-advertiser@prism.dev" },
      update: {},
      create: { email: "test-advertiser@prism.dev", name: "Alex Advertiser" },
    });

    advertiserOrg = await prisma.organization.create({
      data: {
        name: "Acme Ads Inc",
        type: "advertiser",
        walletBalanceCents: 200000, // $2,000 seed wallet balance (covers $1,600 in campaign budgets)
      },
    });

    await prisma.organizationMember.create({
      data: {
        userId: advertiserUser.id,
        organizationId: advertiserOrg.id,
        role: "advertiser_owner",
      },
    });

    await prisma.user.update({
      where: { id: advertiserUser.id },
      data: { defaultOrganizationId: advertiserOrg.id },
    });

    await prisma.walletTransaction.create({
      data: {
        organizationId: advertiserOrg.id,
        type: "topup",
        amountCents: 200000,
        description: "Seed top-up",
      },
    });

    console.log("  ✓ test advertiser user + org (test-advertiser@prism.dev)");
  }

  // ── Test Publisher user + org + bot ───────────────────────────────────────
  let publisherOrg = await prisma.organization.findFirst({
    where: { name: "NovaBots", type: "publisher" },
  });

  if (!publisherOrg) {
    const publisherUser = await prisma.user.upsert({
      where: { email: "test-publisher@prism.dev" },
      update: {},
      create: { email: "test-publisher@prism.dev", name: "Pat Publisher" },
    });

    publisherOrg = await prisma.organization.create({
      data: {
        name: "NovaBots",
        type: "publisher",
        paypalEmail: "test-publisher@prism.dev",
      },
    });

    await prisma.organizationMember.create({
      data: {
        userId: publisherUser.id,
        organizationId: publisherOrg.id,
        role: "publisher_owner",
      },
    });

    await prisma.user.update({
      where: { id: publisherUser.id },
      data: { defaultOrganizationId: publisherOrg.id },
    });

    const bot = await prisma.publisherBot.create({
      data: {
        organizationId: publisherOrg.id,
        name: "Nova Assistant",
        publicId: `orgbot_${publisherOrg.id}_nova-assistant_seed01`,
        environment: "production",
        health: "healthy",
        requests7d: 4200,
        fillRateHint: 68.5,
      },
    });

    // SDK key for the bot (hashed, so it can't actually be used — just realistic data)
    const fakeToken = "bgsk_seed_nova_assistant_demo_key_001";
    await prisma.botSdkKey.create({
      data: {
        botId: bot.id,
        label: "Primary",
        tokenHash: hashSecret(fakeToken),
        prefix: fakeToken.slice(0, 10),
        last4: fakeToken.slice(-4),
      },
    });

    // Seed some ad events so the publisher dashboard shows activity
    const seedEventBot = bot.publicId;
    const seedEvents = [];
    for (let i = 0; i < 120; i++) {
      seedEvents.push({ eventType: "impression", botId: seedEventBot, adId: null });
    }
    for (let i = 0; i < 14; i++) {
      seedEvents.push({ eventType: "click", botId: seedEventBot, adId: null });
    }
    for (let i = 0; i < 80; i++) {
      seedEvents.push({
        eventType: "revenue",
        botId: seedEventBot,
        adId: null,
        amount: 2, // 2¢ per impression at $20 CPM
        metadata: { source: "auto_cpm", cpmCents: 2000 },
      });
    }
    await prisma.adEvent.createMany({ data: seedEvents });

    // Seed a pending payout request
    await prisma.payoutRequest.create({
      data: {
        organizationId: publisherOrg.id,
        amountCents: 160, // $1.60
        paypalEmail: "test-publisher@prism.dev",
        status: "pending",
      },
    });

    console.log("  ✓ test publisher user + org + bot + events (test-publisher@prism.dev)");
  }

  // ── Campaigns linked to the test advertiser org ────────────────────────────
  const advertiserKey = `org:${advertiserOrg.id}`;
  const linkedAdCount = await prisma.ad.count({ where: { advertiser: advertiserKey } });

  if (linkedAdCount === 0) {
    // 2 pending (isActive: false) — appear in review queue
    // 1 active (isActive: true)  — appears in active list
    await prisma.ad.createMany({
      data: [
        {
          title: "Boost Your SaaS Trial Signups",
          description: "Reach high-intent users at the moment they're researching AI tools. Average 3.2× CTR vs display.",
          ctaText: "Start Free Trial",
          clickUrl: "https://example.com/saas-trial",
          advertiser: advertiserKey,
          topics: ["saas", "ai", "productivity"],
          format: "card",
          isActive: false,
          weight: 3,
          dailyBudgetCents: 5000,
          lifetimeBudgetCents: 50000,
          endsAt: new Date(Date.now() + 30 * 86_400_000),
        },
        {
          title: "Enterprise Security Platform — Free Demo",
          description: "Stop breaches before they start. Book a personalized 20-minute walkthrough with our team.",
          ctaText: "Book Demo",
          clickUrl: "https://example.com/security-demo",
          advertiser: advertiserKey,
          topics: ["security", "enterprise", "compliance"],
          format: "card",
          isActive: false,
          weight: 2,
          dailyBudgetCents: 8000,
          lifetimeBudgetCents: 80000,
          endsAt: new Date(Date.now() + 14 * 86_400_000),
        },
        {
          title: "Scale Newsletter Revenue",
          description: "Monetize subscriber intent with ad placements matched to conversation context.",
          ctaText: "See Case Study",
          clickUrl: "https://example.com/publisher-growth",
          advertiser: advertiserKey,
          topics: ["publishing", "growth", "monetization"],
          format: "card",
          isActive: true,
          weight: 2,
          dailyBudgetCents: 3000,
          lifetimeBudgetCents: 30000,
        },
      ],
    });
    console.log("  ✓ test campaigns linked to Acme Ads Inc (2 pending review, 1 active)");

    // Deduct reserved budgets from wallet
    const totalReserved = 50000 + 80000 + 30000;
    await prisma.organization.update({
      where: { id: advertiserOrg.id },
      data: { walletBalanceCents: { decrement: totalReserved } },
    });
    await prisma.walletTransaction.create({
      data: {
        organizationId: advertiserOrg.id,
        type: "spend",
        amountCents: totalReserved,
        description: "Seed campaign budget reservations",
      },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
