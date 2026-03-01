import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { apiRequest } from "@/lib/api";
import { getPortalHeaders } from "@/lib/portal-api";
import {
  CreditCard,
  MousePointerClick,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import AdvertiserSummaryMetrics from "@/components/portal/advertiser/AdvertiserSummaryMetrics";
import CampaignPerformanceChart from "@/components/portal/advertiser/CampaignPerformanceChart";
import CampaignList from "@/components/portal/advertiser/CampaignList";
import BillingPanel from "@/components/portal/advertiser/BillingPanel";
import CreateCampaignWizard from "@/components/portal/advertiser/CreateCampaignWizard";
import EditCampaignModal from "@/components/portal/advertiser/EditCampaignModal";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface AdvertiserCampaignRecord {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  imageUrl?: string | null;
  topics: string[];
  format: "text" | "card" | "banner";
  weight: number;
  isActive: boolean;
}

interface CampaignInfoDraft {
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  topics: string;
  format: "text" | "card" | "banner";
  weight: string;
}

interface CampaignBudgetDraft {
  dailyBudgetUsd: string;
  lifetimeBudgetUsd: string;
}

interface CampaignBudget {
  dailyBudgetCents: number;
  lifetimeBudgetCents: number;
  durationDays: number;
}

interface WalletTransaction {
  id: string;
  type: "topup" | "spend" | "refund";
  amountCents: number;
  description?: string;
  createdAt: string;
}

type WizardStep = 1 | 2 | 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const parseUsdToCents = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 100));
};

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const emptyInfo: CampaignInfoDraft = {
  title: "", description: "", ctaText: "", clickUrl: "",
  topics: "ai, performance", format: "card", weight: "1",
};

const emptyBudget: CampaignBudgetDraft = { dailyBudgetUsd: "50", lifetimeBudgetUsd: "500" };

// ── Main component ────────────────────────────────────────────────────────────

