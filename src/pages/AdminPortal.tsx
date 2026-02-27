import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { apiRequest } from "@/lib/api";
import { getPortalHeaders } from "@/lib/portal-api";

interface AdminPortalOverviewResponse {
  campaignsPending: number;
  botReviewsPending: number;
  riskAlerts: number;
  incidentsOpen: number;
  activeAds: number;
  totalEvents: number;
  totalLeads: number;
}

const AdminPortal = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<AdminPortalOverviewResponse | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    getPortalHeaders(user.email)
      .then((headers) => apiRequest<AdminPortalOverviewResponse>("/admin/portal/overview", undefined, headers))
      .then((response) => {
        if (!cancelled) {
          setOverview(response);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load admin overview";
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
    if (!overview) {
      return [
        { label: "Campaigns Pending", value: "--" },
        { label: "Bot Reviews Pending", value: "--" },
        { label: "Risk Alerts", value: "--" },
        { label: "Incidents Open", value: "--" },
      ];
    }
    return [
      { label: "Campaigns Pending", value: String(overview.campaignsPending) },
      { label: "Bot Reviews Pending", value: String(overview.botReviewsPending) },
      { label: "Risk Alerts", value: String(overview.riskAlerts) },
      { label: "Incidents Open", value: String(overview.incidentsOpen) },
    ];
  }, [overview]);

  return (
    <PortalShell
      title="Platform Admin Portal"
      subtitle="Global oversight for reviews, risk, finance, and operations."
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

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Network Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Active ads: {overview?.activeAds ?? "--"}</p>
            <p className="mt-2 text-sm text-muted-foreground">Tracked events: {overview?.totalEvents ?? "--"}</p>
            <p className="mt-2 text-sm text-muted-foreground">Inbound leads: {overview?.totalLeads ?? "--"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Moderation and Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review campaigns and bots, then enforce trust and policy decisions.
            </p>
            <Button className="mt-4" variant="primary">
              Open Review Queue
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Legacy Admin Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Existing campaign control panel remains available for ad inventory operations.
            </p>
            <Link to="/notadmin">
              <Button className="mt-4" variant="secondary">
                Open Existing Panel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Loading admin overview...</p>}
      {!loading && error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </PortalShell>
  );
};

export default AdminPortal;
