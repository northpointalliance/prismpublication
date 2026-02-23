import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="relative py-32">
      <div className="container mx-auto px-6">
        <div className="relative rounded-3xl glow-border overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-glow-secondary/10" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />

          <div className="relative p-12 md:p-20 text-center">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              The chatbot economy
              <br />
              <span className="text-gradient-primary">needs its ad layer.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Join the network that's defining how AI conversations get monetized. 
              Early adopters are already seeing 4x returns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-base px-10 py-6">
                Join the Network
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base px-10 py-6">
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
