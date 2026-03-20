import { MessageSquare, Target, DollarSign, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Integrate in minutes",
    description: "Drop the Prism SDK into any chatbot — GPT wrappers, custom AI agents, customer support bots, e-commerce assistants. Three lines of code is all it takes to start serving contextual ads.",
    accent: "from-primary to-primary/60",
  },
  {
    icon: Target,
    title: "Context-aware ad matching",
    description: "Prism's AI reads the conversation context in real-time and serves ads that feel like natural recommendations, not interruptions. This intent-level targeting delivers higher engagement than traditional display.",
    accent: "from-glow-secondary to-glow-secondary/60",
  },
  {
    icon: DollarSign,
    title: "Revenue flows automatically",
    description: "Chatbot publishers earn per impression and per click. Advertisers only pay for genuine engagement. Payouts are processed monthly with full transparency through your dashboard.",
    accent: "from-primary to-glow-secondary",
  },
  {
    icon: BarChart3,
    title: "Measure everything",
    description: "Real-time analytics dashboards track conversions, sentiment impact, click-through rates, and revenue across your entire chatbot fleet. Export reports or integrate via API.",
    accent: "from-glow-secondary to-primary",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-32" aria-labelledby="how-heading">
      <div className="container mx-auto px-6">
        <header className="text-center mb-20">
          <span className="text-xs font-mono text-primary uppercase tracking-widest">How It Works</span>
          <h2 id="how-heading" className="text-4xl md:text-5xl font-bold mt-4 tracking-tight">
            From integration to <span className="text-gradient-primary">income</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Prism makes it simple for chatbot developers and publishers to start earning ad revenue in under 10 minutes. Here's the step-by-step process.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
          {steps.map((step, i) => (
            <article
              key={step.title}
              className="group relative rounded-2xl glow-border bg-card p-8 hover:shadow-lg transition-all duration-500"
              role="listitem"
            >
              <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30 font-mono" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center mb-6`} aria-hidden="true">
                <step.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
