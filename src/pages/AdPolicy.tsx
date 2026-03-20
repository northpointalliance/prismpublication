import SiteShell from "@/components/SiteShell";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Scale,
  Eye,
  Ban,
} from "lucide-react";

// ── Prohibited categories ────────────────────────────────────────────────────

const prohibitedCategories = [
  {
    category: "Adult / sexual content",
    covers:
      "Pornography, sexual services, adult dating platforms, explicit imagery or suggestive content targeting adults",
  },
  {
    category: "Illegal gambling operations",
    covers:
      "Unlicensed gambling services, offshore casinos operating without jurisdiction-specific permits, any gambling service targeting minors",
  },
  {
    category: "Crypto, NFT, and speculative investment schemes",
    covers:
      "Cryptocurrency exchanges promoting speculation, NFT minting platforms, token presales, yield farming, get-rich-quick investment products",
  },
  {
    category: "Payday loans and predatory lending",
    covers:
      "Short-term high-interest loans, debt consolidation schemes, credit repair scams, unlicensed financial services",
  },
  {
    category: "Tobacco and vaping",
    covers:
      "Cigarettes, cigars, e-cigarettes, vaping devices, nicotine products, smokeless tobacco",
  },
  {
    category: "Weapons and firearms",
    covers:
      "Guns, ammunition, accessories designed to modify weapons, knives marketed as weapons",
  },
  {
    category: "Misleading health claims",
    covers:
      "Unverified supplements, miracle cures, weight loss products making unsupported medical claims, unapproved treatments",
  },
  {
    category: "Political advertising",
    covers:
      "Political candidates, parties, PACs, ballot initiatives, political advocacy of any affiliation",
  },
  {
    category: "Hate speech and discrimination",
    covers:
      "Any content targeting individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin",
  },
  {
    category: "Malware and deceptive destinations",
    covers:
      "Ads linking to malware, phishing pages, fake login screens, deceptive landing pages, or any destination that misrepresents itself",
  },
  {
    category: "MLM and pyramid schemes",
    covers:
      "Multi-level marketing recruitment, pyramid scheme participation fees, income opportunity claims requiring upfront payment to join",
  },
];

// ── Creative requirements ────────────────────────────────────────────────────

const creativeRequirements = [
  {
    icon: Eye,
    title: "Honest representation",
    description:
      "Ads must accurately represent the product or service being promoted. No misleading claims, fake urgency, or bait-and-switch tactics.",
  },
  {
    icon: ShieldCheck,
    title: "Safe destinations",
    description:
      "All click URLs must lead to legitimate, functioning pages that match the ad's promise. No redirects to unrelated content.",
  },
  {
    icon: Scale,
    title: "Clear advertiser identity",
    description:
      "Every ad must identify the advertiser. Users should always know who is speaking to them in a conversation.",
  },
  {
    icon: CheckCircle2,
    title: "Respectful tone",
    description:
      "Ads placed inside conversations must feel native and respectful. No aggressive language, excessive capitalization, or manipulative framing.",
  },
];

// ── Enforcement actions ──────────────────────────────────────────────────────

const enforcementActions = [
  {
    level: "Warning",
    description:
      "First-time minor violations receive a warning with guidance on how to bring the ad into compliance.",
  },
  {
    level: "Ad takedown",
    description:
      "Ads that violate policy are immediately removed from serving. Advertisers are notified with the specific violation.",
  },
  {
    level: "Account suspension",
    description:
      "Repeated or severe violations result in account suspension. All active campaigns are paused pending review.",
  },
  {
    level: "Permanent ban",
    description:
      "Advertisers who repeatedly violate policies after warnings, or who submit prohibited content, are permanently removed from the network.",
  },
];

// ── Section nav ──────────────────────────────────────────────────────────────

