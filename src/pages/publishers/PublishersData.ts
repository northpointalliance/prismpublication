import {
  Bot,
  Code2,
  Gauge,
  LineChart,
  MessageSquare,
  Shield,
  Terminal,
  Wallet,
} from "lucide-react";

// ── SDK snippet ──────────────────────────────────────────────────────────────

export const sdkSnippet = `import { PrismAds } from "@prismpublication/sdk";

const prism = new PrismAds({
  apiKey: process.env.PRISM_API_KEY,
  botId: "my-support-bot",
  adFormat: "card",
});

// Inside your message handler
const ad = await prism.displayAd({
  topic: "productivity",
  userId: user.id,
});

if (ad) {
  await prism.trackImpression(ad.id, user.id);
  return formatAdCard(ad);
}`;

// ── Integration steps ────────────────────────────────────────────────────────

export const integrationSteps = [
  {
    step: "01",
    icon: Terminal,
    title: "Install the SDK",
    description: "One npm install. Works with Node.js, Deno, and browser runtimes. TypeScript types included.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    step: "02",
    icon: Bot,
    title: "Register your bot",
    description: "Create a bot in the Publisher Portal, grab an SDK key, and configure placement policy.",
    gradient: "from-sky-400/20 to-sky-400/5",
  },
  {
    step: "03",
    icon: MessageSquare,
    title: "Serve ads in conversation",
    description: "Call displayAd() with topic context. Prism matches the best ad and returns it in milliseconds.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    step: "04",
    icon: LineChart,
    title: "Track and earn",
    description: "Impressions and clicks are tracked automatically. Revenue accrues in real-time to your wallet.",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
];

// ── Feature cards ────────────────────────────────────────────────────────────

export const features = [
  {
    icon: Shield,
    title: "User experience protection",
    description:
      "Frequency controls, topic filtering, and format selection let you decide exactly when and how ads appear. Your users never feel spammed.",
    highlights: ["Frequency capping per user", "Topic-based ad matching", "Format controls (text, card, banner)"],
  },
  {
    icon: Wallet,
    title: "Transparent monetization",
    description:
      "CPM-based revenue with full visibility into impressions, clicks, and payouts. No hidden fees, no opaque auction mechanics.",
    highlights: ["Real-time revenue dashboard", "Per-bot earnings breakdown", "Monthly PayPal payouts"],
  },
  {
    icon: Gauge,
    title: "Operational observability",
    description:
      "Monitor fill rate, SDK errors, and bot health from a single dashboard. Catch issues before your users do.",
    highlights: ["7-day request and fill trends", "SDK error monitoring", "Per-bot health indicators"],
  },
  {
    icon: Code2,
    title: "Developer-first SDK",
    description:
      "Full TypeScript support, React hooks, HMAC-signed requests, and a pre-built component library. Integration takes minutes, not days.",
    highlights: ["TypeScript + React hooks", "Flexible auth — Bearer token standard, optional HMAC signing", "Pre-built ad components"],
  },
];

// ── Stats ────────────────────────────────────────────────────────────────────

export const stats = [
  { value: "sub-200ms", label: "Median ad response time" },
  { value: "3", label: "Ad formats supported" },
  { value: "5 min", label: "Average integration time" },
  { value: "94%+", label: "Target fill rate" },
];
