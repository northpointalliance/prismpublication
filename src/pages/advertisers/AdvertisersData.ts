import {
  Eye,
  Filter,
  CircleDollarSign,
  Layers,
  Megaphone,
  PieChart,
  Rocket,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

// ── Targeting advantages ─────────────────────────────────────────────────────

export const advantages = [
  {
    icon: Target,
    stat: "3.8%",
    label: "Average CTR",
    description: "Intent-level targeting in live conversations drives click-through rates 5-10x higher than display ads.",
  },
  {
    icon: Users,
    stat: "100%",
    label: "Real users",
    description: "Every impression is a human in a conversation. No bot traffic, no accidental clicks, no invisible iframes.",
  },
  {
    icon: ShieldCheck,
    stat: "11",
    label: "Excluded categories",
    description: "Strict content policies mean your brand appears in safe, high-quality environments by default.",
  },
  {
    icon: Eye,
    stat: "94%",
    label: "Viewability",
    description: "Ads are served inline in active conversations. If a message is read, the ad is seen.",
  },
];

// ── How it works ─────────────────────────────────────────────────────────────

export const campaignFlow = [
  {
    step: "01",
    icon: Megaphone,
    title: "Create your ad",
    description: "Write a title, description, CTA, and click URL. Upload an optional image. Choose text, card, or banner format.",
  },
  {
    step: "02",
    icon: Filter,
    title: "Set targeting and budget",
    description: "Pick topic keywords, set daily and lifetime budgets, and optionally schedule an end date.",
  },
  {
    step: "03",
    icon: Rocket,
    title: "Submit for review",
    description: "Ads go through a moderation review against our content policy. Approved ads start serving immediately.",
  },
  {
    step: "04",
    icon: PieChart,
    title: "Monitor performance",
    description: "Track impressions, clicks, CTR, and spend in real-time from the Advertiser Dashboard.",
  },
];

// ── Features ─────────────────────────────────────────────────────────────────

export const features = [
  {
    icon: Target,
    title: "Intent-level targeting",
    description:
      "Serve ads when users are actively discussing relevant topics. No guesswork — the conversation context tells you exactly what they need.",
    highlights: ["Topic keyword matching", "Conversational context signals", "Real-time relevance scoring"],
  },
  {
    icon: Layers,
    title: "Flexible placement controls",
    description:
      "Choose your ad format, set frequency, configure budgets, and control pacing. Every campaign parameter is transparent and adjustable.",
    highlights: ["3 ad formats (text, card, banner)", "Daily and lifetime budget caps", "Weighted delivery controls"],
  },
  {
    icon: TrendingUp,
    title: "Full-funnel measurement",
    description:
      "Track every impression and click with attribution back to the conversation topic and bot. Understand exactly where your budget goes.",
    highlights: ["Real-time impression and click tracking", "Per-topic performance breakdown", "Spend pacing visibility"],
  },
  {
    icon: CircleDollarSign,
    title: "Transparent CPM pricing",
    description:
      "Pay per thousand impressions with clear rates by format. No hidden auction mechanics, no bid manipulation, no surprise fees.",
    highlights: ["Published CPM rates per format", "Wallet-based prepaid model", "PayPal top-ups"],
  },
];

// ── Comparison ───────────────────────────────────────────────────────────────

export const comparisonRows = [
  { feature: "Targets real intent", prism: true, display: false },
  { feature: "Appears in active conversations", prism: true, display: false },
  { feature: "No bot traffic", prism: true, display: false },
  { feature: "Transparent CPM pricing", prism: true, display: false },
  { feature: "Ad review before serving", prism: true, display: true },
  { feature: "Real-time performance dashboard", prism: true, display: true },
  { feature: "Mass reach (millions of sites)", prism: false, display: true },
  { feature: "Video and rich media formats", prism: false, display: true },
];
