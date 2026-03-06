import { Sparkles } from "lucide-react";

export const ConversationExample = () => (
  <div className="overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-2xl">
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
      <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
      <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
      <span className="ml-3 text-[10px] text-white/40 font-mono">AI Chat — Live conversation</span>
    </div>
    <div className="p-4 space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary/20 px-3 py-2">
          <p className="text-[11px] text-white/90">I need a faster way to deploy my projects</p>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-primary/70" />
        </div>
        <div className="space-y-1.5 max-w-[80%]">
          <div className="rounded-2xl rounded-bl-md bg-white/5 px-3 py-2">
            <p className="text-[11px] text-white/80 leading-relaxed">For fast deployments, here are a few options...</p>
          </div>
          {/* Native ad - text format */}
          <div className="rounded-lg border border-primary/20 bg-white/[0.03] px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[8px] font-medium text-primary">Sponsored</span>
            </div>
            <p className="mt-1 text-[11px] text-white/70">
              <span className="font-medium text-white/90">Ship faster with Vercel</span> — Zero-config deployments for Next.js, React, and more.{" "}
              <span className="text-primary font-medium">Deploy now &rarr;</span>
            </p>
          </div>
          <div className="rounded-2xl rounded-bl-md bg-white/5 px-3 py-2">
            <p className="text-[11px] text-white/80 leading-relaxed">You could also check out Railway or Render for more flexibility.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
