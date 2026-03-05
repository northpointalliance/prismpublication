/**
 * Prism seed script — idempotent, safe to run on any environment.
 *
 * What it does:
 *   - Seeds the 3 original blog articles if the blog_posts table is empty.
 *   - Nothing destructive. Never creates fake users, orgs, or campaigns.
 *
 * Run with:  node prisma/seed.js
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Blog posts converted from static content ────────────────────────────────

const seedPosts = [
  {
    title: "Intent Signals That Actually Improve Conversational Ad Performance",
    slug: "intent-signals-for-conversational-ads",
    excerpt:
      "A practical framework for choosing intent signals that improve relevance without making chatbot ads feel invasive.",
    category: "Ad Strategy",
    readingTime: 6,
    published: true,
    publishedAt: new Date("2026-02-10"),
    body: `## Why intent quality matters more than traffic volume

Conversational channels can produce massive message volume, but not every message carries buying intent. Teams that treat all impressions equally usually over-serve low-value placements and under-serve high-intent moments.

The better approach is a weighted intent model. Tag messages by decision stage, confidence, and topic fit. Then reserve premium campaigns for moments where users are clearly comparing options, asking for recommendations, or evaluating pricing.

## Three signal types worth prioritizing

Start with query intent: users asking "what should I use", "best tool", or "compare X vs Y" are often ad-relevant without being intrusive.

Then layer context depth: multi-turn discussions on a single topic typically indicate stronger commercial intent than one-off mentions.

Finally include action proximity: when users ask implementation, budget, or integration questions, campaign relevance usually increases and conversion rates rise.

## How to avoid over-targeting

Intent scoring should not become a reason to inject ads into every promising turn. Frequency controls and spacing rules are essential for trust.

Use a cooldown window, cap placements per session, and suppress ads after explicit user frustration signals. Better pacing almost always improves long-term yield.

## Key Takeaways

- Rank intent signals, do not treat all messages equally.
- Pair intent scoring with strict frequency controls.
- Optimize for trust-adjusted revenue, not raw impression count.`,
  },
  {
    title: "How Publishers Increase Ad Load Without Causing Conversation Fatigue",
    slug: "publisher-ad-load-without-conversation-fatigue",
    excerpt:
      "Operational playbook for scaling monetization while preserving message quality and user retention.",
    category: "Publisher Ops",
    readingTime: 7,
    published: true,
    publishedAt: new Date("2026-01-28"),
    body: `## The hidden cost of aggressive ad frequency

Most chatbot publishers can raise short-term revenue by inserting more ad cards, but repeated interruptions usually reduce session depth and return rates.

Once retention drops, effective inventory quality declines. Advertisers notice weaker downstream outcomes and lower bids. The result is a short-term spike followed by slower long-term growth.

## A healthier pacing model

Use session-stage pacing. Early turns should focus on trust and task understanding, with initial ad opportunities delayed until context is stable.

Combine that with adaptive frequency caps tied to user sentiment and conversation complexity. Higher complexity sessions need lower ad density to preserve experience quality.

## Operational metrics to monitor weekly

Track ad load per session, average turns after first ad, and repeat session rate. These three metrics reveal whether monetization pressure is harming user flow.

Then pair them with advertiser quality metrics like click quality and assisted conversion rate. Sustainable monetization needs both sides to improve together.

## Key Takeaways

- Ad load should adapt to conversation stage and sentiment.
- Retention and post-ad session depth are core monetization metrics.
- Healthy pacing protects both publisher revenue and advertiser outcomes.`,
  },
  {
    title: "Creative Patterns for Native Chatbot Ads That Feel Useful",
    slug: "creative-patterns-for-native-chatbot-ads",
    excerpt:
      "Creative guidelines for sponsored cards that read like recommendations, not interruptions.",
    category: "Creative",
    readingTime: 5,
    published: true,
    publishedAt: new Date("2026-01-12"),
    body: `## Useful beats clever

In chat interfaces, flashy copy often underperforms. Users reward clarity, direct value statements, and obvious next steps.

The highest-performing sponsored messages usually answer the exact question already present in the thread and keep CTA language simple.

## Message anatomy that consistently works

Lead with relevance first, then one proof point, then a low-friction CTA. Keep the card compact so it does not visually dominate the conversation.

Add a clear sponsored label and avoid pretending the message is purely organic. Transparency increases trust and protects long-term engagement.

## Creative testing cadence

Test one variable at a time: headline framing, proof format, or CTA wording. Multi-variable tests in low-volume chatbot contexts often produce noisy conclusions.

Run weekly creative reviews with both publisher and advertiser teams so copy improvements align with conversational tone and policy constraints.

## Key Takeaways

- Prioritize direct utility and clean CTA language.
- Keep sponsored labeling explicit and consistent.
- Use focused, low-variance creative tests.`,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const existingCount = await prisma.blogPost.count();
  if (existingCount > 0) {
    console.log(`Seed skipped — ${existingCount} blog post(s) already exist.`);
    return;
  }

  await prisma.blogPost.createMany({ data: seedPosts });
  console.log(`Seeded ${seedPosts.length} blog posts.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
