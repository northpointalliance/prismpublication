import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is BotGrid and how does chatbot advertising work?",
    a: "BotGrid is the first ad network built specifically for AI chatbot conversations. Unlike traditional display advertising that uses banners and pop-ups, BotGrid serves context-aware ads inside chatbot conversations as natural recommendations. When a user asks a chatbot about a topic, BotGrid's AI analyzes the conversation in real-time and delivers a relevant ad that feels like a helpful suggestion rather than an interruption. This results in 4.7x higher click-through rates compared to traditional display ads.",
  },
  {
    q: "What types of chatbots can integrate with BotGrid?",
    a: "BotGrid works with virtually any chatbot platform or framework. This includes GPT-based wrappers and assistants, LangChain agents, Rasa bots, Dialogflow bots, custom Python or Node.js chatbots, customer support bots, e-commerce shopping assistants, healthcare chatbots, educational AI tutors, and more. Integration takes just three lines of code via our lightweight SDK, and we support REST API integration for custom implementations.",
  },
  {
    q: "How much can I earn as a chatbot publisher on BotGrid?",
    a: "Earnings depend on your chatbot's conversation volume, audience demographics, and the ad categories served. On average, BotGrid publishers earn 3.2x more than they would with traditional display advertising. Our network has paid out over $42 million to publishers in the last 12 months. You earn on both impressions (CPM) and clicks (CPC), with monthly payouts and full revenue transparency through your publisher dashboard.",
  },
  {
    q: "How does BotGrid ensure ads don't harm the chatbot user experience?",
    a: "User experience is core to BotGrid's approach. Our AI engine analyzes conversation context, user sentiment, and conversation flow before deciding whether to serve an ad. Ads are only shown when they're genuinely relevant to the conversation topic. We maintain a 0.3% user complaint rate — far below industry standards — because our ads feel like helpful recommendations rather than disruptive interruptions. Publishers can also set frequency caps and content filters.",
  },
  {
    q: "How is BotGrid different from Google AdSense or other ad networks?",
    a: "Google AdSense and traditional ad networks were built for websites and web pages — they serve visual display ads, banners, and video ads on static content. BotGrid is purpose-built for conversational AI interfaces where traditional display ads don't work. Instead of showing banners, BotGrid inserts contextual text-based recommendations directly into chatbot responses. This conversational ad format delivers much higher engagement because users are actively seeking information, not passively browsing.",
  },
  {
    q: "What targeting options are available for advertisers on BotGrid?",
    a: "BotGrid offers intent-level targeting that no other ad network can match. Because ads are served within active conversations, we can target based on real-time user intent — what the user is actually asking about right now. Targeting options include conversation topic, user intent category, chatbot vertical (e-commerce, support, education, health), geographic location, language, device type, and time of day. This intent-based targeting consistently delivers 4.7x higher CTR than traditional display advertising.",
  },
  {
    q: "How do I get started with BotGrid as a publisher or advertiser?",
    a: "Getting started takes under 10 minutes. For publishers: sign up, add three lines of SDK code to your chatbot, configure your ad preferences and content filters, and start earning. For advertisers: create an account, set your budget and targeting preferences, upload your ad creatives (text-based recommendations), and launch your campaign. Both publishers and advertisers get access to real-time dashboards for tracking performance, revenue, and conversions.",
  },
  {
    q: "Does BotGrid comply with privacy regulations like GDPR and CCPA?",
    a: "Yes. BotGrid is fully compliant with GDPR, CCPA, and other major privacy regulations. We do not store or process personal conversation data for ad targeting. Our context-aware matching works on anonymized, real-time conversation signals without building user profiles. All data processing happens in real-time and is immediately discarded after ad selection. We also provide publishers with tools to manage consent and data processing preferences for their users.",
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
            Everything you need to know about chatbot advertising, monetization, and the BotGrid ad network.
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
