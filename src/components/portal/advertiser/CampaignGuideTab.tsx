import { CheckCircle2, AlertTriangle, ShieldCheck, Zap, LifeBuoy } from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────

const campaignSteps = [
  {
    step: "1",
    title: "Create a campaign",
    description:
      'Click "New Campaign" in the Dashboard tab. Fill in your ad title, description, CTA text, and destination URL. Choose between text, card, or banner format.',
  },
  {
    step: "2",
    title: "Set targeting topics",
    description:
      "Add comma-separated topic keywords (e.g. productivity, ai, developer). Prism matches your ad to conversations about these topics. More specific topics = higher relevance.",
  },
  {
    step: "3",
    title: "Configure budget",
    description:
      "Set a daily budget and campaign duration. Total lifetime budget = daily x days. Funds are reserved from your wallet at campaign creation time.",
  },
  {
    step: "4",
    title: "Submit for review",
    description:
      "New campaigns enter a review queue. Our team checks creative quality and ad policy compliance. Reviews complete within 1 business day. Approved ads go live automatically — no action needed on your end.",
  },
];

const formatSpecs = [
  {
    format: "Text",
    cpm: "$10",
    description: "Short text with sponsor label and CTA link. Minimal footprint in chat flow.",
    bestFor: "Text-heavy conversational bots, quick recommendations.",
  },
  {
    format: "Card",
    cpm: "$20",
    description: "Image, headline, description, and CTA button. Highest engagement rates.",
    bestFor: "Product showcases, app promotions, SaaS offers.",
    popular: true,
  },
  {
    format: "Banner",
    cpm: "$15",
    description: "Full-width visual block. Clickable image with overlay text.",
    bestFor: "Brand awareness, visual campaigns, event promotions.",
  },
];

const creativeTips = [
  { do: true, text: "Write clear, specific headlines (e.g., \"Track Issues 2x Faster with Linear\")" },
  { do: true, text: "Use high-quality images that are relevant to the ad message" },
  { do: true, text: "Keep descriptions under 2 sentences — users scan, not read" },
  { do: true, text: 'Include a strong CTA verb (\"Start Free Trial\", \"Get Started\", \"Try Now\")' },
  { do: false, text: "Use ALL CAPS or excessive punctuation in headlines" },
  { do: false, text: "Include misleading claims or fake urgency (\"Last chance!\", \"Only 1 left!\")" },
  { do: false, text: "Link to broken pages, paywalls without disclosure, or unrelated content" },
  { do: false, text: "Target prohibited categories — see our Ad Policy page for details" },
];

const budgetFaq = [
  {
    q: "How is my budget spent?",
    a: "Budget is consumed via CPM (cost per 1,000 impressions). Each time your ad is shown, the platform deducts the per-impression cost from your campaign budget. Rates vary by format.",
  },
  {
    q: "What happens when my budget runs out?",
    a: "Your ad stops serving immediately. It won't be selected for any new requests until the budget is refilled or a new campaign is created.",
  },
  {
    q: "Can I edit budget after launch?",
    a: "You can adjust the daily pacing cap and duration. The lifetime budget is locked at the amount reserved at launch to prevent overruns on the wallet.",
  },
  {
    q: "How do I add funds to my wallet?",
    a: "Go to the Billing panel in the Dashboard tab. Enter a top-up amount and complete the PayPal checkout. Funds are credited instantly.",
  },
  {
    q: "What does 'Pending Review' mean?",
    a: "New and edited campaigns are reviewed by our team before going live. Reviews typically complete within a few hours. You'll see the status change in your campaign list.",
  },
  {
    q: "Can I pause or stop a live campaign?",
    a: "Yes. Use the toggle button on your campaign card in the Dashboard tab. Paused campaigns stop serving immediately and can be resumed anytime.",
  },
];