const navItems = [
  { label: "Prohibited Categories", href: "#prohibited" },
  { label: "Restricted Categories", href: "#restricted" },
  { label: "Creative Requirements", href: "#creative" },
  { label: "Enforcement", href: "#enforcement" },
  { label: "Reporting", href: "#reporting" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

const AdPolicy = () => {
  return (
    <SiteShell>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-10 pt-32">
        <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
            <ShieldAlert className="h-3.5 w-3.5" />
            Network Policy
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Advertising Standards &amp; Prohibited Content
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Prism places ads inside live conversations. That requires a higher standard of
            trust. This page outlines what we allow, what we don't, and how we enforce it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Report a violation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/docs"
              className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold"
            >
              View Documentation
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

        {/* ── Section 1: Prohibited Categories ─────────────────────────── */}
        <section id="prohibited" className="scroll-mt-28">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              <Ban className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-red-500">Permanently Excluded</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Prohibited Categories</h2>
          <p className="mt-2 text-base text-muted-foreground">
            The following categories are permanently excluded from the Prism network. No exceptions
            will be made regardless of brand size, budget, or framing of the request.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_2fr_auto] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <span>Category</span>
              <span>What this covers</span>
              <span className="text-right">Status</span>
            </div>

            {/* Table rows */}
            {prohibitedCategories.map((row, i) => (
              <div
                key={row.category}
                className={`grid grid-cols-[1fr_2fr_auto] items-center gap-4 px-5 py-4 ${
                  i < prohibitedCategories.length - 1 ? "border-b border-border/60" : ""
                } ${i % 2 === 0 ? "bg-card" : "bg-background"}`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldX className="hidden h-4 w-4 flex-shrink-0 text-red-500 sm:block" />
                  <span className="text-sm font-medium text-foreground">{row.category}</span>
                </div>
                <p className="text-base leading-relaxed text-muted-foreground">{row.covers}</p>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  NOT ALLOWED
                </span>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-border/60" />

        {/* ── Section: Restricted Categories ─────────────────────────────── */}
        <section id="restricted" className="scroll-mt-28">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-amber-600">Case-by-Case Review</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Restricted Categories</h2>
          <p className="mt-2 text-base text-muted-foreground">
            The following categories are not banned outright but require additional review and must meet
            strict compliance conditions before approval.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-amber-200">
            <div className="grid grid-cols-[1fr_2fr_auto] gap-4 border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">
              <span>Category</span>
              <span>Conditions</span>
              <span className="text-right">Status</span>
            </div>

            <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-4 bg-card px-5 py-4">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="hidden h-4 w-4 flex-shrink-0 text-amber-500 sm:block" />
                <span className="text-sm font-medium text-foreground">Gambling &amp; sports betting</span>
              </div>
              <div className="text-base leading-relaxed text-muted-foreground">
                <p>
                  Online casinos, poker platforms, sports betting, lottery services, and fantasy sports
                  with cash prizes are evaluated on a case-by-case basis. Approval requires:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  <li>
                    <strong>United States:</strong> Chatbot publishers and chatbots must operate in states
                    where online gambling is legal. Age restrictions must match the relevant state and
                    federal laws.
                  </li>
                  <li>
                    <strong>Other countries:</strong> Where online gambling and chatbots are published,
                    all applicable local regulations, licensing requirements, and age restrictions apply.
                  </li>
                  <li>
                    Advertisers must provide proof of valid licensing for every jurisdiction they intend
                    to target.
                  </li>
                </ul>
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                RESTRICTED
              </span>
            </div>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* ── Section 2: Creative Requirements ─────────────────────────── */}
        <section id="creative" className="scroll-mt-28">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Quality Standards</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Creative Requirements</h2>
          <p className="mt-2 text-base text-muted-foreground">
            All ads on the Prism network must meet these baseline quality standards before they
            can be approved for serving.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {creativeRequirements.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                </div>
                <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Conversational context matters
                </p>
                <p className="mt-1 text-base leading-relaxed text-amber-800">
                  Because Prism ads appear inside real-time conversations, we hold creatives to a
                  higher standard than display or banner networks. Ads that might be acceptable on
                  a webpage sidebar can still be rejected if they disrupt conversational flow or
                  feel manipulative in a chat context.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* ── Section 3: Enforcement ───────────────────────────────────── */}
        <section id="enforcement" className="scroll-mt-28">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              <Scale className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Compliance</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Enforcement Process</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Prism reviews all ads before they go live. Violations discovered after approval are
            handled through the following escalation process.
          </p>

          <div className="mt-8 space-y-3">
            {enforcementActions.map(({ level, description }, i) => (
              <div key={level} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  {i < enforcementActions.length - 1 && (
                    <div className="mt-2 h-full w-px bg-border" />
                  )}
                </div>
                <div className="pb-1">
                  <h3 className="font-semibold text-foreground">{level}</h3>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-border/60" />

        {/* ── Section 4: Reporting ─────────────────────────────────────── */}
        <section id="reporting" className="scroll-mt-28">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Contact</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Report a Violation</h2>
          <p className="mt-2 text-base text-muted-foreground">
            If you encounter an ad on the Prism network that you believe violates these policies,
            we want to hear about it.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">For publishers</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                If an ad is appearing in your bot that doesn't meet these standards, you can flag
                it directly from the Publisher Portal or reach out via the contact form. Include
                the ad ID if possible — it's returned in every SDK response.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Contact us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">For end users</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                If you're a user of a chatbot powered by Prism and you've seen an ad that feels
                inappropriate, misleading, or harmful, please let us know. Every report is reviewed
                by a human.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Report an ad
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Our commitment</p>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Prism exists to make conversational advertising trustworthy. These policies aren't
              just guidelines — they're enforced automatically during ad review and continuously
              monitored after approval. We'd rather reject revenue than compromise the experience
              publishers and users expect.
            </p>
          </div>
        </section>
      </div>
    </SiteShell>
  );
};

export default AdPolicy;
