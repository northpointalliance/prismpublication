import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Network, Target } from "lucide-react";

const Product = () => {
  const flow = [
    {
      icon: Bot,
      title: "Collect Chat Context",
      description: "Capture lightweight intent signals from the active conversation without interrupting user flow.",
    },
    {
      icon: Target,
      title: "Select Relevant Sponsor",
      description: "Match context to advertiser campaigns so placements feel useful instead of random.",
    },
    {
      icon: Network,
      title: "Measure & Improve",
      description: "Track impressions and clicks to optimize timing, format, and campaign performance over time.",
    },
  ];

  return (
    <SiteShell>
      <section className="relative overflow-hidden pt-32 pb-14">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Product</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            A practical ad layer for AI conversations.
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground text-lg leading-relaxed">
            Prism is designed to help chatbot teams monetize responsibly and help advertisers reach users in high-intent moments.
            It focuses on relevance, pacing, and measurable outcomes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/demo"
              className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              See Live Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/sdk"
              className="btn-sweep inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Review SDK
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {flow.map((item) => (
              <article key={item.title} className="rounded-2xl glow-border bg-card p-6">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{item.title}</h2>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default Product;