const creativeSpecs = [
  {
    field: "Ad title / headline",
    formats: "Text, Card, Banner",
    limit: "4 – 140 characters",
    notes: "Shown prominently. Be specific — generic headlines underperform.",
  },
  {
    field: "Body / description",
    formats: "Text, Card",
    limit: "8 – 400 characters",
    notes: "1–2 sentences max. Users scan; keep it punchy.",
  },
  {
    field: "CTA button text",
    formats: "Text, Card, Banner",
    limit: "2 – 60 characters",
    notes: 'Start with a verb: "Start Free Trial", "Get Started", "Try Now".',
  },
  {
    field: "Destination URL",
    formats: "All",
    limit: "HTTPS only, max 500 characters",
    notes: "Must resolve to a live, policy-compliant landing page.",
  },
  {
    field: "Image URL (Card)",
    formats: "Card",
    limit: "HTTPS URL — JPG, PNG, or WebP",
    notes: "Min 400 × 300 px recommended. Hosted on a public CDN or your own server.",
  },
  {
    field: "Image URL (Banner)",
    formats: "Banner",
    limit: "HTTPS URL — JPG, PNG, or WebP",
    notes: "Min 1200 × 300 px recommended for crisp rendering across devices.",
  },
  {
    field: "Topic keywords",
    formats: "All",
    limit: "Each keyword max 60 characters",
    notes: "Comma-separated list. 3–5 specific terms outperform a single broad one.",
  },
];

const deliveryFaq = [
  {
    q: "Is there an auction or real-time bidding?",
    a: "No. Prism uses weight-based selection, not an auction. All campaigns that match a conversation topic are eligible; the winning ad is chosen with probability proportional to its weight (1–100). Higher weight = more likely to serve when matched.",
  },
  {
    q: "How does the weight field work?",
    a: "Weight sets your campaign's relative priority against other matched campaigns in the same topic. Weight 50 is twice as likely to win as weight 25. There is no bidding — you set weight once and it stays fixed unless you edit it.",
  },
  {
    q: "What is the daily cap?",
    a: "Your daily budget is a pacing cap. Once your campaign has spent its daily budget, it stops serving for that calendar day and automatically resumes the next day. This prevents budget from running out on day one.",
  },
  {
    q: "How quickly does a campaign go live after approval?",
    a: "Immediately. Once our team approves the campaign, it enters the active pool and will begin serving on the next eligible ad request that matches your topics. There is no additional delay.",
  },
  {
    q: "Can I target or exclude specific publisher bots?",
    a: "Not directly by name today. Targeting works through topic matching: publishers tag their bots with content categories, and your campaign topics are matched against those tags. Bot-level allowlists and blocklists are on the roadmap. Contact us if you need a specific exclusion now.",
  },
  {
    q: "What counts as an impression vs. a click?",
    a: "An impression is recorded when the ad is returned in an API response and rendered by the publisher bot. A click is recorded when a user taps the CTA link. CPM billing is based on impressions only — clicks are tracked but not charged separately.",
  },
];

const brandSafetyItems = [
  {
    title: "Publisher content categories",
    detail:
      "Every publisher bot declares a content category (e.g., productivity, finance, entertainment) when it registers. These tags drive topic matching — your ad only serves on bots whose declared categories overlap with your campaign topics.",
  },
  {
    title: "Block adjacency",
    detail:
      "You can flag content categories you do not want your brand adjacent to. Any bot tagged with a blocked category is excluded from your campaign's eligible inventory, even if there is a topic overlap.",
  },
  {
    title: "Category filters",
    detail:
      "Separate from block adjacency, category filters let you restrict your campaign to a specific set of approved content categories — an allowlist rather than a blocklist. Useful for regulated industries.",
  },
  {
    title: "Ad policy enforcement",
    detail:
      "All creatives are reviewed before going live. Ads that violate policy are rejected with a written reason. Publishers running non-compliant bots can be suspended. See the Ad Policy page for the full prohibited-categories list.",
  },
];

const fraudFaq = [
  {
    q: "How do you detect invalid traffic?",
    a: "The SDK deduplicates impression and click events server-side using request fingerprinting and timestamp gating. Suspiciously high event rates from a single bot or user ID trigger automatic flagging for manual review.",
  },
  {
    q: "What happens if invalid impressions are billed?",
    a: "If our team confirms invalid traffic was billed, we issue a wallet credit for the affected amount. Contact support with your campaign ID and the date range in question.",
  },
  {
    q: "Are publisher bots vetted before they can serve ads?",
    a: "Yes. Bots are registered through the publisher portal and require approval before they receive live API keys. Bots that generate anomalous traffic patterns are suspended pending review.",
  },
];

