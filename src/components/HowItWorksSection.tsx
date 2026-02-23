import { MessageSquare, Target, DollarSign, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Integrate in minutes",
    description: "Drop our SDK into any chatbot — GPT wrappers, custom agents, customer support bots. Three lines of code.",
    accent: "from-primary to-primary/60",
  },
  {
    icon: Target,
    title: "Context-aware matching",
    description: "Our AI reads the conversation context in real-time and serves ads that feel like natural recommendations, not interruptions.",
    accent: "from-glow-secondary to-glow-secondary/60",
  },
  {
    icon: DollarSign,
    title: "Revenue flows",
    description: "Publishers earn per impression and click. Advertisers only pay for genuine engagement. Everyone wins.",
    accent: "from-primary to-glow-secondary",
  },
  {
    icon: BarChart3,
    title: "Measure everything",
    description: "Real-time dashboards track conversions, sentiment impact, and revenue across your entire bot fleet.",
    accent: "from-glow-secondary to-primary",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-32">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-xs font-mono text-primary uppercase tracking-widest">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 tracking-tight">
            From integration to <span className="text-gradient-primary">income</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative rounded-2xl glow-border bg-card p-8 hover:bg-secondary/30 transition-all duration-500"
            >
              <div className="absolute top-6 right-6 text-5xl font-black text-muted/30 font-mono">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center mb-6`}>
                <step.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
