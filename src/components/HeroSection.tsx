import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden="true" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-glow" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-glow-secondary/5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} aria-hidden="true" />

      <div className="relative z-10 container mx-auto px-6 text-center max-w-5xl">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono text-primary mb-8">
          <Zap className="h-3 w-3" aria-hidden="true" />
          The ad network built for conversational AI
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="animate-fade-up-delay-1 text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6"
        >
          Google connected
          <br />
          <span className="text-gradient-primary">websites.</span>
          <br />
          We connect
          <br />
          <span className="text-gradient-primary">chatbots.</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up-delay-2 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          BotGrid is the first ad network purpose-built for AI conversations.
          Monetize your chatbot or reach millions of users through the bots people already trust every day.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg" className="text-base px-8 py-6">
            Start Monetizing Your Chatbot
            <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Button>
          <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
            Run Ads on Chatbots
          </Button>
        </div>

        {/* Live counter */}
        <div className="animate-fade-up-delay-3 mt-16 flex flex-wrap justify-center gap-8 md:gap-16" role="list" aria-label="Network statistics">
          {[
            { value: "12,400+", label: "Chatbots Connected" },
            { value: "2.1B", label: "Monthly Impressions" },
            { value: "4.7x", label: "Higher CTR vs Display Ads" },
          ].map((stat) => (
            <div key={stat.label} className="text-center" role="listitem">
              <div className="text-2xl md:text-3xl font-bold font-mono text-primary" aria-label={`${stat.value} ${stat.label}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
