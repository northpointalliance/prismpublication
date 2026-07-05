import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const installSnippet = `npm install @prismpublication/sdk`;

const usageSnippet = `import { PrismAds } from "@prismpublication/sdk";

// Keep API keys on your server; never bundle them in frontend env vars.
const prism = new PrismAds({
  apiKey: process.env.PRISM_API_KEY!,
  botId: "my-chatbot",
  adFormat: "card",
  baseUrl: process.env.PRISM_API_BASE_URL || "https://your-api.example.com/api",
});

export async function handleMessage(userId: string, topic: string) {
  if (prism.shouldShowAd(userId, 5)) {
    const ad = await prism.displayAd({ topic, userId });
    if (ad) {
      await prism.trackImpression(ad.id, userId);
    }
    return ad;
  }
  return null;
}`;

const SDK = () => {
  return (
    <SiteShell>
      <section className="relative overflow-hidden pt-32 pb-12">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">SDK</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Integrate in minutes, customize as needed.
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground text-lg leading-relaxed">
            The SDK gives you ad fetch, formatting, impression/click tracking, and frequency controls for chatbot workflows.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl glow-border bg-card p-6">
            <h2 className="text-xl font-bold">1. Install</h2>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
              <code>{installSnippet}</code>
            </pre>

            <h2 className="mt-7 text-xl font-bold">2. Basic Usage</h2>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
              <code>{usageSnippet}</code>
            </pre>
          </div>

          <div className="rounded-2xl glow-border bg-card p-6">
            <h2 className="text-xl font-bold">Integration Notes</h2>
            <ul className="mt-4 space-y-3 text-base text-muted-foreground">
              <li>Use frequency guards (`shouldShowAd`) to avoid over-serving.</li>
              <li>Log and monitor `trackImpression` / `trackClick` for performance.</li>
              <li>Use `/notadmin` to manage ad inventory and review event logs.</li>
            </ul>

            <div className="mt-7 rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-primary">Next</p>
              <p className="mt-2 text-base text-muted-foreground">
                Validate placement and UX first, then move to production serving rules.
              </p>
              <Link to="/docs" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Open Full Documentation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/demo" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Open Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default SDK;
