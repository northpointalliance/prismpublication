import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  Eye,
  Globe,
  Heart,
  Lightbulb,
  Megaphone,
  MessageSquare,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

// ── Mission pillars ──────────────────────────────────────────────────────────

const pillars = [
  {
    icon: MessageSquare,
    title: "Conversations deserve better ads",
    description:
      "When someone asks a chatbot for help, they're sharing real intent. The ads they see should respect that moment — not disrupt it. We build the infrastructure that makes that possible.",
  },
  {
    icon: Scale,
    title: "Publishers and advertisers need balance",
    description:
      "Most ad networks optimize for one side. We design for both. Publisher UX and advertiser ROI aren't competing goals — they're the same goal measured from different angles.",
  },
  {
    icon: Eye,
    title: "Transparency isn't optional",
    description:
      "Published CPM rates. Open content policies. Full audit logging. We believe the ad industry's opacity problem is a trust problem, and trust is the product we're actually building.",
  },
];

// ── Values ───────────────────────────────────────────────────────────────────

const values = [
  {
    icon: Zap,
    title: "Ship, then refine",
    description:
      "We'd rather put a working version in front of real users this week than perfect it for three months. Feedback from production teaches more than planning in isolation.",
  },
  {
    icon: ShieldCheck,
    title: "Safety by default",
    description:
      "Eleven permanently excluded ad categories. Pre-serving moderation. HMAC-signed SDK requests. Security and content safety aren't features — they're baseline expectations.",
  },
  {
    icon: Heart,
    title: "Respect the end user",
    description:
      "The person talking to a chatbot didn't sign up to see ads. If we can't make the ad genuinely useful in context, we'd rather not show one at all.",
  },
  {
    icon: Building2,
    title: "Operator-friendly tools",
    description:
      "Publishers and advertisers should be able to launch, monitor, and iterate without enterprise onboarding. If it takes a sales call to get started, we've failed.",
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

const stats = [
  { value: "2026", label: "Founded" },
  { value: "3", label: "Ad formats" },
  { value: "11", label: "Excluded ad categories" },
  { value: "< 50ms", label: "Ad response time" },
];

// ── Approach items ───────────────────────────────────────────────────────────

const approach = [
  {
    icon: Target,
    title: "Intent over demographics",
    description: "We match ads to what people are asking about right now, not who they are or where they've been.",
  },
  {
    icon: Shield,
    title: "Quality over volume",
    description: "We'd rather serve fewer, higher-quality ads than flood conversations with irrelevant inventory.",
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

// ── Platform flow mockup ─────────────────────────────────────────────────────

const PlatformFlowMockup = () => (
  <div className="relative">
    {/* Glow behind */}
    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 blur-2xl" aria-hidden="true" />
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        <span className="ml-3 text-[10px] text-white/40 font-mono">Prism Platform — How it works</span>
      </div>
      <div className="p-6">
        {/* Three columns: Advertiser -> Prism -> Publisher */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
          {/* Advertiser */}
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Megaphone className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-xs font-semibold text-white">Advertiser</p>
            <p className="mt-1 text-[10px] text-white/40">Creates campaigns, sets budget & topics</p>
            <div className="mt-3 space-y-1.5">
              <div className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/50">Notion AI Campaign</div>
              <div className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/50">Vercel Deploy Ads</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-px w-8 bg-gradient-to-r from-amber-400/50 to-primary/50" />
            <p className="text-[8px] text-white/30">ads</p>
          </div>

          {/* Prism */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-white">Prism</p>
            <p className="mt-1 text-[10px] text-white/40">Matches ads to conversations by topic</p>
            <div className="mt-3 grid grid-cols-3 gap-1">
              <div className="rounded-md bg-primary/10 px-1.5 py-1 text-[8px] text-primary">Match</div>
              <div className="rounded-md bg-primary/10 px-1.5 py-1 text-[8px] text-primary">Serve</div>
              <div className="rounded-md bg-primary/10 px-1.5 py-1 text-[8px] text-primary">Track</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-px w-8 bg-gradient-to-r from-primary/50 to-emerald-400/50" />
            <p className="text-[8px] text-white/30">ads</p>
          </div>

          {/* Publisher */}
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <Bot className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-white">Publisher Bot</p>
            <p className="mt-1 text-[10px] text-white/40">Serves native ads in conversations</p>
            <div className="mt-3 space-y-1.5">
              <div className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/50">Support Copilot</div>
              <div className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/50">Sales Assistant</div>
            </div>
          </div>
        </div>

        {/* Revenue flow */}
        <div className="mt-4 rounded-lg bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-white/50">Revenue flow</span>
            </div>
            <span className="text-[10px] text-emerald-400">Real-time tracking</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-amber-400/60 via-primary/60 to-emerald-400/60" />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-white/40">
            <span>Advertiser spends</span>
            <span>Prism takes platform fee</span>
            <span>Publisher earns</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Conversation example ─────────────────────────────────────────────────────

const ConversationExample = () => (
  <div className="overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-2xl">
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
      <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
      <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
      <span className="ml-3 text-[10px] text-white/40 font-mono">AI Chat — Live conversation</span>
    </div>
    <div className="p-4 space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary/20 px-3 py-2">
          <p className="text-[11px] text-white/90">I need a faster way to deploy my projects</p>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-primary/70" />
        </div>
        <div className="space-y-1.5 max-w-[80%]">
          <div className="rounded-2xl rounded-bl-md bg-white/5 px-3 py-2">
            <p className="text-[11px] text-white/80 leading-relaxed">For fast deployments, here are a few options...</p>
          </div>
          {/* Native ad - text format */}
          <div className="rounded-lg border border-primary/20 bg-white/[0.03] px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[8px] font-medium text-primary">Sponsored</span>
            </div>
            <p className="mt-1 text-[11px] text-white/70">
              <span className="font-medium text-white/90">Ship faster with Vercel</span> — Zero-config deployments for Next.js, React, and more.{" "}
              <span className="text-primary font-medium">Deploy now &rarr;</span>
            </p>
          </div>
          <div className="rounded-2xl rounded-bl-md bg-white/5 px-3 py-2">
            <p className="text-[11px] text-white/80 leading-relaxed">You could also check out Railway or Render for more flexibility.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Page ─────────────────────────────────────────────────────────────────────

const Company = () => {
  return (
    <SiteShell>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
        <div className="absolute top-1/3 left-1/3 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />
        <div className="absolute bottom-1/4 right-1/3 h-72 w-72 rounded-full bg-emerald-500/5 blur-[100px]" aria-hidden="true" />

        <div className="container relative z-10 mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
                <Building2 className="h-3.5 w-3.5" />
                Company
              </div>
              <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight md:text-6xl">
                Building the ad layer
                <br />
                <span className="text-gradient-primary">conversational AI deserves.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Prism is an ad network built specifically for AI chatbots. We help publishers monetize
                conversations and help advertisers reach users in their highest-intent moments — without
                compromising the experience that makes those conversations valuable.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link
                  to="/demo"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  See the Product
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/blog"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
                >
                  Read Our Blog
                </Link>
              </div>
            </div>

            {/* Platform flow diagram */}
            <div className="hidden lg:block">
              <PlatformFlowMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission pillars ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Why We Exist</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              The problem we're solving
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              AI chatbots are the next major platform for user interaction. But the ad infrastructure
              for conversations doesn't exist yet. We're building it.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pillars.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-3xl glow-border bg-card p-8 flex flex-col">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we believe ───────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.5fr]">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Principles</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                What we believe
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                These aren't aspirational. They're the decisions we've already made — reflected in
                the product, the policies, and the way we operate.
              </p>

              <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-sm font-semibold text-foreground">Our ad policy is public</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  11 permanently excluded categories, creative quality standards, and a clear
                  enforcement process. No exceptions for brand size or budget.
                </p>
                <Link
                  to="/ad-policy"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  Read the full policy
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {values.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-6">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Our approach ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Approach</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              How we think about building
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-3xl space-y-4">
            {approach.map(({ icon: Icon, title, description }, i) => (
              <div key={title} className="flex gap-5 rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col items-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  {i < approach.length - 1 && <div className="mt-3 h-full w-px bg-border" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How ads look in conversation ──────────────────────────────────── */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">The Product</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Ads that feel like part of the conversation
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Prism ads aren't banners or pop-ups. They appear as contextual suggestions within
                live conversations — when a user asks about a topic your ad is relevant to.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                The result: higher engagement for advertisers, better UX for publishers, and a
                genuinely useful experience for end users.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-primary">3.8%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Avg. CTR</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-primary">94%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Viewability</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-primary">0%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Bot traffic</p>
                </div>
              </div>
            </div>

            {/* Conversation example */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 blur-2xl" aria-hidden="true" />
              <div className="relative">
                <ConversationExample />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── For who ───────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Two Sides</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Built for both sides of the marketplace
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Publishers */}
            <div className="rounded-3xl glow-border bg-card p-8 md:p-10 flex flex-col">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">For publishers</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                If you've built a chatbot with real users and want to earn revenue without
                degrading the experience, Prism gives you the SDK, the dashboard, and the controls.
              </p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {[
                  "5-minute SDK integration",
                  "Per-bot revenue tracking",
                  "Full frequency and format controls",
                  "Monthly PayPal payouts",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/publishers"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Learn more for publishers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Advertisers */}
            <div className="rounded-3xl glow-border bg-card p-8 md:p-10 flex flex-col">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">For advertisers</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                If you want to reach users when they're actively expressing intent in AI
                conversations, Prism gives you the targeting, the creative tools, and the analytics.
              </p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {[
                  "Topic-based intent targeting",
                  "Self-serve campaign builder",
                  "Transparent CPM pricing",
                  "Real-time performance dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/advertisers"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Learn more for advertisers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card">
            <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden="true" />
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" aria-hidden="true" />

            <div className="relative p-10 text-center md:p-16">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                See Prism in action
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Run the interactive demo, explore the documentation, or create an account and
                launch your first integration today.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/demo"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Run Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/docs"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
                >
                  Read the Docs
                </Link>
                <Link
                  to="/contact"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default Company;
