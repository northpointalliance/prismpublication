import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Play, Pause, RotateCcw, Sparkles, MessageSquare, MousePointerClick, Radio } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { apiRequest } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const createMessageId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// Pre-scripted conversation with naturally integrated ads
const conversationScript = [
  { role: "user", content: "I need sneakers I can run in but still look good when I go out. Any ideas?" },
  {
    role: "bot",
    content:
      "For that combo, go with a clean low-profile pair and neutral colors. They work for short runs and still look sharp with jeans after.",
  },
  { role: "ad", position: "inline", shouldShow: true },
  { role: "user", content: "Perfect. I usually run 3-5k, then meet friends for sushi or dinner." },
  {
    role: "bot",
    content:
      "That’s easy then. Keep the outfit minimal and let the shoes stay clean. You’ll be comfortable for the run and still look put together at a restaurant.",
  },
  { role: "ad", position: "inline", shouldShow: true },
  { role: "user", content: "Also, I’m visiting someone after dinner and want to bring flowers. Any quick gift idea?" },
  {
    role: "bot",
    content:
      "A compact bouquet is always a safe win. Go for seasonal flowers in simple wrapping so it feels thoughtful without overdoing it.",
  },
  { role: "ad", position: "inline", shouldShow: true },
  { role: "user", content: "Nice. Can you give me one final plan for the whole evening?" },
  {
    role: "bot",
    content:
      "Sure: clean sneakers, quick 5k, sushi spot with friends, then swing by a flower shop for a fresh bouquet. Stylish and effortless.",
  },
  { role: "ad", position: "inline", shouldShow: true },
  { role: "user", content: "That sounds perfect. Thanks!" },
  { role: "bot", content: "Anytime. If you want, I can also suggest a full outfit color palette." },
] as const;

interface Message {
  id: string;
  role: "user" | "bot" | "ad";
  content?: string;
  displayedContent?: string;
  ad?: DemoAd;
  isTyping?: boolean;
}

interface DemoAd {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  imageUrl?: string;
  advertiser: string;
  tags?: string[];
}

const installSnippet = `npm install @prism/sdk`;

const usageSnippet = `import { PrismAds } from "@prism/sdk";

const botGrid = new PrismAds({
  apiKey: process.env.PRISM_API_KEY!,
  botId: "my-chatbot",
  adFormat: "card",
  baseUrl: process.env.PRISM_API_BASE_URL || "https://your-api.example.com/api",
});`;

const howItWorksSteps = [
  {
    title: "Integrate in minutes",
    description:
      "Drop the Prism SDK into any chatbot — GPT wrappers, custom AI agents, customer support bots, e-commerce assistants. Three lines of code is all it takes to start serving contextual ads.",
  },
  {
    title: "Context-aware ad matching",
    description:
      "Prism reads conversation context in real-time and serves ads that feel like natural recommendations, not interruptions.",
  },
  {
    title: "Revenue flows automatically",
    description:
      "Chatbot publishers earn per impression and per click. Advertisers pay for genuine engagement with transparent reporting.",
  },
  {
    title: "Measure everything",
    description:
      "Track conversions, click-through rates, and revenue across your chatbot fleet with real-time dashboard metrics.",
  },
] as const;

const nikeDemoAd: DemoAd = {
  id: "fallback-demo-ad-nike-airforce1",
  title: "Nike Air Force 1",
  description: "Clean everyday style with iconic Nike design. Easy to pair with streetwear and casual fits.",
  ctaText: "Shop Nike Air Force 1",
  clickUrl: "/contact?source=demo&ad=nike-air-force-1",
  imageUrl: "/demo-ads/nikeairforce1.jpg",
  advertiser: "Nike",
  tags: ["running", "style", "sneakers"],
};

const sushiDemoAd: DemoAd = {
  id: "fallback-demo-ad-tokyo-sushi",
  title: "Tokyo Sushi Restaurant",
  description: "Fresh sushi, warm atmosphere, and late-night dining. Great spot after a city run.",
  ctaText: "Reserve a Table",
  clickUrl: "/contact?source=demo&ad=tokyo-sushi",
  imageUrl: "/demo-ads/sushinewyork.avif",
  advertiser: "Tokyo Sushi",
  tags: ["food", "restaurant", "eat-out"],
};

const flowerDemoAd: DemoAd = {
  id: "fallback-demo-ad-flower-shop",
  title: "Florista Flower Shop",
  description: "Handmade bouquets and same-day pickup. Great last-minute gift before your visit.",
  ctaText: "Order Flowers",
  clickUrl: "/contact?source=demo&ad=florista",
  imageUrl: "/demo-ads/florista.webp",
  advertiser: "Florista",
  tags: ["flowers", "gift", "shop"],
};

const sponsoredSequence: DemoAd[] = [nikeDemoAd, sushiDemoAd, flowerDemoAd, nikeDemoAd];

const isFallbackAd = (adId: string) => adId.startsWith("fallback-demo-ad-");

