import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCircle, ClipboardCheck, ExternalLink, X } from "lucide-react";
import AdPreview, { AdFormat } from "@/components/AdPreview";

interface Ad {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  imageUrl?: string | null;
  advertiser: string;
  topics: string[];
  format: string;
  weight: number;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  pendingAds: Ad[];
  activeAds: Ad[];
  reviewLoading: boolean;
  actingOnId: string | null;
  formatDate: (value: string) => string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ReviewQueueTab = ({
  pendingAds, activeAds, reviewLoading, actingOnId,
  formatDate, onApprove, onReject,
}: Props) => (
  <div className="space-y-6">
    <div>
      <div className="mb-3 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-amber-500" />
        <h2 className="font-semibold">
          Pending approval
          <span className="ml-2 text-muted-foreground font-normal text-sm">({pendingAds.length})</span>
        </h2>
      </div>

      {reviewLoading && <p className="text-sm text-muted-foreground">Loading review queue…</p>}

      {!reviewLoading && pendingAds.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <CheckCircle className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
          <p className="font-semibold text-foreground">All caught up</p>
          <p className="mt-1 text-sm text-muted-foreground">No ads waiting for review.</p>
        </div>
      )}

      <div className="space-y-3">
        {pendingAds.map((ad) => (
          <Card key={ad.id} className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{ad.title}</p>
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{ad.format}</span>
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">weight {ad.weight}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{ad.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>CTA: <strong className="text-foreground">{ad.ctaText}</strong></span>
                    <a href={ad.clickUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />URL
                    </a>
                    {ad.topics.length > 0 && <span>Topics: {ad.topics.join(", ")}</span>}
                    <span>Submitted: {formatDate(ad.createdAt)}</span>
                  </div>
                  <div className="mt-3 max-w-xs">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Preview</p>
                    <AdPreview ad={ad} format={ad.format as AdFormat} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="primary" size="sm" disabled={actingOnId !== null} onClick={() => onApprove(ad.id)} className="gap-1.5">
                    <Check className="h-3.5 w-3.5" />{actingOnId === ad.id ? "…" : "Approve"}
                  </Button>
                  <Button variant="secondary" size="sm" disabled={actingOnId !== null} onClick={() => onReject(ad.id)} className="gap-1.5">
                    <X className="h-3.5 w-3.5" />Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {activeAds.length > 0 && (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <h2 className="font-semibold">
            Live ads
            <span className="ml-2 text-muted-foreground font-normal text-sm">({activeAds.length})</span>
          </h2>
        </div>
        <div className="space-y-2">
          {activeAds.map((ad) => (
            <div key={ad.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{ad.title}</p>
                <p className="text-xs text-muted-foreground">{ad.description.slice(0, 80)}{ad.description.length > 80 ? "…" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Live</Badge>
                <Button size="sm" variant="secondary" disabled={actingOnId !== null} onClick={() => onReject(ad.id)}>
                  Take down
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default ReviewQueueTab;
