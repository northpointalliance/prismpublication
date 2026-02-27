import { useEffect, useMemo, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { apiRequest } from "@/lib/api";
import { getPortalHeaders } from "@/lib/portal-api";
import {
  Activity,
  Bot,
  Copy,
  KeyRound,
  ServerCog,
  Trash2,
  Wallet,
} from "lucide-react";

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

const formatDateTime = (value: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const environmentTone: Record<PublisherBotListItem["environment"], string> = {
  development: "bg-sky-100 text-sky-800 border-sky-200",
  staging: "bg-amber-100 text-amber-800 border-amber-200",
  production: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const PublisherPortal = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<PublisherDashboardResponse | null>(null);
  const [bots, setBots] = useState<PublisherBotListItem[]>([]);
  const [botName, setBotName] = useState("");
  const [botEnvironment, setBotEnvironment] = useState<PublisherBotListItem["environment"]>("production");
  const [latestToken, setLatestToken] = useState<{ botId: string; token: string } | null>(null);

  const loadPortalData = async (email: string, cancelledRef?: { current: boolean }) => {
    setLoading(true);
    setError("");

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
          body: JSON.stringify({ label: "Rotation" }),
        },
        headers,
      );

      setLatestToken({
        botId: response.botId,
        token: response.key.token,
      });
      setNotice(`SDK key rotated for ${bot.name}. Previous key was invalidated.`);
      await loadPortalData(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rotate SDK key");
    } finally {
      setSaving(false);
    }
  };

  const deleteBot = async (bot: PublisherBotListItem) => {
    if (!user?.email) return;
    const confirmed = window.confirm(`Delete bot "${bot.name}"? This will remove all associated SDK keys.`);
    if (!confirmed) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(`/publisher/bots/${bot.id}`, { method: "DELETE" }, headers);
      setNotice(`Bot "${bot.name}" deleted.`);
      await loadPortalData(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bot");
    } finally {
      setSaving(false);
    }
  };

  const copyLatestToken = async () => {
    if (!latestToken?.token) return;
    try {
      await navigator.clipboard.writeText(latestToken.token);
      setNotice(`Copied SDK key for ${latestToken.botId}.`);
    } catch (_err) {
      setError("Failed to copy SDK key.");
    }
  };

  const copyBotLatestToken = async (bot: PublisherBotListItem) => {
    if (!latestToken?.token || latestToken.botId !== bot.botId) {
      setError(`No unrevealed token available for ${bot.name}. Rotate key first.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(latestToken.token);
      setNotice(`Copied SDK key for ${bot.name}.`);
    } catch (_err) {
      setError("Failed to copy SDK key.");
    }
  };

  const copyBotId = async (botId: string) => {
    try {
      await navigator.clipboard.writeText(botId);
      setNotice(`Copied bot ID: ${botId}`);
    } catch (_err) {
      setError("Failed to copy bot ID.");
    }
  };

  const metricsByBotId = useMemo(() => {
    const map = new Map<string, PublisherDashboardResponse["bots"][number]>();
    (data?.bots || []).forEach((bot) => map.set(bot.botId, bot));
    return map;
  }, [data?.bots]);

  const summaryCards = useMemo(() => {
    if (!data) {
      return [
        { label: "Registered Bots", value: "--", icon: Bot },
        { label: "Fill Rate (7d)", value: "--", icon: Activity },
        { label: "Revenue (Today)", value: "--", icon: Wallet },
        { label: "SDK Errors", value: "--", icon: ServerCog },
      ];
    }
    return [
      { label: "Registered Bots", value: String(data.summary.registeredBots), icon: Bot },
      { label: "Fill Rate (7d)", value: `${data.summary.fillRate7d.toFixed(2)}%`, icon: Activity },
      { label: "Revenue (Today)", value: formatCurrency(data.summary.revenueTodayCents), icon: Wallet },
      { label: "SDK Errors", value: String(data.summary.sdkErrors), icon: ServerCog },
    ];
  }, [data]);

  return (
    <PortalShell
      title="Bot Developer Portal"
      subtitle="Manage bots, SDK keys, and monetization in one place."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border/80 bg-card/90">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{card.label}</p>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Bot Registry</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track performance and manage keys per bot.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p className="text-sm text-muted-foreground">Loading bots...</p>}
            {!loading && !error && (
              <div className="space-y-3">
                {bots.map((bot) => {
                  const metric = metricsByBotId.get(bot.botId);
                  const activeKeys = bot.sdkKeys.filter((key) => !key.revokedAt);
                  const currentKey = activeKeys[0] || null;
                  return (
                    <div key={bot.id} className="rounded-2xl border border-border bg-background/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">{bot.name}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Bot ID: {bot.botId}</span>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                              onClick={() => void copyBotId(bot.botId)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${environmentTone[bot.environment]}`}>
                            {bot.environment}
                          </span>
                          <Badge variant={bot.health === "healthy" ? "default" : "secondary"}>{bot.health}</Badge>
                          <Badge variant={bot.isActive ? "default" : "secondary"}>
                            {bot.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                        <div className="rounded-lg border border-border/70 bg-card px-2 py-2">
                          <p className="uppercase tracking-[0.08em]">Requests (7d)</p>
                          <p className="mt-1 font-semibold text-foreground">
                            {Intl.NumberFormat("en-US").format(metric?.requests7d || 0)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-card px-2 py-2">
                          <p className="uppercase tracking-[0.08em]">Fill Rate</p>
                          <p className="mt-1 font-semibold text-foreground">{(metric?.fillRate7d || 0).toFixed(2)}%</p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-card px-2 py-2">
                          <p className="uppercase tracking-[0.08em]">Revenue Today</p>
                          <p className="mt-1 font-semibold text-foreground">
                            {formatCurrency(metric?.revenueTodayCents || 0)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-card px-2 py-2">
                          <p className="uppercase tracking-[0.08em]">Active Keys</p>
                          <p className="mt-1 font-semibold text-foreground">{activeKeys.length}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-border bg-card">
                        <div className="flex items-center justify-between border-b border-border px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">SDK Keys</p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving || latestToken?.botId !== bot.botId}
                              onClick={() => void copyBotLatestToken(bot)}
                            >
                              <Copy className="mr-1 h-3.5 w-3.5" />
                              Copy New Key
                            </Button>
                            <Button size="sm" variant="outline" disabled={saving} onClick={() => void createKey(bot)}>
                              <KeyRound className="mr-1 h-3.5 w-3.5" />
                              Rotate (Invalidate Old)
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 px-3 py-2">
                          {currentKey ? (
                            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-border/70 bg-background px-2 py-2 text-xs">
                              <div>
                                <p className="font-semibold text-foreground">{currentKey.label}</p>
                                <p className="font-mono text-muted-foreground">
                                  {currentKey.prefix}••••{currentKey.last4}
                                </p>
                              </div>
                              <p className="text-muted-foreground">{formatDateTime(currentKey.createdAt)}</p>
                              <Badge>Active</Badge>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No active SDK key.</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="destructive" disabled={saving} onClick={() => void deleteBot(bot)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete Bot
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {!bots.length && <p className="text-sm text-muted-foreground">No bots yet. Add your first bot.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Create Bot</CardTitle>
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
              <p className="text-xs text-muted-foreground">
                A primary SDK key is generated automatically after bot creation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/60">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-emerald-800">Latest SDK Token</CardTitle>
            </CardHeader>
            <CardContent>
              {latestToken ? (
                <div className="space-y-2 text-xs text-emerald-800">
                  <p>
                    Issued for <span className="font-semibold">{latestToken.botId}</span>
                  </p>
                  <p className="break-all rounded-lg border border-emerald-200 bg-white/80 px-2 py-2 font-mono">
                    {latestToken.token}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => void copyLatestToken()}>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copy Token
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-emerald-700">
                  Generate a new key to reveal the full token here.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">
                Security note: store SDK tokens in server secrets only. Full tokens are shown once on key creation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
};

export default PublisherPortal;
