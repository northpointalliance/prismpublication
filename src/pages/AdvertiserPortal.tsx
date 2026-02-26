import { useEffect, useMemo, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

interface AdvertiserCampaignDraft {
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  imageUrl: string;
  topics: string;
  format: "text" | "card" | "banner";
  weight: string;
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const emptyDraft: AdvertiserCampaignDraft = {
  title: "",
  description: "",
  ctaText: "",
  clickUrl: "",
  imageUrl: "",
  topics: "ai, performance",
  format: "card",
  weight: "1",
};

const AdvertiserPortal = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AdvertiserDashboardResponse | null>(null);
  const [draft, setDraft] = useState<AdvertiserCampaignDraft>(emptyDraft);
  const [notice, setNotice] = useState("");

  const loadDashboard = async (email: string, cancelledRef?: { current: boolean }) => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const headers = await getPortalHeaders(email);
      const response = await apiRequest<AdvertiserDashboardResponse>("/advertiser/dashboard", undefined, headers);
      if (!cancelledRef?.current) {
        setData(response);
      }
    } catch (err) {
      if (!cancelledRef?.current) {
        const message = err instanceof Error ? err.message : "Failed to load advertiser data";
        setError(message);
      }
    } finally {
      if (!cancelledRef?.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user?.email) return;

    const cancelledRef = { current: false };
    void loadDashboard(user.email, cancelledRef);

    return () => {
      cancelledRef.current = true;
    };
  }, [user?.email]);

  const createCampaign = async () => {
    if (!user?.email) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(
        "/advertiser/campaigns",
        {
          method: "POST",
          body: JSON.stringify({
            title: draft.title,
            description: draft.description,
            ctaText: draft.ctaText,
            clickUrl: draft.clickUrl,
            imageUrl: draft.imageUrl || undefined,
            topics: draft.topics
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
            format: draft.format,
            weight: Number(draft.weight || 1),
          }),
        },
        headers,
      );
      setDraft(emptyDraft);
      setNotice("Campaign created in review state.");
      await loadDashboard(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  const toggleCampaign = async (campaignId: string, nextLiveState: boolean) => {
    if (!user?.email) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(
        `/advertiser/campaigns/${campaignId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: nextLiveState }),
        },
        headers,
      );
      setNotice(nextLiveState ? "Campaign is now live." : "Campaign moved to review.");
      await loadDashboard(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update campaign");
    } finally {
      setSaving(false);
    }
  };

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
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant={campaign.status === "Live" ? "outline" : "hero-outline"}
                        disabled={saving}
                        onClick={() => void toggleCampaign(campaign.id, campaign.status !== "Live")}
                      >
                        {campaign.status === "Live" ? "Move to Review" : "Go Live"}
                      </Button>
                    </div>
                  </div>
                ))}
                {!data?.campaigns?.length && (
                  <p className="text-sm text-muted-foreground">No campaigns yet. Create your first campaign.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Create Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Title"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
            />
            <Input
              placeholder="Description"
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="CTA text"
                value={draft.ctaText}
                onChange={(event) => setDraft((prev) => ({ ...prev, ctaText: event.target.value }))}
              />
              <Input
                placeholder="Click URL"
                value={draft.clickUrl}
                onChange={(event) => setDraft((prev) => ({ ...prev, clickUrl: event.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <Input
                placeholder="Topics (comma separated)"
                value={draft.topics}
                onChange={(event) => setDraft((prev) => ({ ...prev, topics: event.target.value }))}
              />
              <select
                className="h-10 rounded-full border border-border bg-background px-4 text-sm"
                value={draft.format}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, format: event.target.value as AdvertiserCampaignDraft["format"] }))
                }
              >
                <option value="card">Card</option>
                <option value="text">Text</option>
                <option value="banner">Banner</option>
              </select>
              <Input
                className="w-24"
                placeholder="Weight"
                value={draft.weight}
                onChange={(event) => setDraft((prev) => ({ ...prev, weight: event.target.value }))}
              />
            </div>
            <Input
              placeholder="Image URL (optional)"
              value={draft.imageUrl}
              onChange={(event) => setDraft((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
            {notice && <p className="text-xs text-emerald-700">{notice}</p>}
            <Button className="w-full" variant="hero" disabled={saving} onClick={() => void createCampaign()}>
              {saving ? "Saving..." : "Create Campaign"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
};

export default AdvertiserPortal;
