import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Reveal from "@/components/Reveal";

const CTASection = () => {
  return (
    <section className="relative py-32" aria-labelledby="cta-heading">
      <div className="container mx-auto px-6">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(238,244,255,0.96), rgba(249,251,255,0.92)), url('/login-assets/pattern.svg')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-primary/10" aria-hidden="true" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" aria-hidden="true" />

          <div className="relative p-12 md:p-20 text-center">
            <h2 id="cta-heading" className="text-4xl md:text-6xl font-medium tracking-tight mb-6">
              Validate your chatbot
              <br />
              <span className="text-gradient-primary">ad strategy in minutes.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Start with the interactive demo, then choose your path for publisher monetization or advertiser campaigns.
              Keep implementation simple and user experience controlled.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/demo">
                <Button variant="primary" size="lg" className="text-base px-10 py-6">
                  Run Interactive Demo
                  <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/publishers">
                <Button variant="secondary" size="lg" className="px-10 py-6 text-base">
                  Start as Publisher
                </Button>
              </Link>
            </div>
            <div className="mt-5">
              <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Read strategy articles in the blog
              </Link>
            </div>
          </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTASection;