const Demo = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const playbackRef = useRef(false);
  const fallbackNoticeShownRef = useRef(false);
  const fallbackAdIndexRef = useRef(0);
  const demoUserId = "demo-local-user";

  const getFallbackDemoAd = () => {
    const ad = sponsoredSequence[fallbackAdIndexRef.current % sponsoredSequence.length];
    fallbackAdIndexRef.current += 1;
    return ad;
  };

  const requestDemoAd = async (_topic: string, _userId: string) => {
    if (!fallbackNoticeShownRef.current) {
      fallbackNoticeShownRef.current = true;
      setNotice("Sponsored sequence active: Nike + Tokyo Sushi + Florista creatives.");
    }
    return getFallbackDemoAd();
  };

  const trackDemoEvent = async (eventType: "impression" | "click", adId: string, userId: string) => {
    if (isFallbackAd(adId)) return;

    try {
      await apiRequest<{ success: boolean }>(`/demo/track/${eventType}`, {
        method: "POST",
        body: JSON.stringify({ adId, userId, topic: "running" }),
      });
    } catch (_err) {
      // Tracking must not break demo playback or click behavior.
    }
  };

  useEffect(() => {
    return () => {
      playbackRef.current = false;
    };
  }, []);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container || !shouldAutoScrollRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleMessageListScroll = () => {
    const container = messageListRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 72;
  };

  const playConversation = async () => {
    if (playbackRef.current) {
      playbackRef.current = false;
      setIsPlaying(false);
      return;
    }

    const startIndex = currentIndex >= conversationScript.length ? 0 : currentIndex;
    if (startIndex === 0) {
      shouldAutoScrollRef.current = true;
      fallbackNoticeShownRef.current = false;
      fallbackAdIndexRef.current = 0;
      setNotice(null);
      setMessages([]);
      setCurrentIndex(0);
    }

    playbackRef.current = true;
    setIsPlaying(true);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const getTypingDelay = (character: string, role: "user" | "bot") => {
      const baseDelay = role === "bot" ? 28 : 38;
      if (character === " " || character === "\n") return baseDelay - 10;
      if (/[.,!?]/.test(character)) return baseDelay + 110;
      return baseDelay;
    };

    const streamTypedMessage = async (role: "user" | "bot", content: string) => {
      const messageId = createMessageId();
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          role,
          content,
          displayedContent: "",
          isTyping: true,
        },
      ]);

      await sleep(role === "bot" ? 320 : 220);

      let streamed = "";
      for (const char of content) {
        if (!playbackRef.current) {
          setMessages((prev) => prev.filter((message) => message.id !== messageId));
          return false;
        }
        streamed += char;
        setMessages((prev) =>
          prev.map((existing) => (existing.id === messageId ? { ...existing, displayedContent: streamed } : existing)),
        );
        await sleep(getTypingDelay(char, role));
      }

      setMessages((prev) =>
        prev.map((existing) => (existing.id === messageId ? { ...existing, isTyping: false, displayedContent: content } : existing)),
      );
      await sleep(role === "bot" ? 700 : 520);
      return playbackRef.current;
    };

    try {
      for (let i = startIndex; i < conversationScript.length; i += 1) {
        if (!playbackRef.current) break;

        const item = conversationScript[i];
        if (item.role === "ad") {
          const ad = await requestDemoAd("lifestyle", demoUserId);
          if (ad && playbackRef.current) {
            void trackDemoEvent("impression", ad.id, demoUserId);
            const adMessage: Message = {
              id: createMessageId(),
              role: "ad",
              ad,
            };
            setMessages((prev) => [...prev, adMessage]);
          }
          await sleep(1100);
        } else {
          const finished = await streamTypedMessage(item.role, item.content);
          if (!finished) break;
        }

        setCurrentIndex(i + 1);
      }
    } finally {
      playbackRef.current = false;
      setIsPlaying(false);
    }
  };

  const resetDemo = () => {
    playbackRef.current = false;
    setIsPlaying(false);
    shouldAutoScrollRef.current = true;
    fallbackNoticeShownRef.current = false;
    fallbackAdIndexRef.current = 0;
    setNotice(null);
    setMessages([]);
    setCurrentIndex(0);
  };

  const handleAdClick = (ad: DemoAd) => {
    void trackDemoEvent("click", ad.id, demoUserId);
    if (/^https?:\/\//i.test(ad.clickUrl)) {
      window.open(ad.clickUrl, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(ad.clickUrl);
  };

  const messageCount = messages.filter((message) => message.role !== "ad").length;
  const adCount = messages.filter((message) => message.role === "ad").length;

  return (
    <SiteShell mainClassName="bg-background">
      <div className="relative overflow-hidden bg-background px-4 pb-12 pt-24 md:pb-16 md:pt-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-[22%] h-[24rem] w-[24rem] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -top-16 right-[14%] h-[20rem] w-[20rem] rounded-full bg-cyan-300/20 blur-[115px]" />
          <div className="absolute bottom-[-9rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-300/15 blur-[135px]" />
          <div className="absolute inset-0 grid-pattern opacity-20" />
        </div>

        <div className="relative mx-auto max-w-6xl space-y-6">
          <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="order-1 overflow-hidden border-border bg-card shadow-xl lg:order-2 lg:sticky lg:top-24">
              <CardHeader className="border-b border-border bg-muted/60 py-4">
                <CardTitle className="flex items-center gap-3 text-base text-foreground md:text-lg">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Bot className="h-5 w-5" />
                  </span>
                  AI Assistant Stream
                  <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Live Simulation
                  </span>
                </CardTitle>
              </CardHeader>

              <div
                ref={messageListRef}
                onScroll={handleMessageListScroll}
                className="h-[440px] space-y-4 overflow-y-auto overscroll-contain bg-muted/30 p-4 md:h-[520px] md:p-6"
              >
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center">
                    <Bot className="mx-auto mb-3 h-12 w-12 text-primary/70" />
                    <p className="text-sm text-muted-foreground">
                      Press <span className="font-semibold text-foreground">Play Demo</span> to stream a scripted conversation with in-thread sponsored placements.
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                    {message.role === "ad" && message.ad ? (
                      <div className="rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-600/80 to-emerald-600/80 p-3 shadow-lg">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-50">Sponsored</span>
                          <span className="text-[11px] font-medium text-cyan-50/90">{message.ad.advertiser}</span>
                        </div>
                        {message.ad.imageUrl && (
                          <img
                            src={message.ad.imageUrl}
                            alt={`${message.ad.advertiser} campaign`}
                            className="mb-2 h-28 w-full rounded-xl object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <h4 className="text-sm font-semibold text-white">{message.ad.title}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-cyan-50/95">{message.ad.description}</p>
                        <button
                          type="button"
                          onClick={() => handleAdClick(message.ad)}
                          className="btn-sweep mt-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50"
                        >
                          {message.ad.ctaText} →
                        </button>
                      </div>
                    ) : (
                      <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground shadow-primary/20"
                              : "border border-border bg-background text-foreground"
                          }`}
                        >
                          {message.isTyping && !(message.displayedContent && message.displayedContent.length > 0) ? (
                            <div className="flex gap-1 py-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                            </div>
                          ) : (
                            <p>{message.displayedContent ?? message.content}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-border bg-card p-3">
                <p className="mb-2 text-[11px] text-muted-foreground">Playback only: direct input is disabled in this demo.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message... (demo playback mode)"
                    className="flex-1 cursor-not-allowed rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    disabled
                  />
                  <button
                    type="button"
                    className="cursor-not-allowed rounded-full bg-cyan-500/70 px-4 py-2 text-sm font-semibold text-white opacity-60"
                    disabled
                  >
                    Send
                  </button>
                </div>
              </div>
            </Card>

            <div className="order-2 space-y-4 lg:order-1">
              <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-lg md:p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Revenue Demo
                </div>
                <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground md:text-[2.1rem]">
                  Turn chatbot conversations into ad revenue without breaking UX.
                </h1>
                <p className="mt-3 text-sm text-muted-foreground md:text-base">
                  Prism inserts context-aware sponsored cards directly inside assistant replies. Start playback to see a realistic monetized thread.
                </p>

                <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
                  <div className="rounded-xl border border-border bg-background px-3 py-2">Natural placements that feel like recommendations, not pop-ups.</div>
                  <div className="rounded-xl border border-border bg-background px-3 py-2">Works with existing chat stacks through a lightweight SDK integration.</div>
                  <div className="rounded-xl border border-border bg-background px-3 py-2">Track impressions, clicks, and performance in one reporting flow.</div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={playConversation}
                    className={`btn-sweep inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ${
                      isPlaying
                        ? "bg-amber-500 hover:bg-amber-400 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.7)]"
                        : "bg-emerald-500 hover:bg-emerald-400 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.75)]"
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        {messages.length > 0 && currentIndex < conversationScript.length ? "Continue" : "Play Demo"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetDemo}
                    className="btn-sweep inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-center text-[11px] text-muted-foreground">
                  Simulation mode: scripted playback. Input is disabled to keep output consistent.
                </div>
                {notice && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">{notice}</div>}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Messages</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{messageCount}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Radio className="h-4 w-4" />
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Ads Shown</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{adCount}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sky-600">
                    <MousePointerClick className="h-4 w-4" />
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">CTR Demo</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">4.2%*</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">* Illustrative benchmark only.</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">SDK Quickstart</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Integrate in minutes</h2>
                <p className="mt-2 text-sm text-muted-foreground">Use the snippets below to connect Prism to your assistant and start injecting ad cards.</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">1. Install</p>
                <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted p-3 text-xs text-foreground">
                  <code>{installSnippet}</code>
                </pre>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">2. Basic Usage</p>
                <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted p-3 text-xs text-foreground">
                  <code>{usageSnippet}</code>
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">How It Works</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">From chat context to monetization</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {howItWorksSteps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
};

export default Demo;
