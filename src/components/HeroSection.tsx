import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";

// ── Conversation mockup showing a native ad in a chat ───────────────────────

const ConversationMockup = () => (
  <div className="overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-2xl">
    {/* Title bar */}
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
      <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
      <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
      <span className="ml-3 text-[10px] text-white/40 font-mono">AI Assistant — acme.com</span>
    </div>
    {/* Chat messages */}
    <div className="p-4 space-y-3">
      {/* User message */}
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary/20 px-3.5 py-2">
          <p className="text-xs text-white/90">Can you recommend a good tool for writing and organizing notes?</p>
        </div>
      </div>
      {/* Bot reply */}
      <div className="flex gap-2.5">
        <div className="h-7 w-7 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary/70" />
        </div>
        <div className="space-y-2 max-w-[80%]">
          <div className="rounded-2xl rounded-bl-md bg-white/5 px-3.5 py-2">
            <p className="text-xs text-white/80 leading-relaxed">
              Great question! Here are some popular options for note-taking and knowledge management...
            </p>
          </div>
          {/* Native ad card */}
          <div className="overflow-hidden rounded-xl border border-primary/20 bg-white/[0.03]">
            <div className="h-14 bg-gradient-to-br from-violet-500/20 via-primary/10 to-emerald-500/20 flex items-center justify-center">
              <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white/50" />
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[8px] font-medium text-primary">Sponsored</span>
              </div>
              <p className="text-[11px] font-semibold text-white">Notion AI — Your Second Brain</p>
              <p className="mt-0.5 text-[10px] text-white/50 leading-relaxed">Write, brainstorm, and organize faster with AI-powered tools.</p>
              <div className="mt-2 inline-flex rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">
                Start Free Trial
              </div>
            </div>
          </div>
          <div className="rounded-2xl rounded-bl-md bg-white/5 px-3.5 py-2">
            <p className="text-xs text-white/80 leading-relaxed">
              Other popular options include Obsidian for local-first markdown and Bear for Apple-native simplicity.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Main component ──────────────────────────────────────────────────────────

const HeroSection = () => {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex items-center overflow-hidden pt-32 pb-20"
    >
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-glow" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-glow-secondary/5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} aria-hidden="true" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono text-primary mb-8">
              <Zap className="h-3 w-3" aria-hidden="true" />
              Conversational ad platform for chatbot teams
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="animate-fade-up-delay-1 text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.9] mb-6"
            >
              Monetize AI chatbot
              <br />
              conversations with
              <br />
              <span className="text-gradient-primary">native ads.</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up-delay-2 text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Prism helps publishers earn from chat sessions and helps advertisers reach users in high-intent moments.
              Ads appear as relevant recommendations, not disruptive banners.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up-delay-3 flex flex-col items-center lg:items-start gap-4">
              <Link to="/demo">
                <Button variant="primary" size="lg" className="text-base px-8 py-6">
                  Run Interactive Demo
                  <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">No signup required. See the full flow in under 2 minutes.</p>
            </div>

            <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap justify-center lg:justify-start gap-3 text-base text-muted-foreground" role="list" aria-label="Core value points">
              {[
                "Publisher pacing controls",
                "Context-aware ad matching",
                "SDK integration in minutes",
              ].map((item) => (
                <div key={item} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2" role="listitem">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Conversation mockup */}
          <div className="animate-fade-up-delay-2 relative hidden lg:block">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 blur-2xl" aria-hidden="true" />
            <div className="relative">
              <ConversationMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
