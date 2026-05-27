import { CheckCircle2, Lock, Zap } from "lucide-react";
import Reveal from "@/components/Reveal";

const publisherBullets = [
  "Publisher Controls — frequency caps, category filters, pacing rules",
  "Operational Visibility — impressions, clicks, quality signals",
];

const advertiserBullets = [
  "Intent Matching — ads placed in topically relevant moments",
  "Advertiser Guardrails — placement controls and brand-safety preferences",
];

const AudienceSection = () => {
  return (
    <section className="relative py-32" aria-labelledby="audience-heading">
      <h2 id="audience-heading" className="sr-only">For Publishers and Advertisers</h2>
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ─── For Publishers ─────────────────────────────────────────── */}
          <Reveal className="flex flex-col gap-4">
            <article
              id="publishers"
              aria-labelledby="pub-heading"
              className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-sky-50 via-white to-blue-50 p-10 md:p-12"
            >
              <span className="text-[11px] font-mono text-primary uppercase tracking-widest">
                Audience Owners
              </span>
              <h3 id="pub-heading" className="text-3xl md:text-4xl font-medium mt-4 mb-5 tracking-tight">
                For Publishers
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Set ad frequency caps, category filters, and pacing rules per chatbot.
                Track impressions, clicks, and quality signals in one workflow.
                Use contextual signals without relying on personal profile targeting.
              </p>
              <ul className="space-y-3" aria-label="Publisher benefits">
                {publisherBullets.map((text) => (
                  <li key={text} className="flex items-start gap-3 text-sm md:text-base text-foreground/80">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </article>

            {/* Inline supporting card */}
            <div className="rounded-2xl border border-border bg-card px-6 py-5 flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Fast Integration</p>
                <p className="text-sm text-muted-foreground mt-0.5">Deploy the SDK quickly</p>
              </div>
            </div>
          </Reveal>

          {/* ─── For Advertisers ────────────────────────────────────────── */}
          <Reveal delay={150} className="flex flex-col gap-4">
            <article
              id="advertisers"
              aria-labelledby="adv-heading"
              className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-sky-50 via-white to-blue-50 p-10 md:p-12"
            >
              <span className="text-[11px] font-mono text-primary uppercase tracking-widest">
                Brand Growth
              </span>
              <h3 id="adv-heading" className="text-3xl md:text-4xl font-medium mt-4 mb-5 tracking-tight">
                For Advertisers
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Reach high-intent users inside live chatbot conversations.
                Place ads when users are already discussing relevant topics.
                Run campaigns with placement controls and brand-safety preferences.
              </p>
              <ul className="space-y-3" aria-label="Advertiser benefits">
                {advertiserBullets.map((text) => (
                  <li key={text} className="flex items-start gap-3 text-sm md:text-base text-foreground/80">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </article>

            {/* Inline supporting card */}
            <div className="rounded-2xl border border-border bg-card px-6 py-5 flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Privacy-Forward Design</p>
                <p className="text-sm text-muted-foreground mt-0.5">Contextual signals, not profile-based targeting</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
