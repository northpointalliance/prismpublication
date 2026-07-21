import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Copy, KeyRound, Trash2 } from "lucide-react";

export interface SdkKey {
  id: string;
  label: string;
  prefix: string;
  last4: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface BotListItem {
  id: string;
  botId: string;
  name: string;
  environment: "development" | "staging" | "production";
  health: "healthy" | "warning" | "degraded";
  isActive: boolean;
  sdkKeys: SdkKey[];
  placementPolicy?: {
    signals?: { useLlm?: boolean };
    signalsUseLlm?: boolean;
    [key: string]: unknown;
  } | null;
}

export interface BotMetrics {
  requests7d: number;
  fillRate7d: number;
  revenueTodayCents: number;
  sdkErrors: number;
}

interface Props {
  bots: BotListItem[];
  loading: boolean;
  metricsByBotId: Map<string, BotMetrics>;
  latestToken: { botId: string; token: string } | null;
  saving: boolean;
  formatCurrency: (cents: number) => string;
  formatDateTime: (value: string | null) => string;
  onCopyToken: (token: string, label: string) => void;
  onCreateKey: (bot: BotListItem) => void;
  onDeleteBot: (bot: BotListItem) => void;
  onToggleLlmScoring: (bot: BotListItem, useLlm: boolean) => void;
}

const environmentTone: Record<BotListItem["environment"], string> = {
  development: "bg-sky-100 text-sky-800 border-sky-200",
  staging: "bg-amber-100 text-amber-800 border-amber-200",
  production: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const healthColor: Record<BotListItem["health"], string> = {
  healthy: "text-emerald-600",
  warning: "text-amber-600",
  degraded: "text-red-600",
};

const BotRegistry = ({
  bots, loading, metricsByBotId, latestToken, saving,
  formatCurrency, formatDateTime, onCopyToken, onCreateKey, onDeleteBot, onToggleLlmScoring,
}: Props) => (
  <Card className="border-border/80 bg-card/95">
    <CardHeader>
      <CardTitle className="text-xl font-bold">Bot Registry</CardTitle>
      <p className="text-sm text-muted-foreground">Insights and SDK key management per bot.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {loading && <p className="text-sm text-muted-foreground">Loading bots…</p>}
      {!loading && bots.map((bot) => {
        const m = metricsByBotId.get(bot.botId);
        const activeKeys = bot.sdkKeys.filter((k) => !k.revokedAt);
        const currentKey = activeKeys[0] || null;
        const hasNewToken = latestToken?.botId === bot.botId;
        const useLlm = Boolean(bot.placementPolicy?.signals?.useLlm ?? bot.placementPolicy?.signalsUseLlm);
        return (
          <div key={bot.id} className="rounded-2xl border border-border bg-background/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-foreground">{bot.name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ID: <span className="font-mono">{bot.botId}</span></span>
                  <button type="button" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" onClick={() => onCopyToken(bot.botId, `Bot ID ${bot.botId}`)}>
                    <Copy className="h-3 w-3" />Copy
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${environmentTone[bot.environment]}`}>{bot.environment}</span>
                <Badge variant={bot.health === "healthy" ? "default" : "secondary"} className={healthColor[bot.health]}>{bot.health}</Badge>
                <Badge variant={bot.isActive ? "default" : "secondary"}>{bot.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
              {[
                { label: "Requests (7d)", value: Intl.NumberFormat("en-US").format(m?.requests7d || 0) },
                { label: "Fill Rate", value: `${(m?.fillRate7d || 0).toFixed(1)}%` },
                { label: "Revenue Today", value: formatCurrency(m?.revenueTodayCents || 0) },
                { label: "SDK Errors", value: String(m?.sdkErrors || 0) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border/70 bg-card px-2 py-2">
                  <p className="uppercase tracking-[0.07em]">{label}</p>
                  <p className="mt-1 font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
              {[
                { label: "Active Keys", value: String(activeKeys.length) },
                { label: "Environment", value: bot.environment },
                { label: "Health", value: bot.health },
                { label: "Status", value: bot.isActive ? "Active" : "Inactive" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border/50 bg-muted/30 px-2 py-1.5">
                  <p className="uppercase tracking-[0.07em]">{label}</p>
                  <p className="mt-0.5 font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-foreground">Use LLM scoring (Signals)</p>
                <p className="text-[11px] text-muted-foreground">Heuristics always run. LLM upgrade when enabled.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={useLlm}
                  disabled={saving}
                  onChange={(e) => onToggleLlmScoring(bot, e.target.checked)}
                />
                {useLlm ? "On" : "Off"}
              </label>
            </div>

            <div className="mt-3 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">SDK Key</p>
                <div className="flex items-center gap-2">
                  {hasNewToken && (
                    <Button size="sm" variant="secondary" onClick={() => onCopyToken(latestToken!.token, `key for ${bot.name}`)}>
                      <Copy className="mr-1 h-3.5 w-3.5" />Copy New Key
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" disabled={saving} onClick={() => onCreateKey(bot)}>
                    <KeyRound className="mr-1 h-3.5 w-3.5" />Rotate Key
                  </Button>
                </div>
              </div>
              <div className="px-3 py-2.5">
                {currentKey ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{currentKey.label}</p>
                      <p className="font-mono text-muted-foreground">{currentKey.prefix}••••{currentKey.last4}</p>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>Created: {formatDateTime(currentKey.createdAt)}</span>
                      <Badge>Active</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No active SDK key. Rotate to generate one.</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="secondary" disabled={saving} onClick={() => onDeleteBot(bot)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />Delete Bot
              </Button>
            </div>
          </div>
        );
      })}
      {!loading && !bots.length && (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <Bot className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-foreground">No bots yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Register your first bot using the form →</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default BotRegistry;
