import {
  BookOpen,
  Building2,
  Eye,
  Globe,
  Heart,
  Lightbulb,
  MessageSquare,
  Scale,
  Shield,
  ShieldCheck,
  Target,
  Users,
  Zap,
} from "lucide-react";

// ── Mission pillars ──────────────────────────────────────────────────────────

export const pillars = [
  {
    icon: MessageSquare,
    title: "Conversations deserve better ads",
    description:
      "When someone asks a chatbot for help, they are sharing real intent. The ads they see should respect that moment, not disrupt it. We build the infrastructure that makes that possible.",
  },
  {
    icon: Scale,
    title: "Publishers and advertisers need balance",
    description:
      "Most ad networks optimize for one side. We design for both. Publisher UX and advertiser ROI are not competing goals. They are the same goal measured from different angles.",
  },
  {
    icon: Eye,
    title: "Transparency is not optional",
    description:
      "Published CPM rates. Open content policies. Full audit logging. The ad industry has an opacity problem. We think that is also a trust problem, and trust is the product we are actually building.",
  },
];

// ── Values ───────────────────────────────────────────────────────────────────

export const values = [
  {
    icon: Zap,
    title: "Ship, then refine",
    description:
      "We would rather put a working version in front of real users this week than perfect it for three months. Feedback from real use teaches more than planning in isolation.",
  },
  {
    icon: ShieldCheck,
    title: "Safety by default",
    description:
      "Eleven permanently excluded ad categories. Pre-serving moderation. HMAC-signed SDK requests. Security and content safety are not features. They are baseline expectations.",
  },
  {
    icon: Heart,
    title: "Respect the end user",
    description:
      "The person talking to a chatbot did not sign up to see ads. If we cannot make the ad genuinely useful in context, we would rather not show one at all.",
  },
  {
    icon: Building2,
    title: "Operator-friendly tools",
    description:
      "Publishers and advertisers should be able to launch, monitor, and iterate without enterprise onboarding. If it takes a sales call to get started, we have built the wrong thing.",
  },
  {
    icon: Lightbulb,
    title: "Small team, high leverage",
    description:
      "We optimize for decisions per person, not headcount. A small team that ships fast with clear ownership beats a large team blocked by process.",
  },
  {
    icon: Globe,
    title: "Build in public",
    description:
      "Our ad policy is published. Our SDK is open. Our documentation explains not just how things work, but why we built them that way. Opacity breeds mistrust.",
  },
];

// ── Stats ────────────────────────────────────────────────────────────────────

export const stats = [
  { value: "2026", label: "Founded" },
  { value: "3", label: "Ad formats" },
  { value: "11", label: "Excluded ad categories" },
  { value: "< 50ms", label: "Ad response time" },
];

// ── Approach items ───────────────────────────────────────────────────────────

export const approach = [
  {
    icon: Target,
    title: "Intent over demographics",
    description: "We match ads to what people are asking about right now, not who they are or where they have been.",
  },
  {
    icon: Shield,
    title: "Quality over volume",
    description: "We would rather serve fewer, higher-quality ads than flood conversations with irrelevant inventory.",
  },
  {
    icon: BookOpen,
    title: "Documentation over sales calls",
    description: "Everything you need to integrate and launch should be in the docs, not behind a sales pipeline.",
  },
  {
    icon: Users,
    title: "Both sides of the marketplace",
    description: "Publisher tools and advertiser tools are built by the same team with the same level of priority.",
  },
];