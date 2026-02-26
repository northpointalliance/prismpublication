import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, BookOpen, CheckCircle2, Network, Wrench } from "lucide-react";

const sdkSnippet = `import { BotGridAds } from "@botgrid/sdk";

const sdk = new BotGridAds({
  // Inject from secure server/runtime config, not Vite public env vars.
  apiKey: process.env.BOTGRID_API_KEY!,
  botId: "my-chatbot",
  adFormat: "card",
  baseUrl: process.env.BOTGRID_API_BASE_URL || "https://your-api.example.com/api",
});

const ad = await sdk.displayAd({ topic: "ai", userId: "u-123" });
if (ad) {
  await sdk.trackImpression(ad.id, "u-123");
}`;

const apiSnippet = `curl -X POST http://localhost:8787/api/ads \\
  -H "Authorization: Bearer <BOTGRID_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "botId": "demo-bot",
    "position": "inline",
    "format": "card",
    "context": {"topic": "ai", "userId": "u-123"}
  }'`;

const runtimeSnippet = `./scripts/prism_stack.sh restart
./scripts/prism_stack.sh status
./scripts/prism_stack.sh logs`;

const Docs = () => {
  return (
    <SiteShell>
      <section className="relative overflow-hidden pb-12 pt-32">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Documentation</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Integration guides, common errors, and fixes in one place.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Use this page as the operational handbook for BotGrid setup, debugging, and day-to-day troubleshooting.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/sdk" className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
              SDK Reference
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/demo" className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold">
              Open Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto space-y-6 px-6">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-card p-5">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-lg font-bold">Integration</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                SDK setup, API usage, and portal login flow for advertisers and bot developers.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-lg font-bold">Troubleshooting</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Known errors with actionable fixes for Vite, Cloudflare, SDK build, and auth context.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <Network className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-lg font-bold">Operations</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Stack restart commands and verification checks for build, lint, tests, and runtime.
              </p>
            </article>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-2xl font-bold">1. SDK Integration</h2>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                <code>{sdkSnippet}</code>
              </pre>

              <h2 className="mt-8 text-2xl font-bold">2. API Direct Call</h2>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                <code>{apiSnippet}</code>
              </pre>

              <h2 className="mt-8 text-2xl font-bold">3. Stack Runtime Commands</h2>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                <code>{runtimeSnippet}</code>
              </pre>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-2xl font-bold">Common Errors</h2>
              <Accordion type="single" collapsible className="mt-3">
                <AccordionItem value="vite-host">
                  <AccordionTrigger>Blocked request: host not allowed</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Add `server.allowedHosts: true` in `vite.config.ts` when using Cloudflare/custom domains.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="rollup-module">
                  <AccordionTrigger>Cannot find module `@rollup/rollup-linux-x64-gnu`</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Reinstall dependencies and ensure optional Rollup Linux package is present in devDependencies.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="esbuild-mismatch">
                  <AccordionTrigger>esbuild host/binary version mismatch</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Use the updated SDK build script that auto-selects a runnable platform binary.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="cloudflare-530">
                  <AccordionTrigger>Cloudflare 530/403 on production hostname</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Verify Cloudflare DNS records, tunnel ingress hostnames, and that origin services are running.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="api-401">
                  <AccordionTrigger>API unauthorized errors</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    SDK calls require `Authorization: Bearer BOTGRID_API_KEY`. Admin endpoints require `x-admin-key`.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-7 rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-primary">First Login Flow</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <CheckCircle2 className="mr-2 inline h-4 w-4 text-primary" />
                    Create your own account at <code>/app/login</code>.
                  </li>
                  <li>
                    <CheckCircle2 className="mr-2 inline h-4 w-4 text-primary" />
                    On first login, pick <strong>Advertiser</strong> or <strong>Bot Developer</strong>.
                  </li>
                  <li>
                    <CheckCircle2 className="mr-2 inline h-4 w-4 text-primary" />
                    The app creates your workspace and loads mock dashboard data for validation.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default Docs;
