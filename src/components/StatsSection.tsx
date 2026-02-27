const highlights = [
  { title: "Publisher Controls", sub: "Set ad frequency caps, category filters, and pacing rules per chatbot." },
  { title: "Intent Matching", sub: "Place ads when users are already discussing relevant topics." },
  { title: "Advertiser Guardrails", sub: "Run campaigns with placement controls and brand-safety preferences." },
  { title: "Fast Integration", sub: "Deploy the SDK quickly and iterate without heavy infrastructure changes." },
  { title: "Operational Visibility", sub: "Track impressions, clicks, and quality signals in one workflow." },
  { title: "Privacy-Forward Design", sub: "Use contextual signals without relying on personal profile targeting." },
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
            Built for <span className="text-gradient-primary">trust and outcomes</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Conversion performance matters, but long-term retention matters more.
            Prism is designed to help teams grow revenue without damaging the chat experience.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Platform highlights">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl glow-border bg-card p-8 hover:shadow-md transition-all duration-300"
              role="listitem"
            >
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.sub}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
