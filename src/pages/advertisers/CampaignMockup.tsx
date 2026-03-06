export const CampaignMockup = () => (
  <div className="overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-2xl">
    {/* Title bar */}
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
      <div className="h-3 w-3 rounded-full bg-red-400/80" />
      <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
      <div className="h-3 w-3 rounded-full bg-green-400/80" />
      <span className="ml-3 text-xs text-white/40 font-mono">Campaign Builder — prism.so/app/advertiser</span>
    </div>
    <div className="p-5 space-y-4">
      {/* Campaign header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40">New Campaign</p>
          <p className="mt-0.5 text-sm font-semibold text-white">Notion AI — Productivity Suite</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-400">Active</span>
          <span className="rounded bg-white/10 px-2.5 py-1 text-[10px] text-white/50">Card format</span>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[10px] text-white/40 mb-1">Ad Title</p>
          <p className="text-xs text-white">Try Notion AI — Your Second Brain</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[10px] text-white/40 mb-1">CTA Button</p>
          <p className="text-xs text-white">Start Free Trial</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[10px] text-white/40 mb-1">Daily Budget</p>
          <p className="text-xs text-white">$50.00 / day</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[10px] text-white/40 mb-1">Lifetime Cap</p>
          <p className="text-xs text-white">$1,000.00</p>
        </div>
      </div>

      {/* Topics */}
      <div className="rounded-lg bg-white/5 p-3">
        <p className="text-[10px] text-white/40 mb-2">Target Topics</p>
        <div className="flex flex-wrap gap-1.5">
          {["productivity", "ai", "notes", "writing", "organization", "tools"].map((tag) => (
            <span key={tag} className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Performance preview */}
      <div className="rounded-lg bg-white/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-white/40">Performance Preview (7d)</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-lg font-bold text-white">4,231</p>
            <p className="text-[10px] text-white/40">Impressions</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">3.8%</p>
            <p className="text-[10px] text-white/40">CTR</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-400">$84.62</p>
            <p className="text-[10px] text-white/40">Spent</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
