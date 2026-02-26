import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Play, Pause, RotateCcw, Sparkles, MessageSquare, MousePointerClick, Radio } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { apiRequest } from "@/lib/api";

const createMessageId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// Pre-scripted conversation with naturally integrated ads
const conversationScript = [
  { role: 'user', content: "Hi! I'm looking to learn about AI and machine learning. Where should I start?" },
  { role: 'bot', content: "Great question! Machine learning is a fascinating field. I'd recommend starting with Python fundamentals since most ML libraries use it. There are amazing courses available now - some even offer certificates that can boost your career!" },
  { role: 'ad', position: 'inline', shouldShow: true }, // Ad naturally fits here
  { role: 'user', content: "That sounds helpful! I've been hearing a lot about AI tools for productivity. Are they actually useful?" },
  { role: 'bot', content: "Absolutely! AI productivity tools have come a long way. For example, AI coding assistants can actually write significant portions of your code, saving hours each week. Many developers now use them as pair programmers. It's like having a tireless teammate helping you out!" },
  { role: 'ad', position: 'inline', shouldShow: true },
  { role: 'user', content: "Interesting! My company is considering implementing AI for customer service. What would you recommend?" },
  { role: 'bot', content: "Smart move! AI chatbots for customer service can handle up to 80% of common queries automatically. The key is finding a solution that feels natural to customers. Look for platforms that offer easy customization so the bot matches your brand voice. Many businesses see ROI within the first few months!" },
  { role: 'ad', position: 'inline', shouldShow: true },
  { role: 'user', content: "What about AI for content creation? Is it worth using?" },
  { role: 'bot', content: "Definitely! AI content tools can help with everything from drafting emails to creating social media posts. The best approach is using AI as a starting point - it gives you a solid draft that you can then refine and add your personal touch to. It's about augmentation, not replacement. Many marketing teams now use AI to scale their content output significantly." },
  { role: 'ad', position: 'inline', shouldShow: true },
  { role: 'user', content: "This has been really helpful. One more question - how do I stay updated with AI developments?" },
  { role: 'bot', content: "Great question! The AI field moves fast. I'd recommend following key researchers on social media, joining AI communities online, and trying out new tools as they release. Many platforms offer free tiers so you can experiment. The best learning comes from hands-on experience - build small projects, break things, and iterate!" },
  { role: 'ad', position: 'inline', shouldShow: true },
  { role: 'user', content: "Thanks so much! You've been incredibly helpful." },
  { role: 'bot', content: "You're welcome! Feel free to come back anytime you have more questions. Happy learning with AI! 🤖" },
];

interface Message {
  id: string;
  role: 'user' | 'bot' | 'ad';
  content?: string;
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

const Demo = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const playbackRef = useRef(false);
  const demoUserId = "demo-local-user";

  const requestDemoAd = async (topic: string, userId: string) => {
    const response = await apiRequest<{ success: boolean; data?: DemoAd[]; error?: string }>(
      "/demo/ads",
      {
        method: "POST",
        body: JSON.stringify({
          position: "inline",
          format: "card",
          context: {
            topic,
            userId,
          },
        }),
      },
    );
    return response.data?.[0] || null;
  };

