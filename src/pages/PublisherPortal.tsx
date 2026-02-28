import { useCallback, useEffect, useMemo, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { apiRequest } from "@/lib/api";
import { getPortalHeaders } from "@/lib/portal-api";
import { Activity, Bot, ServerCog, Wallet } from "lucide-react";
import PublisherSummaryMetrics from "@/components/portal/publisher/PublisherSummaryMetrics";
import BotPerformanceChart from "@/components/portal/publisher/BotPerformanceChart";
import BotRegistry, { BotListItem, BotMetrics } from "@/components/portal/publisher/BotRegistry";
import RegisterBotPanel from "@/components/portal/publisher/RegisterBotPanel";
import PayoutsPanel from "@/components/portal/publisher/PayoutsPanel";
import BotDeleteDialog from "@/components/portal/publisher/BotDeleteDialog";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublisherDashboardResponse {
  summary: {
    registeredBots: number;
    fillRate7d: number;
    revenueTodayCents: number;
    sdkErrors: number;
  };
  bots: Array<BotMetrics & { botId: string; name: string }>;
}

interface PayoutData {
  totalEarnedCents: number;
  totalPaidCents: number;
  availableCents: number;
  paypalEmail: string | null;
  recentPayouts: Array<{ id: string; amountCents: number; status: string; createdAt: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const formatDateTime = (value: string | null) => {
  if (!value) return "--";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "--" : d.toLocaleString();
};

// ── Main component ────────────────────────────────────────────────────────────

const PublisherPortal = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<PublisherDashboardResponse | null>(null);
  const [bots, setBots] = useState<BotListItem[]>([]);
  const [botName, setBotName] = useState("");
  const [botEnvironment, setBotEnvironment] = useState<BotListItem["environment"]>("production");
  const [latestToken, setLatestToken] = useState<{ botId: string; token: string } | null>(null);
  const [botToDelete, setBotToDelete] = useState<BotListItem | null>(null);

  // Payout state
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [paypalEmailDraft, setPaypalEmailDraft] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // ── loaders ────────────────────────────────────────────────────────────────

  const loadPayoutBalance = useCallback(async (email: string) => {
    try {
      const headers = await getPortalHeaders(email);
      const res = await apiRequest<PayoutData>("/payouts/balance", undefined, headers);
      setPayoutData(res);
      if (res?.paypalEmail) setPaypalEmailDraft(res.paypalEmail);
    } catch {
      // non-fatal
    }
  }, []);

  const loadPortalData = async (email: string, cancelledRef?: { current: boolean }) => {
    setLoading(true); setError("");
    try {
      const headers = await getPortalHeaders(email);
      const [dashboard, botList] = await Promise.all([
        apiRequest<PublisherDashboardResponse>("/publisher/dashboard", undefined, headers),
        apiRequest<{ items: BotListItem[]; nextCursor: string | null; hasMore: boolean }>("/publisher/bots", undefined, headers),
      ]);
      if (!cancelledRef?.current) { setData(dashboard); setBots(botList.items ?? []); }
    } catch (err) {
      if (!cancelledRef?.current) setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      if (!cancelledRef?.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.email) return;
    const ref = { current: false };
    void loadPortalData(user.email, ref);
    void loadPayoutBalance(user.email);
    return () => { ref.current = true; };
  }, [user?.email, loadPayoutBalance]);

  // ── bot actions ────────────────────────────────────────────────────────────

  const createBot = async () => {
    if (!user?.email) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      const res = await apiRequest<{ bot: { botId: string }; initialSdkKey: { token: string } }>(
        "/publisher/bots",
        { method: "POST", body: JSON.stringify({ name: botName, environment: botEnvironment }) },
        headers,
      );
      setBotName(""); setBotEnvironment("production");
      setLatestToken({ botId: res.bot.botId, token: res.initialSdkKey.token });
      setNotice("Bot created. Initial SDK key issued below.");
      await loadPortalData(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create bot"); }
    finally { setSaving(false); }
  };

  const createKey = async (bot: BotListItem) => {
    if (!user?.email) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      const res = await apiRequest<{ botId: string; key: { token: string } }>(
        `/publisher/bots/${bot.id}/keys`,
        { method: "POST", body: JSON.stringify({ label: "Rotation" }) },
        headers,
      );
      setLatestToken({ botId: res.botId, token: res.key.token });
      setNotice(`Key rotated for ${bot.name}. Previous key invalidated.`);
      await loadPortalData(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to rotate key"); }
    finally { setSaving(false); }
  };

  const confirmDeleteBot = async () => {
    if (!user?.email || !botToDelete) return;
    const bot = botToDelete;
    setBotToDelete(null); setSaving(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(`/publisher/bots/${bot.id}`, { method: "DELETE" }, headers);
      setNotice(`Bot "${bot.name}" deleted.`);
      await loadPortalData(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete bot"); }
    finally { setSaving(false); }
  };

  const savePaypalEmail = async () => {
    if (!user?.email || !paypalEmailDraft.trim()) return;
    setSavingEmail(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest("/payouts/paypal-email", { method: "PUT", body: JSON.stringify({ paypalEmail: paypalEmailDraft.trim() }) }, headers);
      setNotice("PayPal email saved.");
      void loadPayoutBalance(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save PayPal email"); }
    finally { setSavingEmail(false); }
  };

  const requestWithdrawal = async () => {
    if (!user?.email) return;
    setWithdrawing(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      const res = await apiRequest<{ ok: boolean; payout: { amountCents: number; status: string } }>(
        "/payouts/withdraw", { method: "POST" }, headers,
      );
      if (res.ok) {
        setNotice(`Withdrawal of ${formatCurrency(res.payout.amountCents)} submitted. Status: ${res.payout.status}.`);
        void loadPayoutBalance(user.email);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Withdrawal failed"); }
    finally { setWithdrawing(false); }
  };

  const copyToken = async (token: string, label: string) => {
    try { await navigator.clipboard.writeText(token); setNotice(`Copied: ${label}`); }
    catch { setError("Failed to copy."); }
  };

  // ── derived ────────────────────────────────────────────────────────────────

  const metricsByBotId = useMemo(() => {
    const map = new Map<string, BotMetrics>();
    (data?.bots || []).forEach((b) => map.set(b.botId, b));
    return map;
  }, [data?.bots]);

  const summaryCards = useMemo(() => [
    { label: "Registered Bots", value: data ? String(data.summary.registeredBots) : "--", icon: Bot, color: "text-primary" },
    { label: "Fill Rate (7d)", value: data ? `${data.summary.fillRate7d.toFixed(1)}%` : "--", icon: Activity, color: "text-emerald-600" },
    { label: "Revenue Today", value: data ? formatCurrency(data.summary.revenueTodayCents) : "--", icon: Wallet, color: "text-sky-600" },
    { label: "SDK Errors", value: data ? String(data.summary.sdkErrors) : "--", icon: ServerCog, color: data?.summary.sdkErrors ? "text-red-500" : "text-muted-foreground" },
  ], [data]);

  const chartData = useMemo(
    () => bots.map((bot) => {
      const m = metricsByBotId.get(bot.botId);
      return {
        name: bot.name.length > 14 ? bot.name.slice(0, 14) + "…" : bot.name,
        "Requests (7d)": m?.requests7d || 0,
        "Revenue $ Today": parseFloat(((m?.revenueTodayCents || 0) / 100).toFixed(2)),
        "Fill Rate %": parseFloat((m?.fillRate7d || 0).toFixed(1)),
      };
    }),
    [bots, metricsByBotId],
  );

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <PortalShell title="Bot Developer Portal" subtitle="Insights, bot registry, and SDK key management.">
      <PublisherSummaryMetrics cards={summaryCards} />
      <BotPerformanceChart data={chartData} />

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <BotRegistry
          bots={bots}
          loading={loading}
          metricsByBotId={metricsByBotId}
          latestToken={latestToken}
          saving={saving}
          formatCurrency={formatCurrency}
          formatDateTime={formatDateTime}
          onCopyToken={(token, label) => void copyToken(token, label)}
          onCreateKey={(bot) => void createKey(bot)}
          onDeleteBot={setBotToDelete}
        />
        <div className="space-y-4">
          <RegisterBotPanel
            botName={botName}
            botEnvironment={botEnvironment}
            saving={saving}
            latestToken={latestToken}
            onNameChange={setBotName}
            onEnvironmentChange={setBotEnvironment}
            onCreate={() => void createBot()}
            onCopyToken={(token, label) => void copyToken(token, label)}
          />
          <PayoutsPanel
            payoutData={payoutData}
            paypalEmailDraft={paypalEmailDraft}
            savingEmail={savingEmail}
            withdrawing={withdrawing}
            formatCurrency={formatCurrency}
            onEmailChange={setPaypalEmailDraft}
            onSaveEmail={() => void savePaypalEmail()}
            onWithdraw={() => void requestWithdrawal()}
          />
        </div>
      </div>

      <BotDeleteDialog
        botName={botToDelete?.name ?? null}
        open={!!botToDelete}
        onConfirm={() => void confirmDeleteBot()}
        onCancel={() => setBotToDelete(null)}
      />
    </PortalShell>
  );
};

export default PublisherPortal;
