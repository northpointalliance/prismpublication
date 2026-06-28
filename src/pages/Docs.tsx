import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Code2,
  Layers,
  Lock,
  MousePointerClick,
  Play,
  Rocket,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────

const capabilities = [
  {
    icon: Code2,
    title: "TypeScript SDK",
    description: "Install @prism/sdk via npm. Typed API, React hooks, and a drop-in ad component — all in one package.",
  },
  {
    icon: Terminal,
    title: "REST API",
    description: "One POST endpoint to request ads, one to track events. Works with any language, any framework.",
  },
  {
    icon: Layers,
    title: "3 Ad Formats",
    description: "Text, Card, and Banner — each designed for different conversation UIs. Same endpoint, one parameter change.",
  },
  {
    icon: MousePointerClick,
    title: "Event Tracking",
    description: "Report impressions and clicks so revenue flows back to your dashboard and advertisers get performance data.",
  },
  {
    icon: Shield,
    title: "HMAC Request Signing",
    description: "Every request is signed with HMAC-SHA256 to prevent replay attacks. The SDK handles signing automatically.",
  },
  {
    icon: Lock,
    title: "Bot-Scoped Keys",
    description: "SDK keys are scoped per-bot for isolation. Rotate and revoke from the Publisher Portal anytime.",
  },
];

const integrationSteps = [
  {
    step: "1",
    title: "Install the SDK",
    description: "One npm install. Ships ESM, CJS, TypeScript definitions, and React hooks.",
    badge: "npm install @prism/sdk",
  },
  {
    step: "2",
    title: "Initialize with your credentials",
    description: "Pass your SDK key and bot ID. The SDK auto-configures auth, signing, and endpoint routing.",
    badge: "new PrismAds({ ... })",
  },
  {
    step: "3",
    title: "Request ads in your message handler",
    description: "Call displayAd() with a conversation topic. Get back a formatted ad object ready to render.",
    badge: "prism.displayAd()",
  },
  {
    step: "4",
    title: "Track impressions and clicks",
    description: "One-liner calls for impression and click tracking. Revenue accrues to your wallet automatically.",
    badge: "prism.trackImpression()",
  },
];