const AdvertiserPortal = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<AdvertiserDashboardResponse | null>(null);
  const [campaignRecords, setCampaignRecords] = useState<Record<string, AdvertiserCampaignRecord>>({});
  const [walletBalanceCents, setWalletBalanceCents] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [campaignBudgets, setCampaignBudgets] = useState<Record<string, CampaignBudget>>({});

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [infoDraft, setInfoDraft] = useState<CampaignInfoDraft>(emptyInfo);
  const [wizardDailyUsd, setWizardDailyUsd] = useState("50");
  const [wizardDurationDays, setWizardDurationDays] = useState("30");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInfo, setEditInfo] = useState<CampaignInfoDraft>(emptyInfo);
  const [editBudget, setEditBudget] = useState<CampaignBudgetDraft>(emptyBudget);

  // Billing state
  const [topUpAmountUsd, setTopUpAmountUsd] = useState("250");
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);

  // ── computed ───────────────────────────────────────────────────────────────

  const wizardDailyBudgetCents = parseUsdToCents(wizardDailyUsd);
  const wizardDays = Math.max(1, Math.min(365, parseInt(wizardDurationDays) || 30));
  const wizardTotalBudgetCents = wizardDailyBudgetCents * wizardDays;

  // ── data loading ───────────────────────────────────────────────────────────

  const loadDashboard = async (email: string, cancelledRef?: { current: boolean }) => {
    setLoading(true); setError("");
    try {
      const headers = await getPortalHeaders(email);
      const [dashRes, campRes] = await Promise.all([
        apiRequest<AdvertiserDashboardResponse>("/advertiser/dashboard", undefined, headers),
        apiRequest<{ items: AdvertiserCampaignRecord[]; nextCursor: string | null; hasMore: boolean }>("/advertiser/campaigns", undefined, headers),
      ]);
      if (!cancelledRef?.current) {
        setData(dashRes);
        setCampaignRecords(Object.fromEntries((campRes.items ?? []).map((c) => [c.id, c])));
      }
    } catch (err) {
      if (!cancelledRef?.current) setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      if (!cancelledRef?.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.email) return;
    const ref = { current: false };
    void loadDashboard(user.email, ref);
    return () => { ref.current = true; };
  }, [user?.email]);

  const loadWallet = useCallback(async (email: string) => {
    setWalletLoading(true);
    try {
      const headers = await getPortalHeaders(email);
      const [res, ppConfig] = await Promise.all([
        apiRequest<{ walletBalanceCents: number; transactions: WalletTransaction[] }>(
          "/wallet/balance", undefined, headers,
        ),
        apiRequest<{ clientId: string | null }>("/wallet/paypal/config").catch(() => ({ clientId: null })),
      ]);
      setWalletBalanceCents(res.walletBalanceCents);
      setWalletTransactions(res.transactions);
      if (ppConfig.clientId) setPaypalClientId(ppConfig.clientId);
    } catch {
      // non-fatal
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.email) void loadWallet(user.email);
  }, [user?.email, loadWallet]);

  useEffect(() => () => {
    if (uploadedPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(uploadedPreviewUrl);
  }, [uploadedPreviewUrl]);

  // ── wizard handlers ────────────────────────────────────────────────────────

  const resetWizard = () => {
    setWizardStep(1); setInfoDraft(emptyInfo);
    setWizardDailyUsd("50"); setWizardDurationDays("30");
    setUploadedPreviewUrl((prev) => { if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev); return null; });
  };

  const openWizard = () => { setError(""); setNotice(""); resetWizard(); setWizardOpen(true); };
  const closeWizard = () => { setWizardOpen(false); resetWizard(); };

  const validateStep1 = (): string => {
    if (!infoDraft.title.trim() || !infoDraft.description.trim() || !infoDraft.ctaText.trim())
      return "Title, description, and CTA are required.";
    if (!isHttpUrl(infoDraft.clickUrl)) return "Destination URL must start with http:// or https://.";
    const w = Number(infoDraft.weight || "1");
    if (!Number.isFinite(w) || w < 1 || w > 100) return "Weight must be between 1 and 100.";
    return "";
  };

  const moveStep = (dir: "next" | "back") => {
    if (dir === "back") { setError(""); setWizardStep((p) => (p === 1 ? 1 : ((p - 1) as WizardStep))); return; }
    if (wizardStep === 1) { const e = validateStep1(); if (e) { setError(e); return; } }
    setError("");
    setWizardStep((p) => (p === 3 ? 3 : ((p + 1) as WizardStep)));
  };

  const submitCampaign = async () => {
    if (!user?.email) return;
    if (wizardDailyBudgetCents <= 0) { setError("Daily budget must be greater than $0."); return; }
    if (walletBalanceCents < wizardTotalBudgetCents) { setError("Insufficient wallet funds."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      const created = await apiRequest<{ id: string }>(
        "/advertiser/campaigns",
        {
          method: "POST",
          body: JSON.stringify({
            title: infoDraft.title, description: infoDraft.description,
            ctaText: infoDraft.ctaText, clickUrl: infoDraft.clickUrl,
            topics: infoDraft.topics.split(",").map((t) => t.trim()).filter(Boolean),
            format: infoDraft.format, weight: Number(infoDraft.weight || "1"),
            dailyBudgetCents: wizardDailyBudgetCents,
            lifetimeBudgetCents: wizardTotalBudgetCents,
            durationDays: wizardDays,
          }),
        },
        headers,
      );
      if (created?.id) {
        setCampaignBudgets((prev) => ({
          ...prev,
          [created.id]: { dailyBudgetCents: wizardDailyBudgetCents, lifetimeBudgetCents: wizardTotalBudgetCents, durationDays: wizardDays },
        }));
        try {
          const spendRes = await apiRequest<{ newBalanceCents: number }>(
            "/wallet/spend",
            { method: "POST", body: JSON.stringify({ amountCents: wizardTotalBudgetCents, description: `Budget for campaign: ${infoDraft.title}` }) },
            headers,
          );
          setWalletBalanceCents(spendRes.newBalanceCents);
        } catch {
          setWalletBalanceCents((prev) => Math.max(0, prev - wizardTotalBudgetCents));
        }
      }
      setNotice("Campaign submitted for review. Budget reserved from wallet.");
      closeWizard();
      await loadDashboard(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit campaign");
    } finally {
      setSaving(false);
    }
  };

  // ── edit handlers ──────────────────────────────────────────────────────────

  const openEdit = (id: string) => {
    const rec = campaignRecords[id];
    if (!rec) return;
    const bud = campaignBudgets[id];
    setEditInfo({ title: rec.title, description: rec.description, ctaText: rec.ctaText, clickUrl: rec.clickUrl, topics: rec.topics.join(", "), format: rec.format, weight: String(rec.weight) });
    setEditBudget({ dailyBudgetUsd: bud ? String((bud.dailyBudgetCents / 100).toFixed(2)) : "50", lifetimeBudgetUsd: bud ? String((bud.lifetimeBudgetCents / 100).toFixed(2)) : "500" });
    setEditingId(id); setError(""); setNotice("");
  };

  const closeEdit = () => { setEditingId(null); setEditInfo(emptyInfo); setEditBudget(emptyBudget); };

  const saveEdit = async () => {
    if (!user?.email || !editingId) return;
    const w = Number(editInfo.weight || "1");
    if (!Number.isFinite(w) || w < 1 || w > 100) { setError("Weight must be between 1 and 100."); return; }
    if (!isHttpUrl(editInfo.clickUrl)) { setError("Destination URL must start with http:// or https://."); return; }
    const daily = parseUsdToCents(editBudget.dailyBudgetUsd);
    const lifetime = parseUsdToCents(editBudget.lifetimeBudgetUsd);
    if (daily <= 0 || lifetime <= 0 || daily > lifetime) { setError("Set valid daily and lifetime budgets."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(`/advertiser/campaigns/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editInfo.title, description: editInfo.description,
          ctaText: editInfo.ctaText, clickUrl: editInfo.clickUrl,
          topics: editInfo.topics.split(",").map((t) => t.trim()).filter(Boolean),
          format: editInfo.format, weight: w,
          // Budget edits update pacing caps in DB. Note: wallet deduction is locked at
          // launch time — only daily rate and duration can be changed freely here.
          // Lifetime budget is capped at original reservation to prevent free overruns.
          dailyBudgetCents: daily,
          lifetimeBudgetCents: Math.min(lifetime, campaignBudgets[editingId!]?.lifetimeBudgetCents ?? lifetime),
        }),
      }, headers);
      setCampaignBudgets((prev) => ({ ...prev, [editingId]: { dailyBudgetCents: daily, lifetimeBudgetCents: lifetime, durationDays: Math.round(lifetime / daily) || 30 } }));
      setNotice("Campaign updated."); closeEdit();
      await loadDashboard(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update campaign"); }
    finally { setSaving(false); }
  };

  const toggleCampaign = async (id: string, nextLive: boolean) => {
    if (!user?.email) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(`/advertiser/campaigns/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: nextLive }) }, headers);
      setNotice(nextLive ? "Campaign is now live." : "Campaign paused.");
      await loadDashboard(user.email);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update campaign"); }
    finally { setSaving(false); }
  };

  // ── PayPal billing ─────────────────────────────────────────────────────────

  const createPayPalOrder = useCallback(async () => {
    if (!user?.email) throw new Error("Not logged in");
    const amountCents = parseUsdToCents(topUpAmountUsd);
    if (amountCents < 100) throw new Error("Minimum top-up is $1.00");
    const headers = await getPortalHeaders(user.email);
    const res = await apiRequest<{ orderID: string }>(
      "/wallet/paypal/create-order",
      { method: "POST", body: JSON.stringify({ amountCents }) },
      headers,
    );
    return res.orderID;
  }, [user?.email, topUpAmountUsd]);

  const onPayPalApprove = useCallback(async (data: { orderID: string }) => {
    if (!user?.email) return;
    try {
      const headers = await getPortalHeaders(user.email);
      const res = await apiRequest<{ amountCents: number; newBalanceCents: number }>(
        "/wallet/paypal/capture-order",
        { method: "POST", body: JSON.stringify({ orderID: data.orderID }) },
        headers,
      );
      setWalletBalanceCents(res.newBalanceCents);
      setNotice(`Wallet credited ${formatCurrency(res.amountCents)}. New balance: ${formatCurrency(res.newBalanceCents)}.`);
      setTopUpAmountUsd("250");
      void loadWallet(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture payment");
    }
  }, [user?.email, loadWallet]);

  // ── image upload ───────────────────────────────────────────────────────────

  const applyImage = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please upload a valid image file."); return; }
    setUploadedPreviewUrl((prev) => { if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { applyImage(f); e.target.value = ""; } };
  const onDrop = (e: DragEvent<HTMLButtonElement>) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) applyImage(f); };

  // ── derived ────────────────────────────────────────────────────────────────

  const chartData = useMemo(
    () => (data?.campaigns || []).map((c) => ({
      name: c.title.length > 16 ? c.title.slice(0, 16) + "…" : c.title,
      Impressions: c.impressions7d,
      Clicks: c.clicks7d,
      "Spend ($)": parseFloat((c.spend7dCents / 100).toFixed(2)),
    })),
    [data?.campaigns],
  );

  const summaryCards = useMemo(() => [
    { label: "Spend Today", value: data ? formatCurrency(data.summary.spendTodayCents) : "--", icon: Wallet },
    { label: "Active Campaigns", value: data ? String(data.summary.activeCampaigns) : "--", icon: Zap },
    { label: "Pending Review", value: data ? String(data.summary.pendingReview) : "--", icon: TrendingUp },
    { label: "CTR (7d)", value: data ? `${data.summary.ctr7d.toFixed(2)}%` : "--", icon: MousePointerClick },
    { label: "Wallet Balance", value: formatCurrency(walletBalanceCents), icon: CreditCard },
  ], [data, walletBalanceCents]);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <PortalShell title="Advertiser Portal" subtitle="Insights, campaigns, and billing in one place.">
      <AdvertiserSummaryMetrics cards={summaryCards} />
      <CampaignPerformanceChart data={chartData} />

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <CampaignList
          loading={loading}
          campaigns={data?.campaigns || []}
          campaignRecords={campaignRecords}
          campaignBudgets={campaignBudgets}
          saving={saving}
          formatCurrency={formatCurrency}
          onCreateAd={openWizard}
          onToggle={(id, nextLive) => void toggleCampaign(id, nextLive)}
          onEdit={openEdit}
        />
        <BillingPanel
          walletLoading={walletLoading}
          walletBalanceCents={walletBalanceCents}
          topUpAmountUsd={topUpAmountUsd}
          transactions={walletTransactions}
          formatCurrency={formatCurrency}
          onTopUpAmountChange={setTopUpAmountUsd}
          createPayPalOrder={createPayPalOrder}
          onPayPalApprove={onPayPalApprove}
          onPayPalError={(err) => setError(String(err))}
          paypalClientId={paypalClientId}
        />
      </div>

      {wizardOpen && (
        <CreateCampaignWizard
          wizardStep={wizardStep}
          infoDraft={infoDraft}
          wizardDailyUsd={wizardDailyUsd}
          wizardDurationDays={wizardDurationDays}
          wizardDailyBudgetCents={wizardDailyBudgetCents}
          wizardDays={wizardDays}
          wizardTotalBudgetCents={wizardTotalBudgetCents}
          walletBalanceCents={walletBalanceCents}
          dragActive={dragActive}
          uploadedPreviewUrl={uploadedPreviewUrl}
          saving={saving}
          error={error}
          fileInputRef={fileInputRef}
          formatCurrency={formatCurrency}
          onInfoChange={(p) => setInfoDraft((prev) => ({ ...prev, ...p }))}
          onDailyUsdChange={setWizardDailyUsd}
          onDurationDaysChange={setWizardDurationDays}
          onClose={closeWizard}
          onBack={() => moveStep("back")}
          onNext={() => moveStep("next")}
          onSubmit={() => void submitCampaign()}
          onFileChange={onFileChange}
          onDrop={onDrop}
          onDragOver={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
        />
      )}

      {editingId && (
        <EditCampaignModal
          info={editInfo}
          budget={editBudget}
          saving={saving}
          error={error}
          onInfoChange={(p) => setEditInfo((prev) => ({ ...prev, ...p }))}
          onBudgetChange={(p) => setEditBudget((prev) => ({ ...prev, ...p }))}
          onClose={closeEdit}
          onSave={() => void saveEdit()}
        />
      )}
    </PortalShell>
  );
};

export default AdvertiserPortal;
