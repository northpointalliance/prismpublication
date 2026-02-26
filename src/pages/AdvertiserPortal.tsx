import { useEffect, useMemo, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { apiRequest } from "@/lib/api";
import { getPortalHeaders } from "@/lib/portal-api";

interface AdvertiserDashboardResponse {
  summary: {
    activeCampaigns: number;
    pendingReview: number;
    spendTodayCents: number;
    ctr7d: number;
  };
  campaigns: Array<{
    id: string;
    title: string;
    status: "Live" | "Review";
    format: "text" | "card" | "banner";
    weight: number;
    impressions7d: number;
    clicks7d: number;
    ctr7d: number;
    spend7dCents: number;
  }>;
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const AdvertiserPortal = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AdvertiserDashboardResponse | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    getPortalHeaders(user.email)
      .then((headers) => apiRequest<AdvertiserDashboardResponse>("/advertiser/dashboard", undefined, headers))
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load advertiser data";
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const summaryCards = useMemo(() => {
    if (!data) {
      return [
        { label: "Active Campaigns", value: "--" },
        { label: "Pending Review", value: "--" },
        { label: "Spend (Today)", value: "--" },
        { label: "CTR (7d)", value: "--" },
      ];
    }
    return [
      { label: "Active Campaigns", value: String(data.summary.activeCampaigns) },
      { label: "Pending Review", value: String(data.summary.pendingReview) },
      { label: "Spend (Today)", value: formatCurrency(data.summary.spendTodayCents) },
      { label: "CTR (7d)", value: `${data.summary.ctr7d.toFixed(2)}%` },
    ];
  }, [data]);

  return (
    <PortalShell
      title="Advertiser Portal"
      subtitle="Campaigns, creatives, budget controls, and performance."
    >
      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Loaded from API (`/api/advertiser/dashboard`).</p>
            {loading && <p className="text-sm text-muted-foreground">Loading campaigns...</p>}
            {!loading && error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            {!loading && !error && (
              <div className="space-y-2">
                {(data?.campaigns || []).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{campaign.title}</p>
                      <Badge variant={campaign.status === "Live" ? "default" : "secondary"}>{campaign.status}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                      <p>Format: {campaign.format}</p>
                      <p>7d Spend: {formatCurrency(campaign.spend7dCents)}</p>
                      <p>7d CTR: {campaign.ctr7d.toFixed(2)}%</p>
                      <p>Weight: {campaign.weight}</p>
                    </div>
                  </div>
                ))}
                {!data?.campaigns?.length && (
                  <p className="text-sm text-muted-foreground">No campaigns yet. Create your first campaign.</p>
                )}
              </div>
            )}
            <Button className="mt-4" variant="hero">
              New Campaign
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Budget and Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set daily caps, monitor pacing, and keep campaigns within spend targets.
            </p>
            <Button className="mt-4" variant="hero-outline">
              Open Billing
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
};

export default AdvertiserPortal;