const formatCards = [
  {
    format: "Text",
    description: "Inline suggestion with sponsor label and CTA link. Minimal footprint for text-heavy bots.",
    mock: (
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
        <span className="font-semibold text-foreground">Sponsored</span>
        <span className="text-muted-foreground"> — Try Linear: issue tracking built for speed. </span>
        <span className="text-primary font-medium">Start free &rarr;</span>
      </div>
    ),
  },
  {
    format: "Card",
    description: "Rich media card with image, headline, description, and CTA button. Highest engagement.",
    popular: true,
    mock: (
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="h-16 bg-gradient-to-br from-violet-500/20 via-primary/10 to-emerald-500/20" />
        <div className="p-2.5">
          <p className="text-[10px] text-muted-foreground">Sponsored</p>
          <p className="text-xs font-semibold">Notion AI — Your Second Brain</p>
          <div className="mt-1.5 inline-flex rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Start Free Trial
          </div>
        </div>
      </div>
    ),
  },
  {
    format: "Banner",
    description: "Full-width visual block. Great for brand awareness between conversation turns.",
    mock: (
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex h-16 items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="text-center">
            <p className="text-xs font-bold text-white">Ship faster with Vercel</p>
            <p className="text-[9px] text-white/60">Zero-config deployments</p>
          </div>
        </div>
      </div>
    ),
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

const Docs = () => {
  return (
    <SiteShell>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-10 pt-32">
        <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
        <div className="absolute top-1/3 left-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />

        <div className="container relative z-10 mx-auto px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            Developer Experience
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Built for developers.
            <br />
            <span className="text-gradient-primary">Ready in minutes.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A TypeScript SDK, React hooks, and a simple REST API — everything you need to add native ads
            to your AI chatbot. Full technical reference lives in your portal after signup.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/demo"
              className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </Link>
            <Link
              to="/app/login"
              className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto space-y-24 px-6 py-14">

        {/* ── What's Included ──────────────────────────────────────────── */}
        <section>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
              <Zap className="h-3.5 w-3.5" />
              What's Included
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Everything you need to integrate</h2>
            <p className="mt-3 mx-auto max-w-2xl text-muted-foreground">
              One SDK, one endpoint, three ad formats. Full documentation, code examples, and API reference
              are available inside your publisher portal after signup.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div key={title} className="group rounded-2xl border border-border bg-card p-6 transition hover:shadow-md hover:border-primary/20">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Integration Flow ────────────────────────────────────────── */}
        <section>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
              <Rocket className="h-3.5 w-3.5" />
              Integration Flow
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Four steps to your first ad</h2>
            <p className="mt-3 mx-auto max-w-2xl text-muted-foreground">
              From install to revenue in under five minutes. Full code examples available in the SDK Docs tab inside your publisher portal.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {integrationSteps.map(({ step, title, description, badge }) => (
              <div key={step} className="group relative rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
                <span className="absolute right-4 top-4 text-4xl font-bold text-muted/15">{step}</span>
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <div className="mt-3 inline-flex rounded-lg bg-slate-950 px-2.5 py-1.5">
                  <code className="text-xs text-slate-400 font-mono">{badge}</code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Ad Formats Preview ──────────────────────────────────────── */}
        <section>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
              <Layers className="h-3.5 w-3.5" />
              Ad Formats
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Three formats, one endpoint</h2>
            <p className="mt-3 mx-auto max-w-2xl text-muted-foreground">
              Choose the format that fits your conversation UI. Switch formats with a single parameter change.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {formatCards.map(({ format, description, popular, mock }) => (
              <div
                key={format}
                className={`rounded-2xl border p-6 ${
                  popular ? "border-primary/30 bg-card shadow-sm shadow-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-primary">
                    {format}
                  </span>
                  {popular && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      Most used
                    </span>
                  )}
                </div>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">{description}</p>
                <div className="mt-4">{mock}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Google Ad Manager Integration ───────────────────────────── */}
        <section>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-mono uppercase tracking-[0.16em] text-primary mb-3">
                  Google Ad Manager
                </div>
                <h3 className="text-xl font-bold">Already running GAM?</h3>
                <p className="mt-2 text-base text-muted-foreground leading-relaxed">
                  You don't need to touch your existing setup. Register a bot, grab an SDK key, and paste a custom creative snippet into any GAM line item. Your bot's ad slot runs as a standard display placement — no certification, no approval queue, no code changes to your app.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Full integration guide available in your Publisher Portal after signup.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  to="/app/login"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Publisher / Advertiser split ─────────────────────────────── */}
        <section>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
                Publisher SDK Docs
              </div>
              <h3 className="mt-4 text-xl font-bold">Full technical reference inside your portal</h3>
              <p className="mt-2 text-base text-muted-foreground leading-relaxed">
                After signup, the SDK Docs tab in your Publisher Portal gives you:
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "TypeScript SDK install & config",
                  "React hooks (usePrismAd, PrismAdComponent)",
                  "REST API request/response reference",
                  "HMAC signing & authentication guide",
                  "Event tracking for impressions & clicks",
                  "Ad format specs with live previews",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-base text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/app/login"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Open Publisher Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
                Advertiser Campaign Guide
              </div>
              <h3 className="mt-4 text-xl font-bold">Campaign setup guide inside your portal</h3>
              <p className="mt-2 text-base text-muted-foreground leading-relaxed">
                The Campaign Guide tab in your Advertiser Portal covers:
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Step-by-step campaign creation flow",
                  "Ad format specs with CPM pricing",
                  "Creative guidelines (do's and don'ts)",
                  "Topic targeting strategies",
                  "Billing, budgets, and wallet management",
                  "FAQ for common advertiser questions",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-base text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/app/login"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Open Advertiser Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="text-center">
          <div className="mx-auto max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-10">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Ready to integrate?</h2>
            <p className="mt-3 text-muted-foreground">
              Sign up for free, register your first bot, and start serving native ads in your AI chatbot today.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/app/login"
                className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
              >
                <Play className="h-4 w-4" />
                Interactive Demo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
};

export default Docs;
