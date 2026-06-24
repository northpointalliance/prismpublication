import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import MouseGrid from "@/components/MouseGrid";
import Typewriter from "@/components/Typewriter";

const HeroSection = () => {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex items-center overflow-hidden pt-32 pb-20"
    >
      {/* Mouse-reactive grid background — scoped to the hero */}
      <MouseGrid />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-glow" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-glow-secondary/5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} aria-hidden="true" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1
            id="hero-heading"
            className="animate-fade-up-delay-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-tight leading-[0.95]"
          >
            <Typewriter
              speedMs={45}
              startDelayMs={300}
              segments={[
                { text: "Built an AI app?", breakAfter: true },
                { text: "Add revenue", breakAfter: true },
                { text: "in minutes.", className: "text-gradient-rainbow" },
              ]}
            />
          </h1>

          <p className="animate-fade-up-delay-2 mt-8 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Prism is the ad SDK for AI chatbot developers. Drop three lines into any bot or agent, set your own frequency rules, and earn CPM&nbsp;+&nbsp;CPC from every conversation — no banner ads, no UX damage.
          </p>

          <div className="animate-fade-up-delay-3 mt-10 flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link to="/demo">
              <Button variant="primary" size="lg" className="text-base px-8 py-6">
                See How It Works
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </Link>
            <a href="https://prism-publication-demo.vercel.app" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="lg" className="text-base px-8 py-6">
                Try Live Bots
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </a>
            <Link to="/docs">
              <Button variant="secondary" size="lg" className="text-base px-8 py-6">
                Documentation
              </Button>
            </Link>
          </div>

          <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground" role="list" aria-label="Core value points">
            {[
              "npm install @prism/sdk",
              "Ships in an afternoon",
              "You control pacing & categories",
            ].map((item) => (
              <div key={item} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2" role="listitem">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
