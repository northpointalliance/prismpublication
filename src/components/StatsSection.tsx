const stats = [
  { value: "$42M+", label: "Paid to Chatbot Publishers", sub: "Last 12 months" },
  { value: "187", label: "Countries Reached", sub: "Global chatbot ad coverage" },
  { value: "340ms", label: "Avg Ad Response Time", sub: "Real-time conversational ad serving" },
  { value: "98.7%", label: "Uptime SLA", sub: "Enterprise-grade reliability" },
  { value: "0.3%", label: "User Complaint Rate", sub: "Ads that don't annoy chatbot users" },
  { value: "24/7", label: "Publisher Support", sub: "Dedicated account team" },
];

const StatsSection = () => {
  return (
    <section id="stats" className="relative py-32" aria-labelledby="stats-heading">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px]" />
      </div>

      <div className="relative container mx-auto px-6">
        <header className="text-center mb-20">
          <span className="text-xs font-mono text-primary uppercase tracking-widest">The Network</span>
          <h2 id="stats-heading" className="text-4xl md:text-5xl font-bold mt-4 tracking-tight">
            Scale that <span className="text-gradient-primary">speaks</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            BotGrid powers chatbot advertising at scale across every major AI platform, serving billions of ad impressions monthly to engaged conversational audiences worldwide.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6" role="list" aria-label="Network performance metrics">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl glow-border bg-card p-8 text-center hover:shadow-md transition-all duration-300"
              role="listitem"
            >
              <div className="text-3xl md:text-4xl font-bold font-mono text-primary mb-2">{stat.value}</div>
              <div className="text-sm font-medium mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.sub}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
