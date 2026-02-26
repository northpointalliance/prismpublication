export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "Ad Strategy" | "Publisher Ops" | "Creative";
  readingTime: string;
  publishedOn: string;
  image: string;
  sections: BlogSection[];
  takeaways: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "intent-signals-for-conversational-ads",
    title: "Intent Signals That Actually Improve Conversational Ad Performance",
    excerpt:
      "A practical framework for choosing intent signals that improve relevance without making chatbot ads feel invasive.",
    category: "Ad Strategy",
    readingTime: "6 min read",
    publishedOn: "February 10, 2026",
    image: "/mockups/blog-intent-signals.svg",
    sections: [
      {
        heading: "Why intent quality matters more than traffic volume",
        paragraphs: [
          "Conversational channels can produce massive message volume, but not every message carries buying intent. Teams that treat all impressions equally usually over-serve low-value placements and under-serve high-intent moments.",
          "The better approach is a weighted intent model. Tag messages by decision stage, confidence, and topic fit. Then reserve premium campaigns for moments where users are clearly comparing options, asking for recommendations, or evaluating pricing.",
        ],
      },
      {
        heading: "Three signal types worth prioritizing",
        paragraphs: [
          "Start with query intent: users asking 'what should I use', 'best tool', or 'compare X vs Y' are often ad-relevant without being intrusive.",
          "Then layer context depth: multi-turn discussions on a single topic typically indicate stronger commercial intent than one-off mentions.",
          "Finally include action proximity: when users ask implementation, budget, or integration questions, campaign relevance usually increases and conversion rates rise.",
        ],
      },
      {
        heading: "How to avoid over-targeting",
        paragraphs: [
          "Intent scoring should not become a reason to inject ads into every promising turn. Frequency controls and spacing rules are essential for trust.",
          "Use a cooldown window, cap placements per session, and suppress ads after explicit user frustration signals. Better pacing almost always improves long-term yield.",
        ],
      },
    ],
    takeaways: [
      "Rank intent signals, do not treat all messages equally.",
      "Pair intent scoring with strict frequency controls.",
      "Optimize for trust-adjusted revenue, not raw impression count.",
    ],
  },
  {
    slug: "publisher-ad-load-without-conversation-fatigue",
    title: "How Publishers Increase Ad Load Without Causing Conversation Fatigue",
    excerpt:
      "Operational playbook for scaling monetization while preserving message quality and user retention.",
    category: "Publisher Ops",
    readingTime: "7 min read",
    publishedOn: "January 28, 2026",
    image: "/mockups/blog-publisher-ops.svg",
    sections: [
      {
        heading: "The hidden cost of aggressive ad frequency",
        paragraphs: [
          "Most chatbot publishers can raise short-term revenue by inserting more ad cards, but repeated interruptions usually reduce session depth and return rates.",
          "Once retention drops, effective inventory quality declines. Advertisers notice weaker downstream outcomes and lower bids. The result is a short-term spike followed by slower long-term growth.",
        ],
      },
      {
        heading: "A healthier pacing model",
        paragraphs: [
          "Use session-stage pacing. Early turns should focus on trust and task understanding, with initial ad opportunities delayed until context is stable.",
          "Combine that with adaptive frequency caps tied to user sentiment and conversation complexity. Higher complexity sessions need lower ad density to preserve experience quality.",
        ],
      },
      {
        heading: "Operational metrics to monitor weekly",
        paragraphs: [
          "Track ad load per session, average turns after first ad, and repeat session rate. These three metrics reveal whether monetization pressure is harming user flow.",
          "Then pair them with advertiser quality metrics like click quality and assisted conversion rate. Sustainable monetization needs both sides to improve together.",
        ],
      },
    ],
    takeaways: [
      "Ad load should adapt to conversation stage and sentiment.",
      "Retention and post-ad session depth are core monetization metrics.",
      "Healthy pacing protects both publisher revenue and advertiser outcomes.",
    ],
  },
  {
    slug: "creative-patterns-for-native-chatbot-ads",
    title: "Creative Patterns for Native Chatbot Ads That Feel Useful",
    excerpt:
      "Creative guidelines for sponsored cards that read like recommendations, not interruptions.",
    category: "Creative",
    readingTime: "5 min read",
    publishedOn: "January 12, 2026",
    image: "/mockups/blog-creative-patterns.svg",
    sections: [
      {
        heading: "Useful beats clever",
        paragraphs: [
          "In chat interfaces, flashy copy often underperforms. Users reward clarity, direct value statements, and obvious next steps.",
          "The highest-performing sponsored messages usually answer the exact question already present in the thread and keep CTA language simple.",
        ],
      },
      {
        heading: "Message anatomy that consistently works",
        paragraphs: [
          "Lead with relevance first, then one proof point, then a low-friction CTA. Keep the card compact so it does not visually dominate the conversation.",
          "Add a clear sponsored label and avoid pretending the message is purely organic. Transparency increases trust and protects long-term engagement.",
        ],
      },
      {
        heading: "Creative testing cadence",
        paragraphs: [
          "Test one variable at a time: headline framing, proof format, or CTA wording. Multi-variable tests in low-volume chatbot contexts often produce noisy conclusions.",
          "Run weekly creative reviews with both publisher and advertiser teams so copy improvements align with conversational tone and policy constraints.",
        ],
      },
    ],
    takeaways: [
      "Prioritize direct utility and clean CTA language.",
      "Keep sponsored labeling explicit and consistent.",
      "Use focused, low-variance creative tests.",
    ],
  },
];

export const getBlogPostBySlug = (slug: string) =>
  blogPosts.find((post) => post.slug === slug);
