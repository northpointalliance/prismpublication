import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Bot, Shield, Wallet } from "lucide-react";

const publisherPoints = [
  {
    icon: Bot,
    title: "Fits your chatbot stack",
    description: "Use Prism with GPT wrappers, customer support bots, and custom AI assistants with minimal integration work.",
  },
  {
    icon: Shield,
    title: "Protects user experience",
    description: "Context-aware placements keep ad moments relevant and non-disruptive instead of interruptive.",
  },
  {
    icon: Wallet,
    title: "Predictable monetization",
    description: "Earn on impressions and clicks with transparent pacing controls and monthly payout visibility.",
  },
  {
    icon: BarChart3,
    title: "Operational analytics",
    description: "Track ad load, CTR, and revenue by bot, audience segment, and conversation type.",
  },
];

const Publishers = () => {
  return (
    <SiteShell>
      <section className="relative overflow-hidden pt-32 pb-12">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">For Publishers</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Monetize chatbot conversations without hurting trust.
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground text-lg leading-relaxed">
            This flow is built for teams that own conversational products and need a practical ad layer that stays aligned with UX.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/sdk"
              className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Review SDK
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/demo"
              className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6 grid gap-4 md:grid-cols-2">
          {publisherPoints.map((point) => (
            <article key={point.title} className="rounded-2xl glow-border bg-card p-6">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <point.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{point.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{point.description}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
};

export default Publishers;
