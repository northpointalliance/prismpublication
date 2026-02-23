const stats = [
  { value: "$42M+", label: "Paid to Publishers", sub: "Last 12 months" },
  { value: "187", label: "Countries Reached", sub: "Global coverage" },
  { value: "340ms", label: "Avg Response Time", sub: "Real-time ad serving" },
  { value: "98.7%", label: "Uptime SLA", sub: "Enterprise reliability" },
  { value: "0.3%", label: "User Complaint Rate", sub: "Ads that don't annoy" },
  { value: "24/7", label: "Support", sub: "Dedicated team" },
];

const StatsSection = () => {
  return (
    <section id="stats" className="relative py-32">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative container mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-xs font-mono text-primary uppercase tracking-widest">The Network</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 tracking-tight">
            Scale that <span className="text-gradient-primary">speaks</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl glow-border bg-card p-8 text-center hover:bg-secondary/20 transition-all duration-300"
            >
              <div className="text-3xl md:text-4xl font-bold font-mono text-primary mb-2">{stat.value}</div>
              <div className="text-sm font-medium mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