const supportFaq = [
  {
    q: "How do I reach support?",
    a: "Email info@prismpublication.com. We aim to respond within 1 business day for active advertisers. Include your campaign ID for faster triage.",
  },
  {
    q: "Do you sign a Data Processing Agreement (DPA)?",
    a: "Yes. If your organization requires a DPA for GDPR or similar compliance, email us and we will send one for signature. Our standard portal terms of service cover basic data handling; a signed DPA provides additional contractual protections.",
  },
  {
    q: "Can I run a pilot or negotiate a higher-volume deal?",
    a: "Yes. Contact us before launching if you want guaranteed inventory, private publisher deals, volume pricing, or SLA commitments. We handle these on a case-by-case basis.",
  },
  {
    q: "How do I get reach and inventory estimates for my topic?",
    a: "We do not publish live inventory counts publicly yet. Email us with your target topics and budget range and we will send estimated monthly impressions available for that niche.",
  },
  {
    q: "How quickly will my ads reach users after a publisher integrates the SDK?",
    a: "Once a publisher registers their bot and it passes review, your approved campaign is eligible to serve on the next ad request from that bot. There is no additional configuration required on your end.",
  },
];

// ── Sidebar nav ──────────────────────────────────────────────────────────────

const sections = [
  { id: "setup", label: "Campaign Setup" },
  { id: "formats", label: "Ad Formats & Pricing" },
  { id: "creative", label: "Creative Guidelines" },
  { id: "specs", label: "Creative Specs" },
  { id: "targeting", label: "Topic Targeting" },
  { id: "delivery", label: "Delivery Mechanics" },
  { id: "brandsafety", label: "Brand Safety" },
  { id: "billing", label: "Billing & Budget" },
  { id: "fraud", label: "Fraud & Quality" },
  { id: "support", label: "Support & Legal" },
];

// ── Main ─────────────────────────────────────────────────────────────────────

