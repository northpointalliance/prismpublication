import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  DollarSign,
  Sparkles,
  Zap,
} from "lucide-react";
import { sdkSnippet, integrationSteps, features, stats } from "./publishers/PublishersData";
import { DashboardMockup } from "./publishers/DashboardMockup";

// ── Page ─────────────────────────────────────────────────────────────────────

const Publishers = () => {
  return (
    <SiteShell>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
        <div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-violet-500/5 blur-[100px]" aria-hidden="true" />

        <div className="container relative z-10 mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
                <Bot className="h-3.5 w-3.5" />
                For Publishers
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                Monetize chatbot
                <br />
                conversations
                <br />
                <span className="text-gradient-primary">without hurting trust.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Add a revenue layer to any AI chatbot with a single SDK. Prism serves context-aware
                ads that feel like recommendations — not interruptions — so your users stay engaged.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/docs"
                  className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  <Code2 className="h-4 w-4" />
                  View SDK Docs
                </Link>
                <Link
                  to="/demo"
                  className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
                >
                  Watch Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2" role="list">
                {["No minimum traffic", "Free tier available", "Full TypeScript SDK"].map((item) => (
                  <div key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground" role="listitem">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 blur-2xl" aria-hidden="true" />
              <div className="relative">
                <DashboardMockup />
              </div>
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
      

      {/* ── Integration flow ──────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Integration</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
Integrate in four steps            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              SDK integration takes under 10 minutes. No approval queues — your first ad can run the same day you sign up.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {integrationSteps.map(({ step, icon: Icon, title, description, gradient }) => (
              <div key={step} className="group relative rounded-2xl glow-border bg-card p-6 hover:shadow-lg transition-all duration-500">
                <span className="absolute right-4 top-4 text-4xl font-bold text-muted/20">{step}</span>
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SDK preview ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Developer Experience</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                A few lines of code. Real revenue.
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground leading-relaxed">
                The Prism SDK handles authentication, ad selection, HMAC signing, and event tracking.
                You just call <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-primary">displayAd()</code> and
                render the result.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Zap, text: "Auto-signed requests with HMAC-SHA256" },
                  { icon: Sparkles, text: "React hooks and pre-built components included" },
                  { icon: DollarSign, text: "Revenue auto-calculated from CPM rates" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-base text-foreground">{text}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/docs#sdk-setup"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Full SDK documentation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Code block */}
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
                <span className="ml-3 text-xs text-white/40 font-mono">bot.ts</span>
              </div>
              <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-slate-300">
                <code>{sdkSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Capabilities</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Built for publisher control
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              You decide when ads show, how they look, and what categories are allowed. Prism gives you the
              tools — you set the rules.
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

      {/* ── Ad format preview ─────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Ad Formats</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Three formats, one API
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Choose the format that fits your conversation flow. All three are served through the same endpoint.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {/* Text format */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-primary">Text</span>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex-shrink-0" />
                    <div className="rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
                      What tools do you recommend for project management?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex-shrink-0" />
                    <div className="space-y-1.5">
                      <div className="rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
                        Here are some popular options for engineering teams...
                      </div>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                        <span className="font-semibold text-foreground">Sponsored</span>
                        <span className="text-muted-foreground"> — Try Linear: issue tracking built for speed. </span>
                        <span className="text-primary font-medium">Start free →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-base text-muted-foreground">Minimal footprint. Blends into message flow as a subtle inline suggestion.</p>
            </div>

            {/* Card format */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-primary">Card</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">Most popular</span>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  <div className="h-24 bg-gradient-to-br from-violet-500/20 via-primary/10 to-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary/40" />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-muted-foreground">Sponsored</p>
                    <p className="mt-0.5 text-xs font-semibold">Notion AI — Your Second Brain</p>
                    <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">Write, brainstorm, and organize faster with AI.</p>
                    <div className="mt-2 inline-flex rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">
                      Start Free Trial →
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-base text-muted-foreground">Rich visual card with image, copy, and CTA. Best engagement rates across the network.</p>
            </div>

            {/* Banner format */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-primary">Banner</span>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="h-36 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-violet-500/10" />
                    <div className="relative text-center px-4">
                      <p className="text-sm font-bold text-white">Ship faster with Vercel</p>
                      <p className="mt-1 text-[10px] text-white/60">Zero-config deployments for modern frameworks</p>
                      <div className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-900">
                        Deploy Now
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-base text-muted-foreground">Full-width visual banner. Works well for brand awareness campaigns between messages.</p>
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
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
                <Zap className="h-3.5 w-3.5" />
                Start earning
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">
                Ready to monetize your chatbot?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Create a free publisher account, register your bot, and start serving ads in minutes.
                No minimum traffic requirements. No upfront costs.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/app/login"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Create Publisher Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/docs"
                  className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
                >
                  Read the Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default Publishers;
