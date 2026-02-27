import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Megaphone, Shield, TrendingUp, Users, Layers } from "lucide-react";
import { Link } from "react-router-dom";

const publisherFeatures = [
  { icon: Bot, text: "Works with any chatbot framework — OpenAI, LangChain, Rasa, custom agents" },
  { icon: Shield, text: "Non-intrusive, context-aware ad placement that respects user experience" },
  { icon: TrendingUp, text: "Average 3.2x revenue vs traditional display advertising networks" },
];

const advertiserFeatures = [
  { icon: Users, text: "Reach 200M+ unique users through AI chatbots and virtual assistants" },
  { icon: Megaphone, text: "Ads delivered as natural recommendations within real conversations" },
  { icon: Layers, text: "Intent-level targeting no other ad network can offer" },
];

const AudienceSection = () => {
  return (
    <section className="relative py-32" aria-labelledby="audience-heading">
      <h2 id="audience-heading" className="sr-only">For Publishers and Advertisers</h2>
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Publishers */}
          <article id="publishers" className="rounded-3xl glow-border bg-card p-10 md:p-14 flex flex-col justify-between" aria-labelledby="pub-heading">
            <div>
              <span className="text-xs font-mono text-primary uppercase tracking-widest">For Chatbot Publishers</span>
              <h3 id="pub-heading" className="text-3xl md:text-4xl font-bold mt-4 mb-4 tracking-tight">
                Monetize every <span className="text-gradient-primary">conversation</span>
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Connect your chatbot, set pacing rules, and monetize high-intent sessions while keeping conversation quality intact.
              </p>
              <ul className="space-y-4 mb-10" aria-label="Publisher benefits">
                {publisherFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm text-secondary-foreground">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/publishers">
              <Button variant="primary" className="w-fit">
                Start Publishing <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </Link>
          </article>

          {/* Advertisers */}
          <article id="advertisers" className="rounded-3xl glow-border bg-card p-10 md:p-14 flex flex-col justify-between" aria-labelledby="adv-heading">
            <div>
              <span className="text-xs font-mono text-glow-secondary uppercase tracking-widest">For Advertisers</span>
              <h3 id="adv-heading" className="text-3xl md:text-4xl font-bold mt-4 mb-4 tracking-tight">
                Ads that feel like <span className="text-gradient-primary">answers</span>
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Reach users while they are actively asking relevant questions instead of passively scrolling through generic inventory.
              </p>
              <ul className="space-y-4 mb-10" aria-label="Advertiser benefits">
                {advertiserFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm text-secondary-foreground">
                    <div className="h-8 w-8 rounded-lg bg-glow-secondary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                      <f.icon className="h-4 w-4 text-glow-secondary" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/advertisers">
              <Button variant="secondary" className="w-fit">
                Launch a Campaign <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
