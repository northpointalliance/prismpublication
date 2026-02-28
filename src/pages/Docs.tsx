import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, BookOpen, CheckCircle2, Terminal, AlertCircle, Play } from "lucide-react";

// ── Code snippets ────────────────────────────────────────────────────────────

const installSnippet = `npm install @prism/sdk`;

const sdkSnippet = `import { PrismAds } from "@prism/sdk";

const prism = new PrismAds({
  apiKey: process.env.PRISM_API_KEY!,   // server-side only
  botId: "my-chatbot",
  adFormat: "card",
  baseUrl: process.env.PRISM_API_BASE_URL,
});

// Inside your message handler:
const ad = await prism.displayAd({ topic: "lifestyle", userId: "u-123" });
if (ad) {
  await prism.trackImpression(ad.id, "u-123");
}`;

const apiSnippet = `curl -X POST https://your-api.example.com/api/ads \\
  -H "Authorization: Bearer <PRISM_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "botId": "demo-bot",
    "position": "inline",
    "format": "card",
    "context": { "topic": "lifestyle", "userId": "u-123" }
  }'`;

const runtimeSnippet = `./scripts/prism_stack.sh restart
./scripts/prism_stack.sh status
./scripts/prism_stack.sh logs`;

// ── Section header component ─────────────────────────────────────────────────

const SectionHeader = ({
  id,
  step,
  label,
  title,
  subtitle,
}: {
  id: string;
  step: string;
  label: string;
  title: string;
  subtitle: string;
}) => (
  <div id={id} className="scroll-mt-28">
    <div className="flex items-center gap-3">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {step}
      </span>
      <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">{label}</p>
    </div>
    <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
  </div>
);

// ── Code block component ──────────────────────────────────────────────────────

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-relaxed text-slate-100">
    <code>{children}</code>
  </pre>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: "SDK Setup", href: "#sdk-setup" },
  { label: "API Reference", href: "#api-reference" },
  { label: "Portal Guide", href: "#portal-guide" },
  { label: "Troubleshooting", href: "#troubleshooting" },
];

const portalSteps = [
  {
    icon: BookOpen,
    step: "1",
    title: "Create an account",
    description: "Go to /app/login and sign up with your email and password.",
  },
  {
    icon: CheckCircle2,
    step: "2",
    title: "Choose your workspace",
    description: "Pick Advertiser (run campaigns) or Bot Developer (monetize bots).",
  },
  {
    icon: Terminal,
    step: "3",
    title: "Dashboard loads",
    description: "Your workspace initializes with example data pulled from the API.",
  },
  {
    icon: Play,
    step: "4",
    title: "Take action",
    description: "Advertisers launch the 3-step ad wizard. Bot developers register bots and get SDK keys.",
  },
];

const commonErrors = [
  {
    id: "vite-host",
    trigger: "Blocked request: host not allowed",
    content:
      "Add server.allowedHosts: true in vite.config.ts when using Cloudflare tunnels or custom domains.",
  },
  {
    id: "rollup-module",
    trigger: "Cannot find module @rollup/rollup-linux-x64-gnu",
    content:
      "Reinstall dependencies and confirm the optional Rollup Linux package is listed in devDependencies.",
  },
  {
    id: "esbuild-mismatch",
    trigger: "esbuild host/binary version mismatch",
    content:
      "Use the updated SDK build script that auto-selects a runnable platform binary instead of a pinned one.",
  },
  {
    id: "cloudflare-530",
    trigger: "Cloudflare 530/403 on production hostname",
    content:
      "Verify Cloudflare DNS records, tunnel ingress hostnames, and confirm the origin services are running.",
  },
  {
    id: "api-401",
    trigger: "API returns 401 Unauthorized",
    content:
      "SDK calls require Authorization: Bearer PRISM_API_KEY. Admin endpoints additionally require x-admin-key header.",
  },
];

const Docs = () => {
  return (
    <SiteShell>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-10 pt-32">
        <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Documentation</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need to integrate and run Prism.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            SDK setup, API reference, portal onboarding, and troubleshooting — in one place.
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
              Open App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sticky section nav ────────────────────────────────────────────── */}
      <nav className="sticky top-[57px] z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex gap-1 overflow-x-auto px-6 py-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-20 px-6 py-14">

        {/* ── Section 1: SDK Setup ─────────────────────────────────────── */}
        <section>
          <SectionHeader
            id="sdk-setup"
            step="1"
            label="SDK Setup"
            title="Install and initialize the SDK"
            subtitle="Add Prism to any Node.js chatbot in under five minutes."
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Install</p>
              <CodeBlock>{installSnippet}</CodeBlock>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Initialize + Serve</p>
              <CodeBlock>{sdkSnippet}</CodeBlock>
              <p className="mt-3 text-xs text-muted-foreground">
                Keep <code className="rounded bg-muted px-1 py-0.5">PRISM_API_KEY</code> server-side. Never expose it
                in client bundles or public env vars.
              </p>
            </div>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* ── Section 2: API Reference ─────────────────────────────────── */}
        <section>
          <SectionHeader
            id="api-reference"
            step="2"
            label="API Reference"
            title="Call the ad endpoint directly"
            subtitle="Use the REST API without the SDK if you prefer direct HTTP calls."
          />
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              POST /api/ads — Request an ad
            </p>
            <CodeBlock>{apiSnippet}</CodeBlock>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { key: "botId", desc: "Your registered bot public ID" },
                { key: "context.topic", desc: "Conversation topic for targeting" },
                { key: "format", desc: "card · text · banner" },
              ].map(({ key, desc }) => (
                <div key={key} className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs">
                  <code className="font-semibold text-primary">{key}</code>
                  <p className="mt-1 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* ── Section 3: Portal Guide ───────────────────────────────────── */}
        <section>
          <SectionHeader
            id="portal-guide"
            step="3"
            label="Portal Guide"
            title="Get started with your workspace"
            subtitle="First-time setup for advertisers and bot developers."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {portalSteps.map(({ icon: Icon, step, title, description }) => (
              <div key={step} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/app/login"
              className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Open the App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* ── Section 4: Troubleshooting ────────────────────────────────── */}
        <section>
          <SectionHeader
            id="troubleshooting"
            step="4"
            label="Troubleshooting"
            title="Common errors and stack operations"
            subtitle="Solutions to the most frequent setup and runtime issues."
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Common errors */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <p className="font-semibold text-foreground">Common Errors</p>
              </div>
              <Accordion type="single" collapsible>
                {commonErrors.map(({ id, trigger, content }) => (
                  <AccordionItem key={id} value={id}>
                    <AccordionTrigger className="text-sm text-left">{trigger}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{content}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Stack operations */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-foreground">Stack Operations</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  For self-hosted deployments using the included shell scripts.
                </p>
                <CodeBlock>{runtimeSnippet}</CodeBlock>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Need help?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  If you're stuck on an issue not listed here, reach out via the{" "}
                  <Link to="/contact" className="font-medium text-primary hover:underline">
                    contact page
                  </Link>{" "}
                  and include your error message and SDK version.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
};

export default Docs;
