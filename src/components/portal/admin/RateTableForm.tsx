import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

interface RatesDraft {
  text: string;
  card: string;
  banner: string;
}

interface Props {
  cpmTextCents: number;
  cpmCardCents: number;
  cpmBannerCents: number;
  platformFeePct: number;
  draft: RatesDraft;
  saving: boolean;
  onDraftChange: (patch: Partial<RatesDraft>) => void;
  onSave: () => void;
}

const FORMAT_LABELS: Record<string, string> = {
  text: "Text",
  card: "Card",
  banner: "Banner",
};

function cpmUsd(cents: number) {
  return (cents / 100).toFixed(2);
}

function perImpressionCents(cpmCents: number) {
  return Math.max(1, Math.round(cpmCents / 1000));
}

function publisherCpmCents(cpmCents: number, feePct: number) {
  return Math.floor(cpmCents * (1 - feePct / 100));
}

const RateTableForm = ({
  cpmTextCents,
  cpmCardCents,
  cpmBannerCents,
  platformFeePct,
  draft,
  saving,
  onDraftChange,
  onSave,
}: Props) => {
  const rows = [
    { key: "text" as const,   label: "Text",   live: cpmTextCents,   draftVal: draft.text },
    { key: "card" as const,   label: "Card",   live: cpmCardCents,   draftVal: draft.card },
    { key: "banner" as const, label: "Banner", live: cpmBannerCents, draftVal: draft.banner },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Base Rate Table (CPM)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Explanation */}
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">CPM</strong> = Cost Per Mille (per 1,000 impressions). This is what
            advertisers commit when they set a daily budget. Every time a publisher bot serves an impression for a
            budget-managed ad, the platform auto-charges this rate and credits the publisher.
          </p>
          <p>
            <strong className="text-foreground">Platform fee</strong> ({platformFeePct}%) is deducted from the
            publisher's earnings at payout time. Advertisers always pay the full CPM rate.
          </p>
        </div>

        {/* Inputs */}
        <div className="grid gap-3 sm:grid-cols-3">
          {rows.map(({ key, label, draftVal }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`cpm-${key}`}>{label} ads CPM ($)</Label>
              <Input
                id={`cpm-${key}`}
                type="number"
                min="1"
                step="0.01"
                placeholder="10.00"
                value={draftVal}
                onChange={(e) => onDraftChange({ [key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <Button variant="primary" onClick={onSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving…" : "Save Rates"}
        </Button>

        {/* Live breakdown table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Format</th>
                <th className="pb-2 font-medium">Advertiser pays (CPM)</th>
                <th className="pb-2 font-medium">Per impression</th>
                <th className="pb-2 font-medium">Publisher receives (CPM)</th>
                <th className="pb-2 font-medium">Platform keeps (CPM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ key, label, live }) => {
                const pubCpm = publisherCpmCents(live, platformFeePct);
                const platCpm = live - pubCpm;
                const perImp = perImpressionCents(live);
                return (
                  <tr key={key} className="py-2">
                    <td className="py-2 font-semibold">{FORMAT_LABELS[label] ?? label}</td>
                    <td className="py-2">${cpmUsd(live)}</td>
                    <td className="py-2 text-muted-foreground">{perImp}¢</td>
                    <td className="py-2 text-emerald-600">${cpmUsd(pubCpm)}</td>
                    <td className="py-2 text-primary">${cpmUsd(platCpm)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Minimum per-impression charge is 1¢ regardless of CPM setting. Rates apply only to ads with a lifetime budget
          set. Ads without a budget can still run via manual publisher SDK revenue events.
        </p>
      </CardContent>
    </Card>
  );
};

export default RateTableForm;