const CampaignGuideTab = () => (
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
      {/* ── Campaign Setup ─────────────────────────────────────────── */}
      <section id="setup">
        <h3 className="text-lg font-bold">Campaign Setup</h3>
        <p className="mt-1 text-sm text-muted-foreground">Four steps from draft to live — here's the full flow.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {campaignSteps.map(({ step, title, description }) => (
            <div key={step} className="group relative rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
              <span className="absolute right-4 top-4 text-3xl font-bold text-muted/20">{step}</span>
              <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {step}
              </div>
              <h4 className="font-semibold text-foreground">{title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ad Formats & Pricing ───────────────────────────────────── */}
      <section id="formats">
        <h3 className="text-lg font-bold">Ad Formats & Pricing</h3>
        <p className="mt-1 text-sm text-muted-foreground">Choose the format that fits the conversation context. Pricing is CPM-based.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {formatSpecs.map(({ format, cpm, description, bestFor, popular }) => (
            <div
              key={format}
              className={`rounded-xl border p-5 ${
                popular ? "border-primary/30 bg-card shadow-sm shadow-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-primary">
                  {format}
                </span>
                {popular && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                    Most used
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{cpm}</span>
                <span className="text-xs text-muted-foreground">CPM</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{description}</p>
              <p className="mt-2 text-xs">
                <span className="font-medium text-foreground">Best for:</span>{" "}
                <span className="text-muted-foreground">{bestFor}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Creative Guidelines ────────────────────────────────────── */}
      <section id="creative">
        <h3 className="text-lg font-bold">Creative Guidelines</h3>
        <p className="mt-1 text-sm text-muted-foreground">Follow these rules to get your ads approved faster.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Do</p>
            <ul className="space-y-2">
              {creativeTips.filter((t) => t.do).map((t) => (
                <li key={t.text} className="flex items-start gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-700">Don't</p>
            <ul className="space-y-2">
              {creativeTips.filter((t) => !t.do).map((t) => (
                <li key={t.text} className="flex items-start gap-2 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Creative Specs ─────────────────────────────────────────── */}
      <section id="specs">
        <h3 className="text-lg font-bold">Creative Specs</h3>
        <p className="mt-1 text-sm text-muted-foreground">Hard limits enforced by the platform. Submissions outside these ranges will be rejected at creation.</p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Field</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Applies to</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Limit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</th>
              </tr>
            </thead>
            <tbody>
              {creativeSpecs.map(({ field, formats, limit, notes }, i) => (
                <tr key={field} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{field}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formats}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary whitespace-nowrap">{limit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Topic Targeting ────────────────────────────────────────── */}
      <section id="targeting">
        <h3 className="text-lg font-bold">Topic Targeting</h3>
        <p className="mt-1 text-sm text-muted-foreground">How Prism matches your ads to relevant conversations.</p>

        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              When you create a campaign, you assign <strong className="text-foreground">topic keywords</strong> (e.g.,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-primary">productivity, ai, writing</code>).
              When a chatbot requests an ad, it sends the current conversation topic.
            </p>
            <p>
              Prism's ad selection engine scores your campaign against the request topic. Higher
              keyword overlap = higher match score = higher probability of being served.
            </p>
            <p>
              <strong className="text-foreground">Tips:</strong> Use 3-5 specific topics per campaign.
              Avoid overly broad terms like "technology" — go for "developer tools", "code editor", etc.
              You can edit topics after launch without losing campaign data.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">3-5</p>
            <p className="text-xs text-muted-foreground">Topics per campaign (recommended)</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">1-100</p>
            <p className="text-xs text-muted-foreground">Weight range for priority control</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">Real-time</p>
            <p className="text-xs text-muted-foreground">Topic edits apply instantly</p>
          </div>
        </div>
      </section>

      {/* ── Delivery Mechanics ─────────────────────────────────────── */}
      <section id="delivery">
        <h3 className="text-lg font-bold">Delivery Mechanics</h3>
        <p className="mt-1 text-sm text-muted-foreground">How Prism decides which ad to serve — and when.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {deliveryFaq.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{q}</p>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Brand Safety ───────────────────────────────────────────── */}
      <section id="brandsafety">
        <h3 className="text-lg font-bold">Brand Safety</h3>
        <p className="mt-1 text-sm text-muted-foreground">Controls that keep your ads away from content that does not fit your brand.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {brandSafetyItems.map(({ title, detail }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Billing & Budget ───────────────────────────────────────── */}
      <section id="billing">
        <h3 className="text-lg font-bold">Billing & Budget</h3>
        <p className="mt-1 text-sm text-muted-foreground">How wallet funding, campaign budgets, and spend work.</p>

        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Fund your wallet</p>
                <p className="text-xs text-muted-foreground">Top up via PayPal from the Billing panel. Minimum $1.00.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Budget is reserved at launch</p>
                <p className="text-xs text-muted-foreground">When you submit a campaign, the lifetime budget (daily x days) is deducted from your wallet and reserved.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Spend accrues per impression</p>
                <p className="text-xs text-muted-foreground">Each impression costs CPM / 1000. Spend is tracked in real-time on your campaign cards.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Daily pacing caps</p>
                <p className="text-xs text-muted-foreground">Your daily budget acts as a pacing cap. Once hit, your ad pauses until the next day to spread spend evenly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section id="faq">
        <h3 className="text-lg font-bold">Billing FAQ</h3>
        <p className="mt-1 text-sm text-muted-foreground">Common budget and spend questions.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {budgetFaq.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{q}</p>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fraud & Quality ────────────────────────────────────────── */}
      <section id="fraud">
        <h3 className="text-lg font-bold">Fraud & Quality Protection</h3>
        <p className="mt-1 text-sm text-muted-foreground">How we protect your budget from invalid traffic.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fraudFaq.map(({ q, a }) => (
            <div key={q} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">{q}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Support & Legal ────────────────────────────────────────── */}
      <section id="support">
        <h3 className="text-lg font-bold">Support & Legal</h3>
        <p className="mt-1 text-sm text-muted-foreground">Getting help, compliance questions, and enterprise deals.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {supportFaq.map(({ q, a }) => (
            <div key={q} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <LifeBuoy className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{q}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default CampaignGuideTab;
