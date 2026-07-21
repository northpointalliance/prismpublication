import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export interface SignalsUsageData {
  days: number;
  total: number;
  last7d: number;
  llmCalls: number;
  byAction: Array<{ action: string; count: number }>;
}

interface Props {
  usage: SignalsUsageData | null;
  loading?: boolean;
}

const SignalsUsageCard = ({ usage, loading }: Props) => (
  <Card className="border-border/80 bg-card/95">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-base font-bold">
        <Activity className="h-4 w-4 text-primary" />
        Signals usage
      </CardTitle>
      <p className="text-xs text-muted-foreground">Score calls metered for your bots (no paywall in MVP).</p>
    </CardHeader>
    <CardContent className="space-y-3">
      {loading && !usage && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && !usage && <p className="text-sm text-muted-foreground">No usage data yet.</p>}
      {usage && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last 7d</p>
              <p className="mt-1 text-xl font-bold">{usage.last7d}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{usage.days}d total</p>
              <p className="mt-1 text-xl font-bold">{usage.total}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">LLM</p>
              <p className="mt-1 text-xl font-bold">{usage.llmCalls}</p>
            </div>
          </div>
          {usage.byAction.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Actions</p>
              {usage.byAction.slice(0, 5).map((row) => (
                <div key={row.action} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-foreground">{row.action}</span>
                  <span className="text-muted-foreground">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default SignalsUsageCard;
