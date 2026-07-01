import { useState, useEffect, useRef } from "react";
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
      "That's easy then. Keep the outfit minimal and let the shoes stay clean. You'll be comfortable for the run and still look put together at a restaurant.",
  },
  { role: "ad", position: "inline", shouldShow: true },
  { role: "user", content: "Also, I'm visiting someone after dinner and want to bring flowers. Any quick gift idea?" },
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

const prism = new PrismAds({
  apiKey: process.env.PRISM_API_KEY!,
  botId: "my-chatbot",
  adFormat: "card",
});

const ad = await prism.displayAd({ topic: "lifestyle", userId: "u-123" });
if (ad) await prism.trackImpression(ad.id, "u-123");`;

const howItWorksSteps = [
  {
    title: "Integrate in minutes",
    description:
      "Drop the SDK into any chatbot — GPT wrappers, agents, support bots. Three lines of code is all it takes.",
  },
  {
    title: "Context-aware matching",
    description:
      "Prism reads the conversation in real-time and serves ads that feel like natural recommendations.",
  },
  {
    title: "Revenue flows automatically",
    description:
      "Publishers earn per impression and per click. Advertisers pay for genuine engagement.",
  },
  {
    title: "Measure everything",
    description:
      "Track conversions, CTR, and revenue across your chatbot fleet with real-time dashboard metrics.",
  },
] as const;

const sneakerDemoAd: DemoAd = {
  id: "fallback-demo-ad-stride-classic",
  title: "Stride Classic Runner",
  description: "Clean everyday style meets lightweight performance. Easy to pair with streetwear and casual fits.",
  ctaText: "Shop Stride Classic",
  clickUrl: "/contact?source=demo&ad=stride-classic",
  imageUrl: "/demo-ads/sneakers.jpg",
  advertiser: "Stride",
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

const sponsoredSequence: DemoAd[] = [sneakerDemoAd, sushiDemoAd, flowerDemoAd, sneakerDemoAd];
const isFallbackAd = (adId: string) => adId.startsWith("fallback-demo-ad-");

const Demo = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const playbackRef = useRef(false);
  const fallbackAdIndexRef = useRef(0);
  const demoUserId = "demo-local-user";

  const getFallbackDemoAd = () => {
    const ad = sponsoredSequence[fallbackAdIndexRef.current % sponsoredSequence.length];
    fallbackAdIndexRef.current += 1;
    return ad;
  };

  const requestDemoAd = async (topic: string, _userId: string): Promise<DemoAd> => {
    try {
      const res = await fetch("https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api/demo/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "card", context: { topic } }),
      });
      if (res.ok) {
        const data = await res.json();
        const ad = data?.data?.[0];
        if (ad?.title) return ad as DemoAd;
      }
    } catch (_err) {
      // Fall through to fallback
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
      // Tracking must not break demo playback
    }
  };

  useEffect(() => {
    return () => { playbackRef.current = false; };
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
      fallbackAdIndexRef.current = 0;
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
      setMessages((prev) => [...prev, { id: messageId, role, content, displayedContent: "", isTyping: true }]);
      await sleep(role === "bot" ? 320 : 220);

      let streamed = "";
      for (const char of content) {
        if (!playbackRef.current) {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          return false;
        }
        streamed += char;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, displayedContent: streamed } : m)),
        );
        await sleep(getTypingDelay(char, role));
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isTyping: false, displayedContent: content } : m)),
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
            setMessages((prev) => [...prev, { id: createMessageId(), role: "ad", ad }]);
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
    fallbackAdIndexRef.current = 0;
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

  const messageCount = messages.filter((m) => m.role !== "ad").length;
  const adCount = messages.filter((m) => m.role === "ad").length;

  return (
    <SiteShell mainClassName="bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-background px-4 pb-16 pt-24 md:pb-20 md:pt-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[140px]" />
          <div className="absolute -top-16 right-1/4 h-80 w-80 rounded-full bg-cyan-300/15 blur-[130px]" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]">

            {/* ── Left: scenario + controls ─────────────────────────────── */}
            <div className="order-2 space-y-5 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Live Demo — Real Conversation Scenario
              </div>

              <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
                See how your chatbot turns conversations into ad revenue.
              </h1>

              {/* Scenario brief */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">The scenario</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  Alex is planning his Saturday evening — he needs sneakers for a 5k run, a dinner spot to meet
                  friends, and a gift for a visit afterward. His AI assistant helps him plan it all.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Watch how Prism inserts contextually matched sponsored cards inline — no banners, no popups,
                  just natural placements at the right moment.
                </p>
              </div>

              {/* Play / Reset */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={playConversation}
                    className={`btn-sweep inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-all ${
                      isPlaying
                        ? "bg-amber-500 hover:bg-amber-400 shadow-[0_8px_24px_-8px_rgba(245,158,11,0.6)]"
                        : "bg-primary hover:bg-primary/90 shadow-[0_8px_24px_-8px_rgba(61,187,251,0.65)]"
                    }`}
                  >
                    {isPlaying ? (
                      <><Pause className="h-4 w-4" /> Pause</>
                    ) : (
                      <><Play className="h-4 w-4" />{messages.length > 0 && currentIndex < conversationScript.length ? "Continue" : "Start Demo"}</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetDemo}
                    title="Reset demo"
                    className="btn-sweep inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-3 text-foreground transition hover:bg-muted"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Scripted playback — input disabled to keep the scenario consistent.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-3 text-center shadow-sm">
                  <MessageSquare className="mx-auto h-4 w-4 text-primary" />
                  <p className="mt-1 text-2xl font-bold">{messageCount}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 text-center shadow-sm">
                  <Radio className="mx-auto h-4 w-4 text-emerald-600" />
                  <p className="mt-1 text-2xl font-bold">{adCount}</p>
                  <p className="text-xs text-muted-foreground">Ads Served</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 text-center shadow-sm">
                  <MousePointerClick className="mx-auto h-4 w-4 text-sky-600" />
                  <p className="mt-1 text-2xl font-bold">4.2%</p>
                  <p className="text-xs text-muted-foreground">CTR est.*</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">* Illustrative benchmark only.</p>
            </div>

            {/* ── Right: chat window ────────────────────────────────────── */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-24 space-y-2">
              <div className="flex items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                LIVE DEMO · Ads are real affiliate links operated by Prism Publication
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">AI Lifestyle Assistant</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Scenario: Planning a city evening
                  </p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>

              {/* Message list */}
              <div
                ref={messageListRef}
                onScroll={handleMessageListScroll}
                className="h-[420px] space-y-3 overflow-y-auto overscroll-contain bg-muted/20 p-4 md:h-[500px]"
              >
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Bot className="h-7 w-7 text-primary/60" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Ready when you are.</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Press <span className="font-medium text-foreground">Start Demo</span> to watch Alex's
                        conversation with sponsored placements appearing inline.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
                    {message.role === "ad" && message.ad ? (
                      /* ── Sponsored ad card ── */
                      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-3.5 shadow-lg">
                        <div className="mb-2.5 flex items-center gap-2">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white/70">
                            Sponsored
                          </span>
                          <span className="text-xs font-medium text-white/60">{message.ad.advertiser}</span>
                        </div>
                        {message.ad.imageUrl && (
                          <img
                            src={message.ad.imageUrl}
                            alt={message.ad.advertiser}
                            className="mb-3 h-28 w-full rounded-xl object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <h4 className="text-sm font-semibold text-white">{message.ad.title}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-white/75">{message.ad.description}</p>
                        <button
                          type="button"
                          onClick={() => handleAdClick(message.ad!)}
                          className="mt-3 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                          {message.ad.ctaText} →
                        </button>
                      </div>
                    ) : (
                      /* ── Chat bubble ── */
                      <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-background text-foreground"
                          }`}
                        >
                          {message.isTyping && !message.displayedContent?.length ? (
                            <div className="flex gap-1 py-0.5">
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

              {/* Disabled input footer */}
              <div className="border-t border-border bg-card p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Direct input disabled in demo playback..."
                    className="flex-1 cursor-not-allowed rounded-full border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
                    disabled
                  />
                  <button
                    type="button"
                    className="cursor-not-allowed rounded-full bg-primary/30 px-4 py-2 text-sm font-semibold text-white opacity-60"
                    disabled
                  >
                    Send
                  </button>
                </div>
              </div>
              </div>
              <p className="text-center text-xs text-muted-foreground px-2 pt-0.5">
                Ads shown in this demo are live affiliate links managed by Prism Publication. We may earn a commission on clicks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <div className="border-t border-border/60 bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-6xl space-y-14">
          <div>
            <div className="mb-8 text-center">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">How It Works</p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">From chat context to revenue in 4 steps</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorksSteps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SDK Quickstart ─────────────────────────────────────────── */}
          <div>
            <div className="mb-8 text-center">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">SDK Quickstart</p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">Integrate in two steps</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    1
                  </span>
                  <p className="font-semibold text-foreground">Install the package</p>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
                  <code>{installSnippet}</code>
                </pre>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    2
                  </span>
                  <p className="font-semibold text-foreground">Initialize and serve</p>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
                  <code>{usageSnippet}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
};

export default Demo;
