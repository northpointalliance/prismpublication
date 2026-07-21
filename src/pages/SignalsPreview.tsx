import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Headphones,
  ShieldAlert,
  MessageCircleQuestion,
  FileSearch,
  Sparkles,
  UserRound,
} from "lucide-react";

const PreviewBanner = () => (
  <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950">
    <strong className="font-semibold">Preview only.</strong>{" "}
    This page is not linked from the main site. Open it to review copy and layout before going live.{" "}
    <span className="font-mono text-xs text-amber-800">/preview/signals</span>
  </div>
);

const signalRows = [
  { label: "Intent", value: "support", tone: "bg-sky-100 text-sky-800" },
  { label: "Confidence", value: "0.41", tone: "bg-slate-100 text-slate-700" },
  { label: "Emotion", value: "frustrated", tone: "bg-orange-100 text-orange-800" },
  { label: "Stage", value: "consider", tone: "bg-teal-100 text-teal-800" },
  { label: "Safety", value: "ok", tone: "bg-emerald-100 text-emerald-800" },
  { label: "Action", value: "tone_shift", tone: "bg-primary/15 text-sky-900 font-semibold" },
];

const actions = [
  {
    icon: MessageCircleQuestion,
    title: "Ask another question",
    body: "When confidence is low, Signals recommends clarifying before the bot guesses wrong.",
  },
  {
    icon: FileSearch,
    title: "Retrieve different documents",
    body: "Early exploration maps to retrieve. Ready-to-act maps to recommend or offer.",
  },
  {
    icon: UserRound,
    title: "Escalate to a human",
    body: "Safety flags and crisis language trigger escalate so the bot does not keep chatting alone.",
  },
  {
    icon: Sparkles,
    title: "Change tone",
    body: "Anxious or frustrated turns get tone_shift before any hard sell or rigid script.",
  },
  {
    icon: Headphones,
    title: "Recommend a next step",
    body: "When the user is evaluating options, recommend a product, plan, or article that fits.",
  },
  {
    icon: ShieldAlert,
    title: "Show an offer (optional)",
    body: "Only when stage and intent say go, and safety is clear. Monetization is a plugin, not the default.",
  },
];

const audiences = [
  {
    title: "Customer support bots",
    body: "You already run an LLM on tickets and chat. Signals tells you when to clarify, soften, or hand off to an agent.",
  },
  {
    title: "In-product assistants",
    body: "SaaS copilots that answer how-to questions. Score each turn so retrieval and escalation are not guesswork.",
  },
  {
    title: "Coaching and lifestyle bots",
    body: "High-trust conversations. Suppress offers when emotion or safety says wait. Keep the relationship intact.",
  },
];

const SignalsPreview = () => {
  return (
    <SiteShell>
      <PreviewBanner />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20">
        <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
        <div className="absolute top-1/4 left-1/5 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" aria-hidden="true" />
        <div className="absolute bottom-1/5 right-1/4 h-72 w-72 rounded-full bg-teal-400/10 blur-[100px]" aria-hidden="true" />

        <div className="container relative z-10 mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Prism Signals</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
              Your bot already talks.
              <br />
              <span className="text-gradient-primary">Teach it when to act.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Prism Signals scores every turn: intent, confidence, emotion, decision stage, topic, and safety.
              Then it recommends what to do next. Built for teams that already shipped an LLM, starting with
              customer support and in-product assistants.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/contact"
                className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Talk to us about Signals
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/docs"
                className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
              >
                Read the API shape
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Preview positioning. Ads are optional. Judgment is the product.
            </p>
          </div>

          {/* Live-looking score panel */}
          <div className="mx-auto mt-14 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Turn score
                </p>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono text-primary">
                  engine: heuristic
                </span>
              </div>
              <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground">
                <span className="font-medium text-muted-foreground">User: </span>
                This still isn&apos;t fixed and I&apos;ve already waited two days. Can someone actually help?
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {signalRows.map((row) => (
                  <div key={row.label} className="rounded-lg border border-border/80 bg-background px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{row.label}</p>
                    <p className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-xs font-mono ${row.tone}`}>
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Reason: user emotion is frustrated. Soften tone before selling or advancing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Not only for ad networks</h2>
            <p className="mt-4 text-muted-foreground">
              If you already put an LLM in front of customers, you need turn-level judgment. Monetization can come later.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="space-y-2">
                <h3 className="text-lg font-semibold">{a.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What the bot can do */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">One score. Many next steps.</h2>
            <p className="mt-4 text-muted-foreground">
              Prism returns signals and a recommended action. Your bot (or agent stack) decides how to execute it.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map(({ icon: Icon, title, body }) => (
              <div key={title} className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-secondary/20 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How Prism Signals works</h2>
          </div>
          <ol className="mx-auto mt-12 max-w-3xl space-y-8">
            {[
              {
                step: "1",
                title: "Send the last few turns",
                body: "Your support bot (or any LLM app) calls POST /api/signals/score with recent messages. Same SDK auth you already use for ads.",
              },
              {
                step: "2",
                title: "Get signals + an action",
                body: "Heuristics run on every call. Optionally enable LLM scoring per bot for a hybrid engine. You receive intent, confidence, emotion, stage, topics, safety, and a recommended action.",
              },
              {
                step: "3",
                title: "Wire the action into your stack",
                body: "Clarify → ask one question. Escalate → human queue. Retrieve → RAG path. Offer → optional partner suggestion when it is safe and timely.",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contrast with ads */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
              Ads stay available. They are not the front door.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <div className="space-y-2 border-l-2 border-primary pl-5">
                <h3 className="font-semibold">Signals (this offer)</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sold to companies that already run LLMs. Value is better conversations: fewer bad handoffs,
                  clearer next steps, safer moments.
                </p>
              </div>
              <div className="space-y-2 border-l-2 border-border pl-5">
                <h3 className="font-semibold">Marketplace (existing)</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  When action is offer and you opt in, Prism can still return a contextual partner suggestion.
                  Same pipe. Different buyer story.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Review this pitch, then we go live.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            This route is a private preview. When you approve the story and layout, we can promote it to a public
            URL and link it from the nav.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Contact
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/publishers"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
            >
              Compare to Publishers (ads) page
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default SignalsPreview;
