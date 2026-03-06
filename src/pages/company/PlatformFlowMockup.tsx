import {
  BarChart3,
  Bot,
  Megaphone,
  Zap,
} from "lucide-react";

export const PlatformFlowMockup = () => (
  <div className="relative">
    {/* Glow behind */}
    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 blur-2xl" aria-hidden="true" />
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        <span className="ml-3 text-[10px] text-white/40 font-mono">Prism Platform — How it works</span>
      </div>
      <div className="p-6">
        {/* Three columns: Advertiser -> Prism -> Publisher */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
          {/* Advertiser */}
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Megaphone className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-xs font-semibold text-white">Advertiser</p>
            <p className="mt-1 text-[10px] text-white/40">Creates campaigns, sets budget & topics</p>
            <div className="mt-3 space-y-1.5">
              <div className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/50">Notion AI Campaign</div>
              <div className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/50">Vercel Deploy Ads</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-px w-8 bg-gradient-to-r from-amber-400/50 to-primary/50" />
            <p className="text-[8px] text-white/30">ads</p>
          </div>

          {/* Prism */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-white">Prism</p>
            <p className="mt-1 text-[10px] text-white/40">Matches ads to conversations by topic</p>
            <div className="mt-3 grid grid-cols-3 gap-1">
              <div className="rounded-md bg-primary/10 px-1.5 py-1 text-[8px] text-primary">Match</div>
              <div className="rounded-md bg-primary/10 px-1.5 py-1 text-[8px] text-primary">Serve</div>
              <div className="rounded-md bg-primary/10 px-1.5 py-1 text-[8px] text-primary">Track</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-px w-8 bg-gradient-to-r from-primary/50 to-emerald-400/50" />
            <p className="text-[8px] text-white/30">ads</p>
          </div>

          {/* Publisher */}
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <Bot className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-white">Publisher Bot</p>
            <p className="mt-1 text-[10px] text-white/40">Serves native ads in conversations</p>
            <div className="mt-3 space-y-1.5">
              <div className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/50">Support Copilot</div>
              <div className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/50">Sales Assistant</div>
            </div>
          </div>
        </div>

        {/* Revenue flow */}
        <div className="mt-4 rounded-lg bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-white/50">Revenue flow</span>
            </div>
            <span className="text-[10px] text-emerald-400">Real-time tracking</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-amber-400/60 via-primary/60 to-emerald-400/60" />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-white/40">
            <span>Advertiser spends</span>
            <span>Prism takes platform fee</span>
            <span>Publisher earns</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
