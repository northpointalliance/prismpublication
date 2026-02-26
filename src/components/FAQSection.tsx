import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Will ads hurt my chatbot user experience?",
    a: "Not if they are paced correctly. BotGrid is built for contextual placements with frequency controls so teams can keep the conversation quality high while testing monetization safely.",
  },
  {
    q: "How long does integration take?",
    a: "Most teams can get the SDK running quickly, then iterate on placement and pacing rules over time. You can start in a test mode before enabling broader traffic.",
  },
  {
    q: "Which chatbot stacks are supported?",
    a: "BotGrid can be used with GPT-based assistants, support bots, custom agents, and API-driven chat systems. The implementation model is SDK-first with flexible serving logic.",
  },
  {
    q: "How do advertisers target campaigns?",
    a: "Campaigns are matched to conversation context and topic intent instead of generic banner inventory. Teams can configure placement and category controls based on campaign goals.",
  },
  {
    q: "Can publishers control what gets shown?",
    a: "Yes. Publishers can apply frequency limits, topic restrictions, and guardrails so sponsored content aligns with brand standards and user expectations.",
  },
  {
    q: "What about privacy and compliance requirements?",
    a: "BotGrid is designed around contextual ad matching and operational controls so teams can implement privacy-first workflows appropriate to their regulatory environment.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="relative py-32" aria-labelledby="faq-heading">
      <div className="container mx-auto px-6 max-w-3xl">
        <header className="text-center mb-16">
          <span className="text-xs font-mono text-primary uppercase tracking-widest">FAQ</span>
          <h2 id="faq-heading" className="text-4xl md:text-5xl font-bold mt-4 tracking-tight">
            Frequently asked <span className="text-gradient-primary">questions</span>
          </h2>
          <p className="text-muted-foreground mt-4">
            Objection-first answers for publishers and advertisers evaluating conversational ads.
          </p>
        </header>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-xl glow-border bg-card px-6 border-none"
            >
              <AccordionTrigger className="text-left text-sm md:text-base font-medium hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
