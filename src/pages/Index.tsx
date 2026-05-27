import HeroSection from "@/components/HeroSection";
import ScrollVideoSection from "@/components/ScrollVideoSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import AudienceSection from "@/components/AudienceSection";
import StatsSection from "@/components/StatsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import SiteShell from "@/components/SiteShell";

const Index = () => {
  return (
    <SiteShell>
      <HeroSection />
      <ScrollVideoSection />
      <HowItWorksSection />
      <AudienceSection />
      <StatsSection />
      <FAQSection />
      <CTASection />
    </SiteShell>
  );
};

export default Index;
