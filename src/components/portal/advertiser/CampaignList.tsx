import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Pencil } from "lucide-react";

interface CampaignSummary {
  id: string;
  title: string;
  status: "Live" | "Review";
  format: string;
  weight: number;
  impressions7d: number;
  clicks7d: number;
  ctr7d: number;
  spend7dCents: number;
}

interface CampaignRecord {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  topics: string[];
  format: string;
  weight: number;
  isActive: boolean;
}

interface CampaignBudget {
  dailyBudgetCents: number;
  lifetimeBudgetCents: number;
  durationDays: number;
}

interface Props {
  loading: boolean;
  campaigns: CampaignSummary[];
  campaignRecords: Record<string, CampaignRecord>;
  campaignBudgets: Record<string, CampaignBudget>;
  saving: boolean;
  formatCurrency: (cents: number) => string;
  onCreateAd: () => void;
  onToggle: (id: string, nextLive: boolean) => void;
  onEdit: (id: string) => void;
}

const CampaignList = ({
  loading, campaigns, campaignRecords, campaignBudgets,
  saving, formatCurrency, onCreateAd, onToggle, onEdit,
}: Props) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between gap-3">
      <div>
        <CardTitle className="text-xl font-bold">Campaigns</CardTitle>
        <p className="text-sm text-muted-foreground">Performance and settings per ad.</p>
      </div>
      <Button variant="primary" onClick={onCreateAd}>+ Create Ad</Button>
    </CardHeader>
    <CardContent className="space-y-3">
      {loading && <p className="text-sm text-muted-foreground">Loading campaigns…</p>}
      {!loading && campaigns.map((c) => {
        const rec = campaignRecords[c.id];
        const bud = campaignBudgets[c.id];
        const conv = Math.round(c.clicks7d * 0.12);
        return (
          <div key={c.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{c.title}</p>
                <Badge variant={c.status === "Live" ? "default" : "secondary"}>{c.status}</Badge>
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{c.format}</span>
              </div>
              {rec && rec.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rec.topics.map((t) => (
                    <span key={`${c.id}-${t}`} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3 md:grid-cols-6">
              {[
                { label: "Impr. (7d)", value: Intl.NumberFormat("en-US").format(c.impressions7d) },
                { label: "Clicks (7d)", value: c.clicks7d },
                { label: "CTR (7d)", value: `${c.ctr7d.toFixed(2)}%` },
                { label: "Spend (7d)", value: formatCurrency(c.spend7dCents) },
                { label: "Conv. (est.)", value: conv },
                { label: "Weight", value: c.weight },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border/70 bg-card px-2 py-2">
                  <p className="uppercase tracking-[0.07em]">{label}</p>
                  <p className="mt-1 font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {bud && (
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Daily: <strong className="text-foreground">{formatCurrency(bud.dailyBudgetCents)}</strong></span>
                <span>Total: <strong className="text-foreground">{formatCurrency(bud.lifetimeBudgetCents)}</strong></span>
                {bud.durationDays && <span>Duration: <strong className="text-foreground">{bud.durationDays}d</strong></span>}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant={c.status === "Live" ? "secondary" : "primary"} disabled={saving} onClick={() => onToggle(c.id, c.status !== "Live")}>
                {c.status === "Live" ? "Pause" : "Go Live"}
              </Button>
              <Button size="sm" variant="secondary" disabled={saving || !rec} onClick={() => onEdit(c.id)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />Edit
              </Button>
              {rec && (
                <a href={rec.clickUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" />View URL
                </a>
              )}
            </div>
          </div>
        );
      })}
      {!loading && !campaigns.length && (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-sm font-semibold text-foreground">No campaigns yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Press "Create Ad" to launch your first campaign.</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default CampaignList;
