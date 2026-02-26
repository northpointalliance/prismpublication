import { useEffect, useMemo, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { apiRequest } from "@/lib/api";
import { getPortalHeaders } from "@/lib/portal-api";

interface PublisherDashboardResponse {
  summary: {
    registeredBots: number;
    fillRate7d: number;
    revenueTodayCents: number;
    sdkErrors: number;
  };
  bots: Array<{
    id: string;
    botId: string;
    name: string;
    environment: string;
    health: string;
    requests7d: number;
    fillRate7d: number;
    revenueTodayCents: number;
    sdkErrors: number;
    isActive: boolean;
    activeKeyCount: number;
    lastKeyPrefix: string | null;
    lastKeyCreatedAt: string | null;
  }>;
}

interface PublisherBotListItem {
  id: string;
  botId: string;
  name: string;
  environment: "development" | "staging" | "production";
  health: "healthy" | "warning" | "degraded";
  isActive: boolean;
  sdkKeys: Array<{
    id: string;
    label: string;
    prefix: string;
    last4: string;
    createdAt: string;
    revokedAt: string | null;
  }>;
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const PublisherPortal = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<PublisherDashboardResponse | null>(null);
  const [bots, setBots] = useState<PublisherBotListItem[]>([]);
  const [botName, setBotName] = useState("");
  const [botEnvironment, setBotEnvironment] = useState<"development" | "staging" | "production">("production");
  const [notice, setNotice] = useState("");
  const [latestToken, setLatestToken] = useState<{ botId: string; token: string } | null>(null);

  const loadPortalData = async (email: string, cancelledRef?: { current: boolean }) => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const headers = await getPortalHeaders(email);
      const [dashboard, botList] = await Promise.all([
        apiRequest<PublisherDashboardResponse>("/publisher/dashboard", undefined, headers),
        apiRequest<PublisherBotListItem[]>("/publisher/bots", undefined, headers),
      ]);
      if (!cancelledRef?.current) {
        setData(dashboard);
        setBots(botList);
      }
    } catch (err) {
      if (!cancelledRef?.current) {
        const message = err instanceof Error ? err.message : "Failed to load bot developer data";
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
    void loadPortalData(user.email, cancelledRef);

    return () => {
      cancelledRef.current = true;
    };
  }, [user?.email]);

  const createBot = async () => {
    if (!user?.email) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const headers = await getPortalHeaders(user.email);
      const response = await apiRequest<{ bot: { botId: string }; initialSdkKey: { token: string } }>(
        "/publisher/bots",
        {
          method: "POST",
          body: JSON.stringify({
            name: botName,
            environment: botEnvironment,
          }),
        },
        headers,
      );
      setBotName("");
      setBotEnvironment("production");
      setLatestToken({
        botId: response.bot.botId,
        token: response.initialSdkKey.token,
      });
      setNotice("Bot created and initial SDK key issued.");
      await loadPortalData(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bot");
    } finally {
      setSaving(false);
    }
  };

  const createKey = async (bot: PublisherBotListItem) => {
    if (!user?.email) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const headers = await getPortalHeaders(user.email);
      const response = await apiRequest<{ botId: string; key: { token: string } }>(
        `/publisher/bots/${bot.id}/keys`,
        {
          method: "POST",
          body: JSON.stringify({
            label: "Rotation",
          }),
        },
        headers,
      );

      setLatestToken({
        botId: response.botId,
        token: response.key.token,
      });
      setNotice(`New SDK key created for ${bot.name}.`);
      await loadPortalData(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create SDK key");
    } finally {
      setSaving(false);
    }
  };

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
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <p>
                        Keys: {bot.activeKeyCount}
                        {bot.lastKeyPrefix ? ` · Last: ${bot.lastKeyPrefix}••••` : ""}
                      </p>
                      <Button size="sm" variant="outline" disabled={saving} onClick={() => void createKey(bot)}>
                        New SDK Key
                      </Button>
                    </div>
                  </div>
                ))}
                {!data?.bots?.length && <p className="text-sm text-muted-foreground">No bots yet. Add your first bot.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Bot and SDK Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Bot name" value={botName} onChange={(event) => setBotName(event.target.value)} />
            <select
              className="h-10 w-full rounded-full border border-border bg-background px-4 text-sm"
              value={botEnvironment}
              onChange={(event) =>
                setBotEnvironment(event.target.value as "development" | "staging" | "production")
              }
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
            <Button
              className="w-full"
              variant="hero"
              disabled={saving || !botName.trim()}
              onClick={() => void createBot()}
            >
              {saving ? "Saving..." : "Add Bot"}
            </Button>
            {notice && <p className="text-xs text-emerald-700">{notice}</p>}
            {latestToken && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <p className="font-semibold">New SDK key for {latestToken.botId}</p>
                <p className="mt-1 break-all font-mono">{latestToken.token}</p>
              </div>
            )}
            <div className="rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              Keep SDK keys private. They are shown in full only when created.
            </div>
            {!!bots.length && (
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Registered Bots</p>
                {bots.map((bot) => (
                  <p key={bot.id}>
                    {bot.name} ({bot.botId}) - {bot.sdkKeys.filter((key) => !key.revokedAt).length} active keys
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
};

export default PublisherPortal;
