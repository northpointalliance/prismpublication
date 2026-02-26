import { useEffect, useMemo, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { apiRequest } from "@/lib/api";

interface PublisherDashboardResponse {
  summary: {
    registeredBots: number;
    fillRate7d: number;
    revenueTodayCents: number;
    sdkErrors: number;
  };
  bots: Array<{
    botId: string;
    name: string;
    environment: string;
    health: string;
    requests7d: number;
    fillRate7d: number;
    revenueTodayCents: number;
    sdkErrors: number;
  }>;
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const PublisherPortal = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<PublisherDashboardResponse | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    apiRequest<PublisherDashboardResponse>("/publisher/dashboard", undefined, {
      "x-user-email": user.email.toLowerCase(),
    })
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load bot developer data";
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
        { label: "Registered Bots", value: "--" },
        { label: "Fill Rate (7d)", value: "--" },
        { label: "Revenue (Today)", value: "--" },
        { label: "SDK Errors", value: "--" },
      ];
    }
    return [
      { label: "Registered Bots", value: String(data.summary.registeredBots) },
      { label: "Fill Rate (7d)", value: `${data.summary.fillRate7d.toFixed(2)}%` },
      { label: "Revenue (Today)", value: formatCurrency(data.summary.revenueTodayCents) },
      { label: "SDK Errors", value: String(data.summary.sdkErrors) },
    ];
  }, [data]);

  return (
    <PortalShell
      title="Bot Developer Portal"
      subtitle="Bots, SDK keys, placement policies, diagnostics, and monetization."
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
            <CardTitle className="text-xl font-bold">Bot Registry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Loaded from API (`/api/publisher/dashboard`).</p>
            {loading && <p className="text-sm text-muted-foreground">Loading bots...</p>}
            {!loading && error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            {!loading && !error && (
              <div className="space-y-2">
                {(data?.bots || []).map((bot) => (
                  <div key={bot.botId} className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{bot.name}</p>
                      <Badge variant={bot.health === "healthy" ? "default" : "secondary"}>
                        {bot.health}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                      <p>Env: {bot.environment}</p>
                      <p>Req (7d): {Intl.NumberFormat("en-US").format(bot.requests7d)}</p>
                      <p>Fill (7d): {bot.fillRate7d.toFixed(2)}%</p>
                      <p>Rev (Today): {formatCurrency(bot.revenueTodayCents)}</p>
                    </div>
                  </div>
                ))}
                {!data?.bots?.length && <p className="text-sm text-muted-foreground">No bots yet. Add your first bot.</p>}
              </div>
            )}
            <Button className="mt-4" variant="hero">
              Add Bot
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">SDK and Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Rotate keys, tune placement rules, and troubleshoot diagnostics per environment.
            </p>
            <Button className="mt-4" variant="hero-outline">
              Manage SDK
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
};

export default PublisherPortal;
