import { CheckCircle2, Shield } from "lucide-react";

// ── Code snippets ────────────────────────────────────────────────────────────

const installSnippet = `npm install @prismpublication/sdk`;

const quickStartSnippet = `import { PrismAds } from "@prismpublication/sdk";

const prism = new PrismAds({
  apiKey: process.env.PRISM_SDK_KEY,   // your bot's SDK key — keep server-side
  botId: "your-bot-public-id",         // from the Publisher Portal
  adFormat: "card",                     // "text" | "card" | "banner"
});

// Inside your message handler:
const ad = await prism.displayAd({
  topic: "productivity",  // conversation topic for targeting
  userId: "user-123",     // optional — for frequency capping
});

if (ad) {
  sendMessage(formatAdCard(ad));
  await prism.trackImpression(ad.id, "user-123");
}`;

const reactSnippet = `import { usePrismAd, PrismAdComponent } from "@prismpublication/sdk/react";

function ChatWindow() {
  const { ad, loading, refresh } = usePrismAd({
    apiKey: "your-sdk-key",
    botId: "your-bot-id",
    topic: "travel",
    adFormat: "card",
    frequency: 5,       // show ad every 5 messages
    autoFetch: true,
  });

  return (
    <div>
      <MessageList />
      {ad && <PrismAdComponent ad={ad} adFormat="card" />}
    </div>
  );
}`;

const curlSnippet = `# Request an ad
curl -X POST https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/ads \\
  -H "Authorization: Bearer YOUR_SDK_KEY" \\
  -H "Content-Type: application/json" \\
  -H "X-Prism-Timestamp: $(date +%s)" \\
  -H "X-Prism-Signature: sha256=HMAC_HEX" \\
  -d '{
    "botId": "your-bot-public-id",
    "format": "card",
    "context": {
      "topic": "productivity",
      "userId": "user-123"
    }
  }'`;

const responseSnippet = `{
  "success": true,
  "data": [
    {
      "id": "ad_abc123",
      "title": "Try Notion AI — Your Second Brain",
      "description": "Write, brainstorm, and organize faster.",
      "ctaText": "Start Free Trial",
      "clickUrl": "https://notion.so/ai",
      "imageUrl": "https://...",
      "advertiser": "Notion",
      "tags": ["productivity", "ai", "writing"]
    }
  ]
}`;

const trackSnippet = `# Track an impression
curl -X POST https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/track/impression \\
  -H "Authorization: Bearer YOUR_SDK_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "adId": "ad_abc123",
    "botId": "your-bot-public-id",
    "userId": "user-123",
    "topic": "productivity"
  }'`;

// ── Reusable components ──────────────────────────────────────────────────────

const CodeBlock = ({ title, children }: { title?: string; children: string }) => (
  <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950">
    {title && (
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 text-xs text-white/40 font-mono">{title}</span>
      </div>
    )}
    <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-300">
      <code>{children}</code>
    </pre>
  </div>
);

