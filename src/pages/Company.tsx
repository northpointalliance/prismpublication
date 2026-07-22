import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Sparkles,
  Target,
} from "lucide-react";
import { pillars, values, stats, approach } from "./company/CompanyData";
import { PlatformFlowMockup } from "./company/PlatformFlowMockup";
import { ConversationExample } from "./company/ConversationExample";

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
              <h1 className="mt-5 mx-auto lg:mx-0 max-w-xl text-4xl font-bold tracking-tight md:text-6xl">
                Infrastructure for bots
                <br />
                <span className="text-gradient-primary">that already talk.</span>
              </h1>
              <p className="mt-6 mx-auto lg:mx-0 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Prism Signals scores every turn and recommends what to do next. When you opt in, the
                marketplace surfaces partner integrations at the right moment. One SDK. Judgment first.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link
                  to="/signals"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Explore Signals
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/demo"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
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
              <p className="mt-1 text-base text-muted-foreground">{stat.label}</p>
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
              Beyond the reply
            </h2>
          </div>
          <div className="mx-auto mt-6 max-w-2xl space-y-5 text-base leading-[1.75] text-pretty text-muted-foreground">
            <p>
              Teams everywhere are putting LLMs in front of customers: support bots, in-product
              copilots, wellness and coaching apps. The model can answer. What most production stacks
              still lack is turn-level judgment. When should the bot clarify? Escalate to a human?
              Soften tone after frustration? Hold a commercial suggestion until safety and intent say go?
            </p>
            <p>
              That judgment problem shows up before monetization. It is also what makes revenue
              trustworthy when you add it.
            </p>
            <p>
              Conversational monetization is a real, crowded category now. Major platforms run
              in-thread ads. Well-funded infrastructure companies sell contextual placement to
              enterprise. Independent publishers building their own bots still need open tooling they
              can integrate and control, without rebuilding ad ops or guessing on every turn.
            </p>
            <p>
              Prism builds both layers on one SDK.{" "}
              <Link to="/signals" className="font-medium text-primary hover:underline">
                Signals
              </Link>{" "}
              scores each turn and recommends a next action. The{" "}
              <Link to="/publishers" className="font-medium text-primary hover:underline">
                marketplace
              </Link>{" "}
              surfaces partner integrations when the moment fits. Judgment comes first. Revenue is optional.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pillars.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-3xl glow-border bg-card p-8 flex flex-col">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-muted-foreground">{description}</p>
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
                These are the decisions we have already made, reflected in the product, the policies,
                and the way we operate.
              </p>

              <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-base font-semibold text-foreground">Our ad policy is public</p>
                <p className="mt-2 text-base text-muted-foreground leading-relaxed">
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
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
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
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
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
                Ads that fit the conversation
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Prism ads are not banners or pop-ups. They appear as contextual suggestions within
                live conversations, when a user asks about a topic the ad is relevant to.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Native placements only. The conversation stays intact.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-primary">3</p>
                  <p className="mt-1 text-xs text-muted-foreground">Ad formats</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-primary">11</p>
                  <p className="mt-1 text-xs text-muted-foreground">Excluded categories</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-primary">sub-200ms</p>
                  <p className="mt-1 text-xs text-muted-foreground">Ad response time</p>
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
                If you have built a chatbot with real users and want to earn revenue without
                degrading the experience, Prism gives you the SDK, the dashboard, and the controls.
              </p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {[
                  "SDK integration",
                  "Per-bot revenue tracking",
                  "Full frequency and format controls",
                  "Monthly PayPal payouts",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-base text-muted-foreground">
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
                If you want to reach users when they are actively expressing intent in AI
                conversations, Prism gives you the targeting, the creative tools, and the analytics.
              </p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {[
                  "Topic-based intent targeting",
                  "Self-serve campaign builder",
                  "Transparent CPM pricing",
                  "Real-time performance dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-base text-muted-foreground">
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
                Run the interactive demo, explore the documentation, or get in touch to talk through
                how it fits your product.
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