  const trackDemoEvent = async (eventType: "impression" | "click", adId: string, userId: string) => {
    await apiRequest<{ success: boolean }>(`/demo/track/${eventType}`, {
      method: "POST",
      body: JSON.stringify({
        adId,
        userId,
        topic: "ai",
      }),
    });
  };

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
      setMessages([]);
      setCurrentIndex(0);
    }

    playbackRef.current = true;
    setIsPlaying(true);
    for (let i = startIndex; i < conversationScript.length; i++) {
      if (!playbackRef.current) break;
      
      const item = conversationScript[i];
      
      if (item.role === 'ad') {
        const ad = await requestDemoAd("ai", demoUserId);
        if (ad && playbackRef.current) {
          void trackDemoEvent("impression", ad.id, demoUserId);
          const adMessage: Message = {
            id: createMessageId(),
            role: 'ad',
            ad: ad,
          };
          setMessages(prev => [...prev, adMessage]);
        }
      } else {
        // Show user or bot message
        const message: Message = {
          id: createMessageId(),
          role: item.role as 'user' | 'bot',
          content: item.content,
          isTyping: true,
        };
        setMessages(prev => [...prev, message]);
        
        // Typing effect
        await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
        if (!playbackRef.current) break;
        
        // Update message to show content
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, isTyping: false } : m
        ));
        
        // Pause between messages
        await new Promise(r => setTimeout(r, 600));
      }
      
      setCurrentIndex(i + 1);
    }
    
    playbackRef.current = false;
    setIsPlaying(false);
  };

  const resetDemo = () => {
    playbackRef.current = false;
    setIsPlaying(false);
    shouldAutoScrollRef.current = true;
    setMessages([]);
    setCurrentIndex(0);
  };

  const handleAdClick = (ad: DemoAd) => {
    void trackDemoEvent("click", ad.id, demoUserId);
    window.open(ad.clickUrl, "_blank", "noopener,noreferrer");
  };

  const messageCount = messages.filter(m => m.role !== "ad").length;
  const adCount = messages.filter(m => m.role === 'ad').length;

  return (
    <SiteShell mainClassName="bg-slate-950">
      <div className="relative overflow-hidden bg-slate-950 px-4 pb-12 pt-36 md:pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[130px]" />
          <div className="absolute bottom-[-8rem] left-[12%] h-72 w-72 rounded-full bg-emerald-500/15 blur-[120px]" />
          <div className="absolute right-[8%] top-[28%] h-72 w-72 rounded-full bg-sky-500/15 blur-[140px]" />
          <div className="absolute inset-0 grid-pattern opacity-60" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/20 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                <Sparkles className="h-4 w-4" />
                Live Product Demo
              </div>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-5xl">
                BotGrid Conversation Ad Engine
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Watch ad cards appear naturally inside an AI conversation without interrupting flow.
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={playConversation}
                className={`btn-sweep inline-flex min-w-40 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ${
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
                className="btn-sweep inline-flex min-w-40 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-slate-100 transition-all hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-cyan-200/30 bg-cyan-300/10 px-4 py-3 text-center text-xs text-cyan-100">
              Simulation mode: scripted playback using server-managed demo ad endpoints. Message input is intentionally disabled.
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                <div className="flex items-center gap-2 text-cyan-100">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide text-cyan-200/90">Messages</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{messageCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Radio className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide text-emerald-200/90">Ads Shown</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{adCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                <div className="flex items-center gap-2 text-sky-100">
                  <MousePointerClick className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide text-sky-200/90">CTR (Illustrative)</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-white">4.2%*</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-300 text-center">* Demo benchmark for visualization only, not a production guarantee.</p>
          </div>

          <Card className="mt-6 overflow-hidden border-white/20 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
          <CardHeader className="border-b border-white/10 bg-gradient-to-r from-slate-900/90 via-cyan-950/85 to-emerald-950/85 py-4">
            <CardTitle className="flex items-center gap-3 text-base text-white md:text-lg">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Bot className="h-5 w-5" />
              </span>
              AI Assistant Stream
              <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Live Simulation
              </span>
            </CardTitle>
          </CardHeader>

          <div
            ref={messageListRef}
            onScroll={handleMessageListScroll}
            className="h-[520px] space-y-4 overflow-y-auto overscroll-contain bg-slate-900/70 p-4 md:p-6"
          >
            {messages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/25 bg-white/[0.05] px-6 py-12 text-center">
                <Bot className="mx-auto mb-3 h-12 w-12 text-cyan-200/70" />
                <p className="text-sm text-slate-200">
                  Press <span className="font-semibold text-white">Play Demo</span> to stream a scripted conversation with in-thread sponsored placements.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "ad" && message.ad ? (
                  <div className="rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-600/80 to-emerald-600/80 p-3 shadow-lg">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-50">
                        Sponsored
                      </span>
                      <span className="text-[11px] font-medium text-cyan-50/90">{message.ad.advertiser}</span>
                    </div>
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
                          ? "bg-cyan-500 text-cyan-50 shadow-cyan-700/30"
                          : "border border-white/15 bg-white/[0.1] text-slate-100"
                      }`}
                    >
                      {message.isTyping ? (
                        <div className="flex gap-1 py-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 bg-slate-900/85 p-3">
            <p className="mb-2 text-[11px] text-slate-300">Playback only: direct input is disabled in this demo.</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message... (demo playback mode)"
                className="flex-1 cursor-not-allowed rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-300/70"
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

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="animate-fade-up rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-100">
                  1
                </div>
                <h3 className="text-sm font-semibold text-white">Integrate SDK</h3>
                <p className="mt-1 text-xs text-slate-200">Add BotGrid to your chatbot in minutes.</p>
              </div>
              <div className="animate-fade-up-delay-1 rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-100">
                  2
                </div>
                <h3 className="text-sm font-semibold text-white">Blend In-Thread Ads</h3>
                <p className="mt-1 text-xs text-slate-200">Sponsored cards appear at natural moments in chat.</p>
              </div>
              <div className="animate-fade-up-delay-2 rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sky-100">
                  3
                </div>
                <h3 className="text-sm font-semibold text-white">Track Performance</h3>
                <p className="mt-1 text-xs text-slate-200">Measure impressions, clicks, and engagement lift.</p>
              </div>
            </div>
        </div>
      </div>
    </SiteShell>
  );
};

export default Demo;
