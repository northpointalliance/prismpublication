import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Megaphone, Shield, TrendingUp, Users, Layers } from "lucide-react";

const publisherFeatures = [
  { icon: Bot, text: "Works with any chatbot framework" },
  { icon: Shield, text: "Non-intrusive, context-aware ad placement" },
  { icon: TrendingUp, text: "Average 3.2x revenue vs traditional display" },
];

const advertiserFeatures = [
  { icon: Users, text: "Reach 200M+ unique users through bots" },
  { icon: Megaphone, text: "Ads delivered as natural recommendations" },
  { icon: Layers, text: "Intent-level targeting no other network offers" },
];

const AudienceSection = () => {
  return (
    <section className="relative py-32">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Publishers */}
          <div id="publishers" className="rounded-3xl glow-border bg-card p-10 md:p-14 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-primary uppercase tracking-widest">For Publishers</span>
              <h3 className="text-3xl md:text-4xl font-bold mt-4 mb-4 tracking-tight">
                Monetize every <span className="text-gradient-primary">conversation</span>
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Turn your chatbot's engagement into revenue without degrading user experience. 
                Our AI ensures ads feel like helpful suggestions.
              </p>
              <ul className="space-y-4 mb-10">
                {publisherFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm text-secondary-foreground">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="hero" className="w-fit">
              Start Publishing <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Advertisers */}
          <div id="advertisers" className="rounded-3xl glow-border bg-card p-10 md:p-14 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-glow-secondary uppercase tracking-widest">For Advertisers</span>
              <h3 className="text-3xl md:text-4xl font-bold mt-4 mb-4 tracking-tight">
                Ads that feel like <span className="text-gradient-primary">answers</span>
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Reach users at the exact moment they're asking about your product category. 
                Intent-matched, conversational, and trusted.
              </p>
              <ul className="space-y-4 mb-10">
                {advertiserFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm text-secondary-foreground">
                    <div className="h-8 w-8 rounded-lg bg-glow-secondary/10 flex items-center justify-center shrink-0">
                      <f.icon className="h-4 w-4 text-glow-secondary" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="hero-outline" className="w-fit">
              Launch a Campaign <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
