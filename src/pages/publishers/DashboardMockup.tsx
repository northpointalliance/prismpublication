import { Sparkles } from "lucide-react";

export const DashboardMockup = () => (
  <div className="overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-2xl">
    {/* Title bar */}
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
      <div className="h-3 w-3 rounded-full bg-red-400/80" />
      <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
      <div className="h-3 w-3 rounded-full bg-green-400/80" />
      <span className="ml-3 text-xs text-white/40 font-mono">Publisher Dashboard — prism.so/app/publisher</span>
    </div>
    {/* Content */}
    <div className="p-5 space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Impressions (7d)", value: "12,847", change: "+18%" },
          { label: "Fill Rate", value: "94.2%", change: "+3.1%" },
          { label: "Revenue Today", value: "$48.20", change: "+$12" },
          { label: "Active Bots", value: "3", change: "" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-white/40">{stat.label}</p>
            <p className="mt-1 text-lg font-bold text-white">{stat.value}</p>
            {stat.change && <p className="text-[10px] text-emerald-400">{stat.change}</p>}
          </div>
        ))}
      </div>
      {/* Chart mock */}
      <div className="rounded-lg bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/50">Revenue — Last 14 days</span>
          <span className="text-xs text-emerald-400 font-medium">+22% vs prior</span>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {[35, 42, 38, 55, 48, 62, 58, 70, 65, 78, 72, 85, 80, 92].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary/30"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      {/* Bot list */}
      <div className="space-y-2">
        {[
          { name: "Support Copilot", env: "production", health: "healthy", req: "8,241" },
          { name: "Sales Assistant", env: "production", health: "healthy", req: "3,102" },
          { name: "Onboarding Guide", env: "staging", health: "warning", req: "1,504" },
        ].map((bot) => (
          <div key={bot.name} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className={`h-2 w-2 rounded-full ${bot.health === "healthy" ? "bg-emerald-400" : "bg-yellow-400"}`} />
              <span className="text-xs font-medium text-white">{bot.name}</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/50">{bot.env}</span>
            </div>
            <span className="text-xs text-white/40">{bot.req} req/7d</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
