import { prisma } from "./db.js";

interface SeedBot {
  id: string;
  name: string;
  environment: string;
  health: string;
  requests7d: number;
  fillRate: number;
  [key: string]: any;
}

interface Organization {
  id: string;
  type: string;
  [key: string]: any;
}

export const ensureSeedPublisherBotRecords = async ({
  organizationId,
  seedBots,
}: {
  organizationId: string;
  seedBots: SeedBot[];
}) => {
  for (const bot of seedBots) {
    const existing = await prisma.publisherBot.findFirst({
      where: { organizationId, publicId: bot.id },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.publisherBot.create({
      data: {
        organizationId,
        name: bot.name,
        publicId: bot.id,
        environment: bot.environment as any,
        health: bot.health as any,
        requests7d: bot.requests7d,
        fillRateHint: bot.fillRate,
        sdkErrorsHint: bot.health === "warning" ? 1 : 0,
      },
    });
  }
};

const seedAdvertiserWorkspaceMockData = async ({ organization }: { organization: Organization }) => {
  const advertiserKey = `org:${organization.id}`;
  const existingCount = await prisma.ad.count({ where: { advertiser: advertiserKey } });
  if (existingCount > 0) return;

  const templates = [
    {
      title: "AI Writing Assistant Launch",
      description: "Promote your AI writing assistant in high-intent productivity conversations.",
      ctaText: "Start Free Trial",
      clickUrl: "https://example.com/ai-writing-assistant",
      imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978",
      topics: ["ai", "productivity", "writing"],
      format: "card",
      weight: 3,
      isActive: true,
      impressionCount: 28,
      clickCount: 7,
      revenueCents: 21450,
    },
    {
      title: "Cloud Security Webinar",
      description: "Drive qualified security buyers to your next zero-trust webinar.",
      ctaText: "Reserve Seat",
      clickUrl: "https://example.com/cloud-security-webinar",
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
      topics: ["security", "cloud", "devops"],
      format: "card",
      weight: 2,
      isActive: false,
      impressionCount: 12,
      clickCount: 2,
      revenueCents: 6900,
    },
    {
      title: "CRM Migration Suite",
      description: "Capture migration-ready teams evaluating CRM automation workflows.",
      ctaText: "Book Demo",
      clickUrl: "https://example.com/crm-migration-suite",
      imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0",
      topics: ["crm", "sales", "automation"],
      format: "card",
      weight: 2,
      isActive: true,
      impressionCount: 24,
      clickCount: 5,
      revenueCents: 17300,
    },
  ];

  for (const [index, template] of templates.entries()) {
    const ad = await prisma.ad.create({
      data: {
        title: template.title,
        description: template.description,
        ctaText: template.ctaText,
        clickUrl: template.clickUrl,
        imageUrl: template.imageUrl,
        advertiser: advertiserKey,
        topics: template.topics,
        format: template.format as any,
        weight: template.weight,
        isActive: template.isActive,
      },
    });

    const events: Array<{
      adId: string;
      eventType: string;
      botId: string;
      topic: string;
      amount?: number;
    }> = [];
    for (let i = 0; i < template.impressionCount; i += 1) {
      events.push({
        adId: ad.id,
        eventType: "impression",
        botId: `orgbot_${organization.id}_seed_${index + 1}`,
        topic: template.topics[0],
      });
    }
    for (let i = 0; i < template.clickCount; i += 1) {
      events.push({
        adId: ad.id,
        eventType: "click",
        botId: `orgbot_${organization.id}_seed_${index + 1}`,
        topic: template.topics[0],
      });
    }
    events.push({
      adId: ad.id,
      eventType: "revenue",
      botId: `orgbot_${organization.id}_seed_${index + 1}`,
      topic: template.topics[0],
      amount: template.revenueCents,
    });

    await prisma.adEvent.createMany({ data: events as any });
  }
};

const seedPublisherWorkspaceMockData = async ({ organization }: { organization: Organization }) => {
  const botPrefix = `orgbot_${organization.id}_`;
  const bots: Array<SeedBot & { revenueTodayCents: number; impressionCount: number; clickCount: number }> = [
    {
      id: `${botPrefix}support-copilot`,
      name: "Support Copilot",
      environment: "production",
      health: "healthy",
      requests7d: 42100,
      fillRate: 74.2,
      revenueTodayCents: 4822,
      impressionCount: 32,
      clickCount: 8,
    },
    {
      id: `${botPrefix}sales-assistant`,
      name: "Sales Assistant",
      environment: "staging",
      health: "warning",
      requests7d: 9300,
      fillRate: 61.4,
      revenueTodayCents: 2108,
      impressionCount: 20,
      clickCount: 4,
    },
    {
      id: `${botPrefix}onboarding-guide`,
      name: "Onboarding Guide",
      environment: "production",
      health: "healthy",
      requests7d: 31700,
      fillRate: 69.8,
      revenueTodayCents: 3640,
      impressionCount: 27,
      clickCount: 6,
    },
  ];

  await ensureSeedPublisherBotRecords({ organizationId: organization.id, seedBots: bots });

  const existingEvents = await prisma.adEvent.count({
    where: { botId: { startsWith: botPrefix } },
  });
  if (existingEvents > 0) return;

  for (const bot of bots) {
    const events: Array<{
      eventType: string;
      botId: string;
      topic: string;
      amount?: number;
      metadata?: Record<string, any>;
    }> = [];
    for (let i = 0; i < bot.impressionCount; i += 1) {
      events.push({
        eventType: "impression",
        botId: bot.id,
        topic: "ai",
        metadata: {
          botName: bot.name,
          environment: bot.environment,
          health: bot.health,
          requests7d: bot.requests7d,
          fillRate: bot.fillRate,
          sdkErrors: bot.health === "warning" ? 1 : 0,
        },
      });
    }
    for (let i = 0; i < bot.clickCount; i += 1) {
      events.push({ eventType: "click", botId: bot.id, topic: "ai" });
    }
    events.push({
      eventType: "revenue",
      botId: bot.id,
      topic: "ai",
      amount: bot.revenueTodayCents,
      metadata: {
        botName: bot.name,
        environment: bot.environment,
        health: bot.health,
        requests7d: bot.requests7d,
        fillRate: bot.fillRate,
        sdkErrors: bot.health === "warning" ? 1 : 0,
      },
    });
    await prisma.adEvent.createMany({ data: events as any });
  }
};

export const seedWorkspaceMockData = async ({ organization }: { organization: Organization }) => {
  if (organization.type === "advertiser") {
    await seedAdvertiserWorkspaceMockData({ organization });
    return;
  }
  if (organization.type === "publisher") {
    await seedPublisherWorkspaceMockData({ organization });
  }
};
