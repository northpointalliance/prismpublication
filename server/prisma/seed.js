import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [leadCount, adCount, organizationCount] = await Promise.all([
    prisma.lead.count(),
    prisma.ad.count(),
    prisma.organization.count(),
  ]);

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
  }

  if (adCount === 0) {
    await prisma.ad.createMany({
      data: [
        {
          title: "Scale Newsletter Revenue",
          description: "Monetize subscriber intent with ad placements matched to conversation context.",
          ctaText: "See Case Study",
          clickUrl: "https://example.com/publisher-growth",
          advertiser: "GrowthLoop Media",
          topics: ["publishing", "growth", "ai"],
          format: "card",
          isActive: true,
          weight: 3,
        },
        {
          title: "Launch Intent-Based Campaigns",
          description: "Reach high-intent users directly in chatbot journeys with measurable outcomes.",
          ctaText: "Book a Strategy Call",
          clickUrl: "https://example.com/intent-campaigns",
          advertiser: "IntentAds Studio",
          topics: ["ads", "performance", "marketing"],
          format: "card",
          isActive: true,
          weight: 2,
        },
        {
          title: "Ship AI Workflows Faster",
          description: "Build and deploy production-ready AI assistants with clean analytics and controls.",
          ctaText: "Start Free",
          clickUrl: "https://example.com/ai-workflows",
          advertiser: "FlowOps",
          topics: ["ai", "productivity", "developer"],
          format: "card",
          isActive: true,
          weight: 1,
        },
      ],
    });
  }

  if (organizationCount === 0) {
    const user = await prisma.user.create({
      data: {
        email: "owner@example.com",
        name: "Owner User",
      },
    });

    const [advertiserOrg, publisherOrg, adminOrg] = await Promise.all([
      prisma.organization.create({
        data: {
          name: "Owner Advertiser Workspace",
          type: "advertiser",
        },
      }),
      prisma.organization.create({
        data: {
          name: "Owner Publisher Workspace",
          type: "publisher",
        },
      }),
      prisma.organization.create({
        data: {
          name: "Platform Admin Workspace",
          type: "admin",
        },
      }),
    ]);

    await prisma.organizationMember.createMany({
      data: [
        {
          userId: user.id,
          organizationId: advertiserOrg.id,
          role: "advertiser_owner",
        },
        {
          userId: user.id,
          organizationId: publisherOrg.id,
          role: "publisher_owner",
        },
        {
          userId: user.id,
          organizationId: adminOrg.id,
          role: "admin",
        },
      ],
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { defaultOrganizationId: advertiserOrg.id },
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
