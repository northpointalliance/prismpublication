import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const UseCases = () => {
  return (
    <SiteShell>
      <section className="relative overflow-hidden pt-32 pb-12">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Use Cases</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Pick your path.
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground text-lg leading-relaxed">
            Two dedicated experiences: one for chatbot publishers and one for advertisers.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl glow-border bg-card p-8">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-primary mb-3">For Publishers</p>
            <h2 className="text-3xl font-bold tracking-tight">App developers and AI product teams</h2>
            <ul className="mt-5 space-y-3 text-base text-muted-foreground">
              <li>Add a revenue stream to the AI chat interface inside your app.</li>
              <li>Partner integrations surface at the right moment — contextual, not disruptive.</li>
              <li>Works alongside your existing ad stack. Full control over pacing and placement rules.</li>
            </ul>
            <Link
              to="/publishers"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Open Publisher page
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-3xl glow-border bg-card p-8">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-primary mb-3">For Advertisers</p>
            <h2 className="text-3xl font-bold tracking-tight">Campaigns in intent-rich moments</h2>
            <ul className="mt-5 space-y-3 text-base text-muted-foreground">
              <li>Reach users while they are actively asking for recommendations.</li>
              <li>Run native ad cards instead of interruptive banner units.</li>
              <li>Optimize creative by topic, vertical, and response quality.</li>
            </ul>
            <Link
              to="/advertisers"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Open Advertiser page
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>
    </SiteShell>
  );
};

export default UseCases;
