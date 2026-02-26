import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32"
    >
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-glow" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-glow-secondary/5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} aria-hidden="true" />

      <div className="relative z-10 container mx-auto px-6 text-center max-w-5xl">
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
        <p className="animate-fade-up-delay-2 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          BotGrid helps publishers earn from chat sessions and helps advertisers reach users in high-intent moments.
          Ads appear as relevant recommendations, not disruptive banners.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up-delay-3 flex flex-col items-center gap-4">
          <Link to="/demo">
            <Button variant="hero" size="lg" className="text-base px-8 py-6">
              Run Interactive Demo
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">No signup required. See the full flow in under 2 minutes.</p>
        </div>

        <div className="animate-fade-up-delay-3 mt-14 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground" role="list" aria-label="Core value points">
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
    </section>
  );
};

export default HeroSection;
