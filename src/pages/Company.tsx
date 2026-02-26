import SiteShell from "@/components/SiteShell";
import { Building2, ShieldCheck, Users, Zap } from "lucide-react";

const values = [
  {
    icon: Zap,
    title: "Practical AI Monetization",
    description: "We focus on ad systems that fit real chatbot workflows, not generic display patterns.",
  },
  {
    icon: ShieldCheck,
    title: "User Trust First",
    description: "Ad pacing and contextual relevance are designed to protect conversation quality.",
  },
  {
    icon: Building2,
    title: "Publisher-Advertiser Balance",
    description: "We build for both sides so supply quality and campaign outcomes improve together.",
  },
  {
    icon: Users,
    title: "Operator Friendly",
    description: "Teams should be able to launch, measure, and iterate without heavyweight operations.",
  },
];

const Company = () => {
  return (
    <SiteShell>
      <section className="relative overflow-hidden pt-32 pb-12">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Company</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Building the ad layer for conversational AI.
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground text-lg leading-relaxed">
            BotGrid exists to make chatbot monetization useful, measurable, and aligned with user experience.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6 grid gap-4 md:grid-cols-2">
          {values.map((value) => (
            <article key={value.title} className="rounded-2xl glow-border bg-card p-6">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <value.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{value.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{value.description}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
};

export default Company;
