import { useMemo, useState } from "react";
import { Bot, Sparkles, Send } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { apiRequest } from "@/lib/api";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  content: string;
}

const starterPrompts = [
  "Help me plan my week",
  "Turn this idea into a clear next step",
  "Draft a quick follow-up",
];

const Skylar = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi, I’m Skylar. I help turn messy ideas into a focused plan and a concrete next step.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (value?: string) => {
    const nextValue = (value ?? draft).trim();
    if (!nextValue || isLoading) return;

    setMessages((prev) => [...prev, { id: prev.length + 1, role: "user", content: nextValue }]);
    setDraft("");
    setIsLoading(true);

    try {
      const response = await apiRequest<{ reply: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: nextValue }),
      });
      setMessages((prev) => [...prev, { id: prev.length + 1, role: 'assistant', content: response.reply }]);
    } catch (_error) {
      setMessages((prev) => [...prev, { id: prev.length + 1, role: 'assistant', content: 'I hit a snag, but I can still help if you try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = useMemo(() => starterPrompts, []);

  return (
    <SiteShell mainClassName="bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-20 md:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Skylar demo</p>
              <h1 className="text-3xl font-bold text-foreground">A calm conversational assistant for planning and follow-through.</h1>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Conversation preview
              </div>
              <div className="mt-4 space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"}`}>
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">Thinking…</div>
                  </div>
                )}
              </div>

              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSubmit();
                }}
              >
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask Skylar to help you plan, draft, or prioritize"
                  className="flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm outline-none ring-0"
                />
                <button type="submit" className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-background p-4">
                <h2 className="text-lg font-semibold text-foreground">Try one of these</h2>
                <div className="mt-3 space-y-2">
                  {quickActions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void handleSubmit(prompt)}
                      className="block w-full rounded-full border border-border bg-card px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                Skylar is a lightweight demo experience for showing how a friendly AI assistant can guide a user from a rough idea to a practical plan.
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
};

export default Skylar;
