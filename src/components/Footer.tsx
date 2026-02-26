import { Button } from "@/components/ui/button";
import { ArrowRight, Bot } from "lucide-react";
import { Link } from "react-router-dom";

const exploreLinks = [
  { label: "Publishers", to: "/publishers" },
  { label: "Advertisers", to: "/advertisers" },
  { label: "How It Works", to: "/sdk" },
  { label: "Live Demo", to: "/demo" },
];

const companyLinks = [
  { label: "Company", to: "/company" },
  { label: "Product", to: "/product" },
  { label: "Use Cases", to: "/use-cases" },
  { label: "Documentation", to: "/docs" },
  { label: "SDK", to: "/sdk" },
  { label: "Blog", to: "/blog" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 pb-10 pt-14" role="contentinfo">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-35" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="container relative mx-auto px-6">
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="grid gap-10 px-6 py-10 md:px-10 lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr]">
            <section>
              <Link to="/" className="inline-flex items-center gap-3" aria-label="BotGrid home">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm" aria-hidden="true">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">BotGrid</span>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Conversational ad infrastructure for publishers and advertisers who care about relevance, trust, and measurable outcomes.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">AI Native Ads</span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">Publisher First</span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">Intent Targeting</span>
              </div>
            </section>

            <nav aria-label="Explore footer links">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Explore</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {exploreLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Company footer links">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Company</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Start Here</p>
              <h2 className="mt-3 text-xl font-bold tracking-tight">See BotGrid in action</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Run the interactive conversation demo and review the integration flow in minutes.
              </p>
              <Link to="/demo" className="mt-5 inline-flex">
                <Button variant="hero" size="sm">
                  Open Demo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </section>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/70 px-6 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
            <p>© {year} BotGrid. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link to="/company" className="transition-colors hover:text-foreground">About</Link>
              <Link to="/docs" className="transition-colors hover:text-foreground">Docs</Link>
              <Link to="/blog" className="transition-colors hover:text-foreground">Blog</Link>
              <Link to="/demo" className="transition-colors hover:text-foreground">Demo</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
