import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="relative py-32" aria-labelledby="cta-heading">
      <div className="container mx-auto px-6">
        <div className="relative rounded-3xl glow-border overflow-hidden bg-card">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-glow-secondary/5" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" aria-hidden="true" />

          <div className="relative p-12 md:p-20 text-center">
            <h2 id="cta-heading" className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
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
                <Button variant="hero" size="lg" className="text-base px-10 py-6">
                  Run Interactive Demo
                  <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/publishers">
                <Button variant="hero-outline" size="lg" className="text-base px-10 py-6">
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
      </div>
    </section>
  );
};

export default CTASection;