const ParamCard = ({ name, type, description }: { name: string; type: string; description: string }) => (
  <div className="rounded-xl border border-border bg-background px-4 py-3">
    <div className="flex items-center gap-2">
      <code className="text-sm font-semibold text-primary">{name}</code>
      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{type}</span>
    </div>
    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

// ── Sidebar nav ──────────────────────────────────────────────────────────────

const sections = [
  { id: "install", label: "Install" },
  { id: "quick-start", label: "Quick Start" },
  { id: "react", label: "React Hooks" },
  { id: "rest-api", label: "REST API" },
  { id: "tracking", label: "Event Tracking" },
  { id: "formats", label: "Ad Formats" },
  { id: "auth", label: "Authentication" },
];

// ── Main ─────────────────────────────────────────────────────────────────────

const SdkDocsTab = () => (
  <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
    {/* Sticky sidebar nav */}
    <nav className="hidden lg:block">
      <div className="sticky top-28 space-y-1">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">On this page</p>
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>

    {/* Content */}
    <div className="space-y-12">
      {/* ── Install ───────────────────────────────────────────────── */}
      <section id="install">
        <h3 className="text-lg font-bold">Install the SDK</h3>
        <div className="mt-3">
          <CodeBlock title="terminal">{installSnippet}</CodeBlock>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          The package ships ESM, CJS, and TypeScript definitions. React hooks are available at{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-primary">@prismpublication/sdk/react</code>.
        </p>
      </section>

      {/* ── Quick Start ───────────────────────────────────────────── */}
      <section id="quick-start">
        <h3 className="text-lg font-bold">Quick Start</h3>
        <p className="mt-1 text-sm text-muted-foreground">Initialize with your bot credentials and serve your first ad.</p>

        <div className="mt-4">
          <CodeBlock title="bot.ts">{quickStartSnippet}</CodeBlock>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Keep your SDK key server-side</p>
              <p className="mt-1 text-sm text-amber-800">
                Never expose it in client-side code, public repos, or browser-accessible env vars.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ParamCard name="apiKey" type="string" description="Your bot's SDK key from the Publisher Portal. Used for authentication and request signing." />
          <ParamCard name="botId" type="string" description="Your bot's public ID. Found in the Publisher Portal under bot settings." />
          <ParamCard name="adFormat" type="string" description='Default ad format: "text", "card", or "banner". Can be overridden per request.' />
        </div>
      </section>

      {/* ── React ──────────────────────────────────────────────────── */}
      <section id="react">
        <h3 className="text-lg font-bold">React Hooks & Components</h3>
        <p className="mt-1 text-sm text-muted-foreground">Drop-in hook and pre-built component for React-based chatbot UIs.</p>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">React 16.8+</span>
          </div>
          <CodeBlock title="ChatWindow.tsx">{reactSnippet}</CodeBlock>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ParamCard name="topic" type="string" description="Conversation context for ad targeting. Pass the current discussion topic." />
          <ParamCard name="frequency" type="number" description="Show an ad every N messages. Prevents over-serving in active conversations." />
          <ParamCard name="autoFetch" type="boolean" description="Automatically fetch a new ad when the component mounts." />
          <ParamCard name="adFormat" type="string" description="Format for the PrismAdComponent renderer: text, card, or banner." />
        </div>

        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary">PrismAdComponent</code> handles
            impression tracking, click tracking, and format rendering automatically. For custom
            UIs, use <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary">usePrismAd</code> directly.
          </p>
        </div>
      </section>

      {/* ── REST API ───────────────────────────────────────────────── */}
      <section id="rest-api">
        <h3 className="text-lg font-bold">REST API</h3>
        <p className="mt-1 text-sm text-muted-foreground">Call the ad endpoint from any language without the SDK.</p>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-600">POST</span>
              <p className="text-sm font-semibold text-foreground">/api/ads</p>
            </div>
            <CodeBlock title="request.sh">{curlSnippet}</CodeBlock>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-blue-600">200</span>
              <p className="text-sm font-semibold text-foreground">Response</p>
            </div>
            <CodeBlock title="response.json">{responseSnippet}</CodeBlock>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Request parameters</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ParamCard name="botId" type="string required" description="Your bot's public ID. Must match the bot associated with your SDK key." />
            <ParamCard name="format" type="string" description='Ad format: "text", "card", or "banner". Defaults to card.' />
            <ParamCard name="context.topic" type="string" description="Conversation topic for relevance matching." />
            <ParamCard name="context.userId" type="string" description="End-user identifier for frequency capping. Not stored or shared." />
            <ParamCard name="position" type="string" description='"inline", "sidebar", or "floating". Informational for analytics.' />
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Response fields</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ParamCard name="id" type="string" description="Unique ad identifier. Pass to tracking endpoints." />
            <ParamCard name="title" type="string" description="Ad headline. Primary text in card and text formats." />
            <ParamCard name="description" type="string" description="Ad body copy. One or two sentences." />
            <ParamCard name="ctaText" type="string" description='Call-to-action label (e.g., "Start Free Trial").' />
            <ParamCard name="clickUrl" type="string" description="Destination URL on ad click." />
            <ParamCard name="tags" type="string[]" description="Topic tags from the campaign." />
          </div>
        </div>
      </section>

      {/* ── Event Tracking ─────────────────────────────────────────── */}
      <section id="tracking">
        <h3 className="text-lg font-bold">Event Tracking</h3>
        <p className="mt-1 text-sm text-muted-foreground">Report ad events so performance data flows to your revenue dashboard.</p>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-600">POST</span>
            <p className="text-sm font-semibold text-foreground">/api/track/:eventType</p>
          </div>
          <CodeBlock title="track.sh">{trackSnippet}</CodeBlock>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <p className="text-sm font-semibold">Impression</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fire when the ad is displayed. Triggers revenue calculation at the platform CPM rate.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-semibold">Click</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fire when the user clicks the CTA. Recorded for advertiser analytics and optimization.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">SDK users:</strong>{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-primary">prism.trackImpression()</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-primary">prism.trackClick()</code> handle auth
            and signing automatically.
          </p>
        </div>
      </section>

      {/* ── Ad Formats ─────────────────────────────────────────────── */}
      <section id="formats">
        <h3 className="text-lg font-bold">Ad Formats</h3>
        <p className="mt-1 text-sm text-muted-foreground">Three formats, same endpoint. All served through POST /api/ads.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-primary">Text</span>
            <h4 className="mt-2 font-semibold">Inline suggestion</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Minimal footprint. Short text with sponsor label and CTA link.
            </p>
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
              <span className="font-semibold text-foreground">Sponsored</span>
              <span className="text-muted-foreground"> — Try Linear: issue tracking built for speed. </span>
              <span className="text-primary font-medium">Start free &rarr;</span>
            </div>
          </div>

          <div className="rounded-xl border border-primary/30 bg-card p-5 shadow-sm shadow-primary/5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-primary">Card</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Most used</span>
            </div>
            <h4 className="mt-2 font-semibold">Rich media card</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Image, headline, description, and CTA button. Highest engagement.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-border bg-background">
              <div className="h-12 bg-gradient-to-br from-violet-500/20 via-primary/10 to-emerald-500/20" />
              <div className="p-2">
                <p className="text-[10px] text-muted-foreground">Sponsored</p>
                <p className="text-xs font-semibold">Notion AI — Your Second Brain</p>
                <div className="mt-1 inline-flex rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Start Free Trial
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-primary">Banner</span>
            <h4 className="mt-2 font-semibold">Full-width visual</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Image-forward display. Great for brand awareness between conversation turns.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <div className="flex h-12 items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                <div className="text-center">
                  <p className="text-xs font-bold text-white">Ship faster with Vercel</p>
                  <p className="text-[9px] text-white/60">Zero-config deployments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Authentication ─────────────────────────────────────────── */}
      <section id="auth">
        <h3 className="text-lg font-bold">Authentication</h3>
        <p className="mt-1 text-sm text-muted-foreground">How requests are authenticated and protected against replay attacks.</p>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="font-semibold text-foreground">Bearer token</h4>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Every request must include your SDK key in the Authorization header.
              Keys are scoped to a single bot and can be revoked from this portal.
            </p>
            <div className="mt-3 rounded-lg bg-slate-950 px-3 py-2">
              <code className="text-xs text-slate-300">Authorization: Bearer bgsk_your_key_here</code>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="font-semibold text-foreground">HMAC signing</h4>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Requests are signed with HMAC-SHA256 using your SDK key as the secret.
              The signed payload is <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">timestamp\n body</code>.
              Timestamps must be within 5 minutes.
            </p>
            <div className="mt-3 space-y-1">
              <div className="rounded-lg bg-slate-950 px-3 py-1.5">
                <code className="text-xs text-slate-300">X-Prism-Timestamp: 1709654321</code>
              </div>
              <div className="rounded-lg bg-slate-950 px-3 py-1.5">
                <code className="text-xs text-slate-300">X-Prism-Signature: sha256=a1b2c3...</code>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">
              <strong>The SDK handles signing automatically.</strong> If you use{" "}
              <code className="rounded bg-emerald-100 px-1 py-0.5 text-xs font-mono">@prismpublication/sdk</code>,
              you don't need to implement HMAC manually.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default SdkDocsTab;