import { useCallback, useEffect, useMemo, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { apiRequest } from "@/lib/api";
import { getPortalHeaders } from "@/lib/portal-api";
import { Badge } from "@/components/ui/badge";
import ReviewQueueTab from "@/components/portal/admin/ReviewQueueTab";
import FinancePanel from "@/components/portal/admin/FinancePanel";
import PayPalConfigForm from "@/components/portal/admin/PayPalConfigForm";
import PlatformFeeForm from "@/components/portal/admin/PlatformFeeForm";
import RateTableForm from "@/components/portal/admin/RateTableForm";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface AdReviewResponse {
  pending: Ad[];
  active: Ad[];
}

interface PlatformSettings {
  platformFeePct: number;
  paypalMode: string;
  paypalEnabled: boolean;
  paypalClientIdMasked?: string | null;
  paypalFromDb?: boolean;
  cpmTextCents: number;
  cpmCardCents: number;
  cpmBannerCents: number;
}

interface WalletTx {
  id: string;
  type: "topup" | "spend" | "refund";
  amountCents: number;
  description?: string;
  createdAt: string;
  organization: { name: string };
}

interface PayoutReq {
  id: string;
  amountCents: number;
  paypalEmail: string;
  status: "pending" | "processing" | "paid" | "failed";
  createdAt: string;
  paypalBatchId?: string;
  organization: { name: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const formatDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "--" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

type Tab = "review" | "finance" | "settings";

// ── Main component ────────────────────────────────────────────────────────────

const AdminPortal = () => {
  const { user } = usePortalAuth();
  const [activeTab, setActiveTab] = useState<Tab>("review");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Review state
  const [ads, setAds] = useState<AdReviewResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  // Finance state
  const [walletTxns, setWalletTxns] = useState<WalletTx[]>([]);
  const [payoutReqs, setPayoutReqs] = useState<PayoutReq[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [financeTab, setFinanceTab] = useState<"payouts" | "topups">("payouts");

  // Settings state
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [feeDraft, setFeeDraft] = useState("");
  const [savingFee, setSavingFee] = useState(false);

  // PayPal credentials form
  const [ppClientId, setPpClientId] = useState("");
  const [ppClientSecret, setPpClientSecret] = useState("");
  const [ppMode, setPpMode] = useState<"sandbox" | "live">("sandbox");
  const [savingPaypal, setSavingPaypal] = useState(false);

  // CPM rate table
  const [ratesDraft, setRatesDraft] = useState({ text: "10.00", card: "20.00", banner: "15.00" });
  const [savingRates, setSavingRates] = useState(false);

  // ── loaders ────────────────────────────────────────────────────────────────

  const loadReview = useCallback(async (email: string) => {
    setReviewLoading(true);
    try {
      const headers = await getPortalHeaders(email);
      const res = await apiRequest<AdReviewResponse>("/admin/portal/ads/review", undefined, headers);
      setAds(res);
    } catch {
      // non-fatal
    } finally {
      setReviewLoading(false);
    }
  }, []);

  const loadFinance = useCallback(async (email: string) => {
    try {
      const headers = await getPortalHeaders(email);
      const [settings, txns, payouts] = await Promise.all([
        apiRequest<PlatformSettings>("/admin/platform-settings", undefined, headers),
        apiRequest<WalletTx[]>("/admin/wallet-transactions", undefined, headers),
        apiRequest<PayoutReq[]>("/admin/payout-requests", undefined, headers),
      ]);
      setPlatformSettings(settings);
      setFeeDraft(String(settings.platformFeePct));
      setRatesDraft({
        text:   ((settings.cpmTextCents   ?? 1000) / 100).toFixed(2),
        card:   ((settings.cpmCardCents   ?? 2000) / 100).toFixed(2),
        banner: ((settings.cpmBannerCents ?? 1500) / 100).toFixed(2),
      });
      setWalletTxns(txns);
      setPayoutReqs(payouts);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    void loadReview(user.email);
    void loadFinance(user.email);
  }, [user?.email, loadReview, loadFinance]);

  // ── review actions ─────────────────────────────────────────────────────────

  const approveAd = async (id: string) => {
    if (!user?.email) return;
    setActingOnId(id); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(`/admin/portal/ads/${id}/approve`, { method: "POST" }, headers);
      setNotice("Ad approved and is now live.");
      void loadReview(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to approve ad"); }
    finally { setActingOnId(null); }
  };

  const rejectAd = async (id: string) => {
    if (!user?.email) return;
    setActingOnId(id); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(`/admin/portal/ads/${id}/reject`, { method: "POST" }, headers);
      setNotice("Ad rejected and removed.");
      void loadReview(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to reject ad"); }
    finally { setActingOnId(null); }
  };

  // ── payout actions ─────────────────────────────────────────────────────────

  const processPayout = async (id: string) => {
    if (!user?.email) return;
    setProcessingId(id); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(`/admin/payout-requests/${id}/process`, { method: "POST" }, headers);
      setNotice("Payout sent via PayPal.");
      void loadFinance(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to send payout"); }
    finally { setProcessingId(null); }
  };

  const markPaid = async (id: string) => {
    if (!user?.email) return;
    setProcessingId(id); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(`/admin/payout-requests/${id}/status`, { method: "PUT", body: JSON.stringify({ status: "paid" }) }, headers);
      setNotice("Payout marked as paid.");
      void loadFinance(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update payout"); }
    finally { setProcessingId(null); }
  };

  const saveRates = async () => {
    if (!user?.email) return;
    const toInt = (v: string, fallback: number) => {
      const n = Math.round(parseFloat(v) * 100);
      return Number.isFinite(n) && n >= 100 ? n : fallback;
    };
    const payload = {
      cpmTextCents:   toInt(ratesDraft.text,   1000),
      cpmCardCents:   toInt(ratesDraft.card,   2000),
      cpmBannerCents: toInt(ratesDraft.banner, 1500),
    };
    setSavingRates(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest("/admin/platform-settings/rates", { method: "PUT", body: JSON.stringify(payload) }, headers);
      setNotice("CPM rates updated.");
      void loadFinance(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update rates"); }
    finally { setSavingRates(false); }
  };

  const saveFee = async () => {
    if (!user?.email) return;
    const pct = parseFloat(feeDraft);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) { setError("Fee must be between 0 and 100."); return; }
    setSavingFee(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest("/admin/platform-settings/fee", { method: "PUT", body: JSON.stringify({ platformFeePct: pct }) }, headers);
      setNotice(`Platform fee updated to ${pct}%.`);
      void loadFinance(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update fee"); }
    finally { setSavingFee(false); }
  };

  const savePaypalConfig = async () => {
    if (!user?.email) return;
    if (!ppClientId && !ppClientSecret) { setError("Enter at least a Client ID or Client Secret to save."); return; }
    setSavingPaypal(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      const body: Record<string, string> = { mode: ppMode };
      if (ppClientId) body.clientId = ppClientId;
      if (ppClientSecret) body.clientSecret = ppClientSecret;
      await apiRequest("/admin/platform-settings/paypal", { method: "PUT", body: JSON.stringify(body) }, headers);
      setNotice("PayPal credentials saved. Changes take effect immediately.");
      setPpClientSecret("");
      void loadFinance(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save PayPal config"); }
    finally { setSavingPaypal(false); }
  };

  // ── derived ────────────────────────────────────────────────────────────────

  const pendingAds = ads?.pending ?? [];
  const activeAds = ads?.active ?? [];
  const pendingPayouts = payoutReqs.filter((p) => p.status === "pending");
  const totalTopUp = useMemo(() => walletTxns.filter((t) => t.type === "topup").reduce((s, t) => s + t.amountCents, 0), [walletTxns]);
  const totalPaidOut = useMemo(() => payoutReqs.filter((p) => p.status === "paid" || p.status === "processing").reduce((s, p) => s + p.amountCents, 0), [payoutReqs]);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "review", label: "Review Queue", badge: pendingAds.length || undefined },
    { key: "finance", label: "Finance", badge: pendingPayouts.length || undefined },
    { key: "settings", label: "Settings" },
  ];

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <PortalShell title="Admin" subtitle="Review ads, manage payouts, and configure the platform.">
      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {tabs.map(({ key, label, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setActiveTab(key); setError(""); setNotice(""); }}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {badge ? (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === "review" && (
        <ReviewQueueTab
          pendingAds={pendingAds}
          activeAds={activeAds}
          reviewLoading={reviewLoading}
          actingOnId={actingOnId}
          formatDate={formatDate}
          onApprove={(id) => void approveAd(id)}
          onReject={(id) => void rejectAd(id)}
        />
      )}

      {activeTab === "finance" && (
        <FinancePanel
          walletTxns={walletTxns}
          payoutReqs={payoutReqs}
          totalTopUp={totalTopUp}
          totalPaidOut={totalPaidOut}
          financeTab={financeTab}
          processingId={processingId}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onFinanceTabChange={setFinanceTab}
          onProcessPayout={(id) => void processPayout(id)}
          onMarkPaid={(id) => void markPaid(id)}
        />
      )}

      {activeTab === "settings" && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2" style={{ alignItems: "start" }}>
            <PayPalConfigForm
              platformSettings={platformSettings}
              ppClientId={ppClientId}
              ppClientSecret={ppClientSecret}
              ppMode={ppMode}
              savingPaypal={savingPaypal}
              onClientIdChange={setPpClientId}
              onClientSecretChange={setPpClientSecret}
              onModeChange={setPpMode}
              onSave={() => void savePaypalConfig()}
            />
            <PlatformFeeForm
              platformSettings={platformSettings}
              feeDraft={feeDraft}
              savingFee={savingFee}
              onFeeDraftChange={setFeeDraft}
              onSave={() => void saveFee()}
            />
          </div>
          <RateTableForm
            cpmTextCents={platformSettings?.cpmTextCents ?? 1000}
            cpmCardCents={platformSettings?.cpmCardCents ?? 2000}
            cpmBannerCents={platformSettings?.cpmBannerCents ?? 1500}
            platformFeePct={platformSettings?.platformFeePct ?? 30}
            draft={ratesDraft}
            saving={savingRates}
            onDraftChange={(patch) => setRatesDraft((prev) => ({ ...prev, ...patch }))}
            onSave={() => void saveRates()}
          />
        </div>
      )}
    </PortalShell>
  );
};

export default AdminPortal;
