import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const exploreLinks = [
  { label: "Signals", to: "/signals" },
  { label: "Publishers", to: "/publishers" },
  { label: "Advertisers", to: "/advertisers" },
  { label: "How It Works + Demo", to: "/demo" },
  { label: "Use Cases", to: "/use-cases" },
];

const companyLinks = [
  { label: "Company", to: "/company" },
  { label: "Product", to: "/product" },
  { label: "Documentation", to: "/docs" },
  { label: "Blog", to: "/blog" },
  { label: "Ad Policy", to: "/ad-policy" },
  { label: "Contact", to: "/contact" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border/70 bg-slate-50 pb-10 pt-14" role="contentinfo">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-35" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="container relative mx-auto px-6">
        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-[4.5rem] font-black uppercase leading-none tracking-[0.22em] text-slate-950/[0.035] md:text-[8rem] lg:text-[11rem]"
            aria-hidden="true"
          >
            PRISM
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="relative grid gap-10 py-10 lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr]">
            <section>
              <Link to="/" className="inline-flex items-center gap-0" aria-label="Prism home">
                <img src="/prismlogo.png" alt="" className="h-10 w-10 object-contain" aria-hidden="true" />
                <span className="text-xl font-bold tracking-tight">Prism</span>
              </Link>

              <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
                Conversation signals for LLM apps, plus optional partner offers when the moment is right.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">AI Native Ads</span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">Publisher First</span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">Intent Targeting</span>
              </div>
            </section>

            <nav aria-label="Explore footer links">
              <p className="font-[Poppins] text-xs font-bold uppercase tracking-[0.16em] text-black">Explore</p>
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
              <p className="font-[Poppins] text-xs font-bold uppercase tracking-[0.16em] text-black">Company</p>
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

            <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-white/40 p-5">
              <p className="font-[Poppins] text-xs font-bold uppercase tracking-[0.16em] text-black">Start Here</p>
              <h2 className="mt-3 text-xl font-bold tracking-tight">See Prism in action</h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                Watch the scripted demo or chat with a live bot to see context-aware ad matching in real time.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Link to="/demo" className="inline-flex">
                  <Button variant="primary" size="sm">
                    Interactive Demo
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <a href="https://prism-publication-demo.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex">
                  <Button variant="secondary" size="sm">
                    Try Live Bots
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </a>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/70 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>© {year} Prism Publication. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link to="/signals" className="transition-colors hover:text-foreground">Signals</Link>
              <Link to="/company" className="transition-colors hover:text-foreground">About</Link>
              <Link to="/docs" className="transition-colors hover:text-foreground">Docs</Link>
              <Link to="/blog" className="transition-colors hover:text-foreground">Blog</Link>
              <Link to="/demo" className="transition-colors hover:text-foreground">Demo</Link>
              <Link to="/ad-policy" className="transition-colors hover:text-foreground">Ad Policy</Link>
              <Link to="/contact" className="transition-colors hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
