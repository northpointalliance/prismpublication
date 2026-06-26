import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Megaphone,
  MousePointerClick,
  Sparkles,
  Zap,
} from "lucide-react";
import { advantages, campaignFlow, features, comparisonRows } from "./advertisers/AdvertisersData";
import { CampaignMockup } from "./advertisers/CampaignMockup";
import PricingBlock from "./advertisers/PricingBlock";

// ── Page ─────────────────────────────────────────────────────────────────────

const Advertisers = () => {
  return (
    <SiteShell>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
        <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />
        <div className="absolute bottom-1/3 left-1/3 h-80 w-80 rounded-full bg-amber-500/5 blur-[100px]" aria-hidden="true" />

        <div className="container relative z-10 mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
                <Megaphone className="h-3.5 w-3.5" />
                For Advertisers
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                Reach users in
                <br />
                <span className="text-gradient-primary">high-intent</span>
                <br />
                AI conversations.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Prism places your ads inside live chatbot conversations when users are actively discussing
                topics related to your product. No banner blindness. No wasted impressions.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/app/login"
                  className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Create Campaign
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/demo"
                  className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
                >
                  See Ad Flow Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2" role="list">
                {["No minimum spend", "Prepaid wallet model", "Ads reviewed before serving"].map((item) => (
                  <div key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground" role="listitem">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign builder mockup */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10 blur-2xl" aria-hidden="true" />
              <div className="relative">
                <CampaignMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Advantage stats ───────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-6 py-12 md:grid-cols-4">
          {advantages.map(({ icon: Icon, stat, label, description }) => (
            <div key={label} className="text-center">
              <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">{stat}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Campaign flow ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Campaign Workflow</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              From creative to clicks in four steps
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Launch your first campaign in minutes. Every ad goes through moderation to ensure quality.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {campaignFlow.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="group relative rounded-2xl glow-border bg-card p-6 hover:shadow-lg transition-all duration-500">
                <span className="absolute right-4 top-4 text-4xl font-bold text-muted/20">{step}</span>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why conversational ads ────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Why Prism</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Ads that land because users are already asking
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Display ads fight for attention. Conversational ads are served in the moment a user
                expresses intent — when they're actively looking for recommendations, tools, or solutions.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                That's why Prism advertisers see click-through rates 5-10x higher than traditional
                display, with zero wasted impressions on bot traffic or invisible placements.
              </p>

              <Link
                to="/ad-policy"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                View our ad content policy
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Comparison table */}
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border bg-muted/50 px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Feature</span>
                <span className="w-24 text-center text-xs font-semibold uppercase tracking-[0.1em] text-primary">Prism</span>
                <span className="w-24 text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Display</span>
              </div>
              {comparisonRows.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 ${
                    i < comparisonRows.length - 1 ? "border-b border-border/60" : ""
                  } ${i % 2 === 0 ? "bg-card" : "bg-background"}`}
                >
                  <span className="text-sm text-foreground">{row.feature}</span>
                  <span className="flex w-24 justify-center">
                    {row.prism ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                  </span>
                  <span className="flex w-24 justify-center">
                    {row.display ? (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Platform</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to run campaigns
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              From creative upload to performance analytics — a complete self-serve advertising platform
              built for conversational inventory.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {features.map(({ icon: Icon, title, description, highlights }) => (
              <div key={title} className="rounded-2xl glow-border bg-card p-7">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
                <ul className="mt-4 space-y-2">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-base text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing block (inserted) ─────────────────────────────────────── */}
      <PricingBlock />

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card">
            <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden="true" />
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" aria-hidden="true" />

            <div className="relative p-10 text-center md:p-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
                <Zap className="h-3.5 w-3.5" />
                Get started
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">
                Launch your first campaign today
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Create an advertiser account, fund your wallet, and start reaching users in
                conversational AI environments. No contracts. No minimum spend.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/app/login"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Create Advertiser Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
                >
                  Talk to Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default Advertisers;
