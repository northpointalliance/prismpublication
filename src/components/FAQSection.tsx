import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Reveal from "@/components/Reveal";

const faqs = [
  {
    q: "What is Prism, and how does conversational advertising work?",
    a: "Prism is an ad marketplace built for AI chatbot conversations. Publishers integrate the Prism SDK into their chatbot or AI app; when a user's message matches an advertiser's target topics, Prism returns a native ad — a text recommendation, image card, or banner — that fits the conversation moment. Advertisers pay on a CPM basis ($10–$20 per 1,000 impressions depending on format). Publishers earn a revenue share from every matched impression. No user profile data is required — matching is contextual, based on what the conversation is about.",
  },
  {
    q: "How do I add ads to my AI chatbot or conversational app?",
    a: "Install the Prism SDK (JavaScript/TypeScript or REST API), register your bot in the publisher portal, and call the ad endpoint with the current conversation topic. A typical integration takes under an hour. Prism returns a structured ad object you render inside the chat response. You set frequency caps, topic restrictions, and format preferences per bot — and can run in demo mode before going live.",
  },
  {
    q: "How much can publishers earn from chatbot advertising?",
    a: "Publisher revenue is based on CPM. Advertisers pay $10 CPM for text ads, $15 for banner ads, and $20 for card ads. Publishers receive a share of that rate for each matched impression their bot generates. There is no minimum traffic requirement to register, and payout details are visible in the publisher portal.",
  },
  {
    q: "Which chatbot frameworks and stacks does Prism support?",
    a: "Prism works with any stack that can make an HTTP request. It has been tested with OpenAI Assistants, LangChain agents, Rasa bots, and custom Node.js and Python chat servers. The SDK is JavaScript/TypeScript-native with React helpers included. Any other language or framework can use the plain REST API.",
  },
  {
    q: "How long does it take to integrate the Prism SDK?",
    a: "Most integrations take under an hour. The core flow is three steps: install the npm package, call getAd({ botId, context }) in your response handler, and render the returned ad object. Prism provides React components for card and banner formats. You can run in demo mode to verify the integration before connecting a live advertiser campaign.",
  },
  {
    q: "Will ads hurt my chatbot's user experience?",
    a: "Only if over-served. Prism is built for low-frequency, contextual placements — ads are matched to conversation topic and only shown when relevant. Publishers set daily frequency caps and topic restrictions per bot, controlling how often ads appear and in which conversations. Most publishers run one ad per session during a clearly relevant moment.",
  },
  {
    q: "How does Prism target ads inside AI conversations?",
    a: "Advertisers assign topic keywords to each campaign (for example, 'productivity', 'developer tools', 'travel'). When a publisher bot requests an ad and passes the current conversation topic, Prism scores all active campaigns against that topic and returns the best match. There is no cookie-based targeting or user profiling — matching is purely contextual. Advertisers set a campaign weight (1–100) to control how often their ads serve relative to other matched campaigns.",
  },
  {
    q: "What ad formats does Prism support and what do they cost?",
    a: "Prism supports three formats. Text ($10 CPM): a short sponsored message with a CTA link — minimal footprint in the conversation flow. Card ($20 CPM): an image, headline, description, and CTA button — the highest-engagement format, best for product showcases. Banner ($15 CPM): a full-width image with optional overlay text, suited for brand awareness. All formats are returned as structured JSON that publishers render using their own UI or Prism's React components.",
  },
  {
    q: "Is there a minimum budget to advertise on Prism?",
    a: "The minimum wallet top-up is $1 USD. There is no minimum campaign budget — you can run a campaign at any daily spend level. Campaigns are funded by pre-loading a wallet via PayPal. The lifetime campaign budget is reserved at launch and returned to the wallet if the campaign is deleted before it fully spends.",
  },
  {
    q: "How does Prism protect advertisers from invalid traffic?",
    a: "Prism deduplicates impression and click events server-side using request fingerprinting and timestamp gating. Publisher bots are vetted during registration and must pass review before receiving live API keys. Unusually high event rates trigger automatic flagging for manual review. If invalid traffic is confirmed, the affected spend is credited back to the advertiser's wallet.",
  },
  {
    q: "Does Prism work with private or enterprise AI assistants?",
    a: "Yes. Publisher bots can be registered across development, staging, and production environments, with SDK keys scoped per bot. Private or internal chatbots integrate the same way as public ones — the only requirement is that the bot can make outbound HTTPS requests to the Prism API. For enterprise arrangements including volume pricing, private publisher deals, signed DPAs, or SLA commitments, contact the Prism team directly.",
  },
  {
    q: "Is Prism like Google AdSense for AI chatbots?",
    a: "That is a fair analogy. Like AdSense, Prism lets publishers monetize their audience through third-party ads and lets advertisers buy placement across a network of properties. The key difference is the medium: Prism is built for conversational interfaces, not web pages. Ads are matched to live conversation context rather than page keywords, and they are returned as structured objects rendered inside chat responses rather than display banners injected into a webpage.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="relative py-32" aria-labelledby="faq-heading">
      <div className="container mx-auto px-6 max-w-3xl">
        <Reveal>
          <header className="text-center mb-16">
            <span className="text-xs font-mono text-primary uppercase tracking-widest">FAQ</span>
            <h2 id="faq-heading" className="text-4xl md:text-5xl font-medium mt-4 tracking-tight">
              Frequently asked <span className="text-gradient-primary">questions</span>
            </h2>
            <p className="text-muted-foreground mt-4">
              Common questions from chatbot publishers and advertisers about how Prism works, what integration involves, and what it costs.
            </p>
          </header>
        </Reveal>

        <Reveal delay={120}>
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
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
};

export default FAQSection;
