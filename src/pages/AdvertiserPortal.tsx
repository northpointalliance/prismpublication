import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { apiRequest } from "@/lib/api";
import { getPortalHeaders } from "@/lib/portal-api";
import { CreditCard, ExternalLink, ImagePlus, Pencil, UploadCloud, X } from "lucide-react";

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

interface AdvertiserCampaignDraft {
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  topics: string;
  format: "text" | "card" | "banner";
  weight: string;
  dailyBudgetUsd: string;
  lifetimeBudgetUsd: string;
}

interface CampaignBudget {
  dailyBudgetCents: number;
  lifetimeBudgetCents: number;
}

interface PaymentDraft {
  cardholder: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

interface StoredBillingState {
  walletBalanceCents: number;
  campaignBudgets: Record<string, CampaignBudget>;
}

type WizardStep = 1 | 2 | 3;

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const parseUsdToCents = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 100));
};

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const emptyDraft: AdvertiserCampaignDraft = {
  title: "",
  description: "",
  ctaText: "",
  clickUrl: "",
  topics: "ai, performance",
  format: "card",
  weight: "1",
  dailyBudgetUsd: "50",
  lifetimeBudgetUsd: "500",
};

const emptyPaymentDraft: PaymentDraft = {
  cardholder: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
};

const AdvertiserPortal = () => {
  const { user } = usePortalAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<AdvertiserDashboardResponse | null>(null);
  const [campaignRecords, setCampaignRecords] = useState<Record<string, AdvertiserCampaignRecord>>({});
  const [walletBalanceCents, setWalletBalanceCents] = useState(0);
  const [campaignBudgets, setCampaignBudgets] = useState<Record<string, CampaignBudget>>({});

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<AdvertiserCampaignDraft>(emptyDraft);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AdvertiserCampaignDraft>(emptyDraft);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>(emptyPaymentDraft);
  const [topUpAmountUsd, setTopUpAmountUsd] = useState("250");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const billingStorageKey = user?.email ? `advertiser-billing:${user.email.toLowerCase()}` : "";

  const loadDashboard = async (email: string, cancelledRef?: { current: boolean }) => {
    setLoading(true);
    setError("");

    try {
      const headers = await getPortalHeaders(email);
      const [dashboardResponse, campaignsResponse] = await Promise.all([
        apiRequest<AdvertiserDashboardResponse>("/advertiser/dashboard", undefined, headers),
        apiRequest<AdvertiserCampaignRecord[]>("/advertiser/campaigns", undefined, headers),
      ]);
      if (!cancelledRef?.current) {
        setData(dashboardResponse);
        setCampaignRecords(
          Object.fromEntries(campaignsResponse.map((campaign) => [campaign.id, campaign])),
        );
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

  useEffect(() => {
    if (!billingStorageKey) return;
    const raw = localStorage.getItem(billingStorageKey);
    if (!raw) {
      setWalletBalanceCents(0);
      setCampaignBudgets({});
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredBillingState;
      setWalletBalanceCents(parsed.walletBalanceCents || 0);
      setCampaignBudgets(parsed.campaignBudgets || {});
    } catch (_err) {
      setWalletBalanceCents(0);
      setCampaignBudgets({});
    }
  }, [billingStorageKey]);

  useEffect(() => {
    if (!billingStorageKey) return;
    const payload: StoredBillingState = { walletBalanceCents, campaignBudgets };
    localStorage.setItem(billingStorageKey, JSON.stringify(payload));
  }, [billingStorageKey, walletBalanceCents, campaignBudgets]);

  useEffect(
    () => () => {
      if (uploadedPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(uploadedPreviewUrl);
    },
    [uploadedPreviewUrl],
  );

  const resetWizard = () => {
    setWizardStep(1);
    setDraft(emptyDraft);
    setPaymentDraft(emptyPaymentDraft);
    setTopUpAmountUsd("250");
    setUploadedPreviewUrl((previous) => {
      if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
      return null;
    });
  };

  const openWizard = () => {
    setError("");
    setNotice("");
    resetWizard();
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    resetWizard();
  };

  const openEditCampaign = (campaignId: string) => {
    const campaign = campaignRecords[campaignId];
    if (!campaign) return;
    const budget = campaignBudgets[campaignId];
    setEditDraft({
      title: campaign.title,
      description: campaign.description,
      ctaText: campaign.ctaText,
      clickUrl: campaign.clickUrl,
      topics: campaign.topics.join(", "),
      format: campaign.format,
      weight: String(campaign.weight),
      dailyBudgetUsd: budget ? String((budget.dailyBudgetCents / 100).toFixed(2)) : "50",
      lifetimeBudgetUsd: budget ? String((budget.lifetimeBudgetCents / 100).toFixed(2)) : "500",
    });
    setEditingCampaignId(campaignId);
    setError("");
    setNotice("");
  };

  const closeEditCampaign = () => {
    setEditingCampaignId(null);
    setEditDraft(emptyDraft);
  };

  const applyImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setError("");
    setNotice("Image loaded for preview.");
    setUploadedPreviewUrl((previous) => {
      if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    applyImageFile(file);
    event.target.value = "";
  };

  const onDropFile = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    applyImageFile(file);
  };

  const validateStepOne = () => {
    if (!draft.title.trim() || !draft.description.trim() || !draft.ctaText.trim()) {
      return "Title, description, and CTA are required.";
    }
    if (!isHttpUrl(draft.clickUrl)) {
      return "Click URL must start with http:// or https://.";
    }
    const weight = Number(draft.weight || "1");
    if (!Number.isFinite(weight) || weight < 1 || weight > 100) {
      return "Weight must be between 1 and 100.";
    }
    const dailyBudgetCents = parseUsdToCents(draft.dailyBudgetUsd);
    const lifetimeBudgetCents = parseUsdToCents(draft.lifetimeBudgetUsd);
    if (dailyBudgetCents <= 0 || lifetimeBudgetCents <= 0) {
      return "Daily and lifetime budget must be greater than $0.";
    }
    if (dailyBudgetCents > lifetimeBudgetCents) {
      return "Daily budget cannot be greater than lifetime budget.";
    }
    return "";
  };

  const moveStep = (direction: "next" | "back") => {
    if (direction === "back") {
      setWizardStep((prev) => (prev === 1 ? 1 : ((prev - 1) as WizardStep)));
      return;
    }

    if (wizardStep === 1) {
      const validationError = validateStepOne();
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError("");
    setWizardStep((prev) => (prev === 3 ? 3 : ((prev + 1) as WizardStep)));
  };

  const topUpWallet = () => {
    const amountCents = parseUsdToCents(topUpAmountUsd);
    if (amountCents <= 0) {
      setError("Enter a valid top-up amount.");
      return;
    }

    const normalizedNumber = paymentDraft.cardNumber.replace(/\s+/g, "");
    if (!paymentDraft.cardholder.trim() || normalizedNumber.length < 12 || !paymentDraft.expiry.trim() || paymentDraft.cvc.trim().length < 3) {
      setError("Enter valid payment details before adding funds.");
      return;
    }

    setError("");
    setWalletBalanceCents((prev) => prev + amountCents);
    setNotice(`Payment successful. Wallet credited with ${formatCurrency(amountCents)}.`);
    setTopUpAmountUsd("");
  };

  const submitCampaignForReview = async () => {
    if (!user?.email) return;
    setSaving(true);
    setError("");
    setNotice("");

    const validationError = validateStepOne();
    if (validationError) {
      setSaving(false);
      setError(validationError);
      return;
    }

    const dailyBudgetCents = parseUsdToCents(draft.dailyBudgetUsd);
    const lifetimeBudgetCents = parseUsdToCents(draft.lifetimeBudgetUsd);
    if (walletBalanceCents < lifetimeBudgetCents) {
      setSaving(false);
      setError("Insufficient wallet funds. Add payment before submitting.");
      return;
    }

    try {
      const headers = await getPortalHeaders(user.email);
      const created = await apiRequest<{ id: string }>(
        "/advertiser/campaigns",
        {
          method: "POST",
          body: JSON.stringify({
            title: draft.title,
            description: draft.description,
            ctaText: draft.ctaText,
            clickUrl: draft.clickUrl,
            topics: draft.topics
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
            format: draft.format,
            weight: Number(draft.weight || "1"),
          }),
        },
        headers,
      );

      if (created?.id) {
        setCampaignBudgets((prev) => ({
          ...prev,
          [created.id]: {
            dailyBudgetCents,
            lifetimeBudgetCents,
          },
        }));
      }

      setWalletBalanceCents((prev) => Math.max(0, prev - lifetimeBudgetCents));
      setNotice("Ad submitted for review. Budget reserved from wallet.");
      closeWizard();
      await loadDashboard(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit campaign");
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
      setNotice(nextLiveState ? "Campaign is now live." : "Campaign moved back to review.");
      await loadDashboard(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update campaign");
    } finally {
      setSaving(false);
    }
  };

  const saveCampaignEdits = async () => {
    if (!user?.email || !editingCampaignId) return;
    setSaving(true);
    setError("");
    setNotice("");

    const weight = Number(editDraft.weight || "1");
    if (!Number.isFinite(weight) || weight < 1 || weight > 100) {
      setSaving(false);
      setError("Weight must be between 1 and 100.");
      return;
    }
    if (!isHttpUrl(editDraft.clickUrl)) {
      setSaving(false);
      setError("Click URL must start with http:// or https://.");
      return;
    }

    const dailyBudgetCents = parseUsdToCents(editDraft.dailyBudgetUsd);
    const lifetimeBudgetCents = parseUsdToCents(editDraft.lifetimeBudgetUsd);
    if (dailyBudgetCents <= 0 || lifetimeBudgetCents <= 0 || dailyBudgetCents > lifetimeBudgetCents) {
      setSaving(false);
      setError("Please set valid daily/lifetime budgets.");
      return;
    }

    try {
      const headers = await getPortalHeaders(user.email);
      await apiRequest(
        `/advertiser/campaigns/${editingCampaignId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editDraft.title,
            description: editDraft.description,
            ctaText: editDraft.ctaText,
            clickUrl: editDraft.clickUrl,
            topics: editDraft.topics
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
            format: editDraft.format,
            weight,
          }),
        },
        headers,
      );

      setCampaignBudgets((prev) => ({
        ...prev,
        [editingCampaignId]: {
          dailyBudgetCents,
          lifetimeBudgetCents,
        },
      }));
      setNotice("Campaign updated.");
      closeEditCampaign();
      await loadDashboard(user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update campaign");
    } finally {
      setSaving(false);
    }
  };

  const previewImageUrl = uploadedPreviewUrl;
  const pendingBudgetCents = parseUsdToCents(draft.lifetimeBudgetUsd);

  const summaryCards = useMemo(() => {
    if (!data) {
      return [
        { label: "Spend Today", value: "--" },
        { label: "Active Campaigns", value: "--" },
        { label: "Pending Review", value: "--" },
        { label: "CTR (7d)", value: "--" },
        { label: "Wallet", value: formatCurrency(walletBalanceCents) },
      ];
    }
    return [
      { label: "Spend Today", value: formatCurrency(data.summary.spendTodayCents) },
      { label: "Active Campaigns", value: String(data.summary.activeCampaigns) },
      { label: "Pending Review", value: String(data.summary.pendingReview) },
      { label: "CTR (7d)", value: `${data.summary.ctr7d.toFixed(2)}%` },
      { label: "Wallet", value: formatCurrency(walletBalanceCents) },
    ];
  }, [data, walletBalanceCents]);

  return (
    <PortalShell title="Advertiser Portal" subtitle="Dashboard, campaign performance, and guided ad submission.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold">Campaign Performance</CardTitle>
            <Button variant="primary" onClick={openWizard}>
              Create New Ad
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading campaigns...</p>}
            {!loading && !error && (
              <div className="space-y-2">
                {(data?.campaigns || []).map((campaign) => {
                  const budget = campaignBudgets[campaign.id];
                  const details = campaignRecords[campaign.id];
                  const estimatedConversions = Math.round(campaign.clicks7d * 0.12);
                  return (
                    <div key={campaign.id} className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{campaign.title}</p>
                        <Badge variant={campaign.status === "Live" ? "default" : "secondary"}>{campaign.status}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-5">
                        <p>Impressions: {campaign.impressions7d}</p>
                        <p>Clicks: {campaign.clicks7d}</p>
                        <p>Spend: {formatCurrency(campaign.spend7dCents)}</p>
                        <p>CTR: {campaign.ctr7d.toFixed(2)}%</p>
                        <p>Conv (est.): {estimatedConversions}</p>
                      </div>
                      {details && (
                        <div className="mt-2 rounded-lg border border-border bg-card px-2 py-2 text-xs text-muted-foreground">
                          <p className="line-clamp-2">{details.description}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {details.topics.map((topic) => (
                              <span key={`${details.id}-${topic}`} className="rounded-full border border-border px-2 py-0.5">
                                {topic}
                              </span>
                            ))}
                          </div>
                          <a
                            href={details.clickUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            View destination
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      <div className="mt-2 rounded-lg border border-border bg-background px-2 py-2 text-xs text-muted-foreground">
                        {budget ? (
                          <>
                            Daily Budget: {formatCurrency(budget.dailyBudgetCents)} | Lifetime Budget:{" "}
                            {formatCurrency(budget.lifetimeBudgetCents)}
                          </>
                        ) : (
                          <>No budget allocation recorded for this campaign yet.</>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={campaign.status === "Live" ? "secondary" : "primary"}
                            disabled={saving}
                            onClick={() => void toggleCampaign(campaign.id, campaign.status !== "Live")}
                          >
                            {campaign.status === "Live" ? "Move to Review" : "Go Live"}
                          </Button>
                          <Button size="sm" variant="secondary" disabled={saving || !details} onClick={() => openEditCampaign(campaign.id)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!data?.campaigns?.length && <p className="text-sm text-muted-foreground">No campaigns yet.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Billing Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Wallet Balance</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(walletBalanceCents)}</p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Campaign budgets are reserved from wallet at submission time.
            </p>
          </CardContent>
        </Card>
      </div>

      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={closeWizard} aria-label="Close wizard backdrop" />
          <Card className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-xl font-bold">Create Ad - Step {wizardStep} of 3</CardTitle>
              <Button variant="secondary" onClick={closeWizard}>
                <X className="mr-1 h-4 w-4" />
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
            {wizardStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Step 1: Add ad information, media, and budget.</p>
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Daily budget ($)"
                    value={draft.dailyBudgetUsd}
                    onChange={(event) => setDraft((prev) => ({ ...prev, dailyBudgetUsd: event.target.value }))}
                  />
                  <Input
                    placeholder="Lifetime budget ($)"
                    value={draft.lifetimeBudgetUsd}
                    onChange={(event) => setDraft((prev) => ({ ...prev, lifetimeBudgetUsd: event.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={onDropFile}
                  className={`w-full rounded-xl border-2 border-dashed p-4 text-left transition ${
                    dragActive ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  <div className="flex items-center gap-3">
                    <UploadCloud className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Drag image here or click to upload</p>
                      <p className="text-xs text-muted-foreground">Uploaded image is used for preview in this flow.</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Step 2: Review how your ad will appear.</p>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ImagePlus className="h-4 w-4 text-primary" />
                    Ad Preview
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    {previewImageUrl ? (
                      <img src={previewImageUrl} alt="Ad preview" className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">No image selected</div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-semibold">{draft.title || "Campaign title preview"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {draft.description || "Campaign description preview appears here."}
                      </p>
                      <button
                        type="button"
                        className="mt-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                      >
                        {draft.ctaText || "Call to action"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Step 3: Pay and submit for review.</p>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Required Reserved Budget</p>
                  <p className="mt-1 text-xl font-bold">{formatCurrency(pendingBudgetCents)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Current wallet: {formatCurrency(walletBalanceCents)}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment Method
                  </p>
                  <div className="space-y-2">
                    <Input
                      placeholder="Cardholder name"
                      value={paymentDraft.cardholder}
                      onChange={(event) => setPaymentDraft((prev) => ({ ...prev, cardholder: event.target.value }))}
                    />
                    <Input
                      placeholder="Card number"
                      value={paymentDraft.cardNumber}
                      onChange={(event) => setPaymentDraft((prev) => ({ ...prev, cardNumber: event.target.value }))}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="MM/YY"
                        value={paymentDraft.expiry}
                        onChange={(event) => setPaymentDraft((prev) => ({ ...prev, expiry: event.target.value }))}
                      />
                      <Input
                        placeholder="CVC"
                        value={paymentDraft.cvc}
                        onChange={(event) => setPaymentDraft((prev) => ({ ...prev, cvc: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Top-up amount ($)"
                    value={topUpAmountUsd}
                    onChange={(event) => setTopUpAmountUsd(event.target.value)}
                  />
                  <Button variant="secondary" onClick={topUpWallet} disabled={saving}>
                    Pay & Add Funds
                  </Button>
                </div>
              </div>
            )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button variant="secondary" onClick={() => moveStep("back")} disabled={wizardStep === 1 || saving}>
                  Back
                </Button>
                {wizardStep < 3 ? (
                  <Button variant="primary" onClick={() => moveStep("next")} disabled={saving}>
                    Next
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => void submitCampaignForReview()} disabled={saving}>
                    {saving ? "Submitting..." : "Submit for Review"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editingCampaignId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={closeEditCampaign} aria-label="Close edit backdrop" />
          <Card className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-xl font-bold">Edit Campaign</CardTitle>
              <Button variant="secondary" onClick={closeEditCampaign}>
                <X className="mr-1 h-4 w-4" />
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Title"
                value={editDraft.title}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, title: event.target.value }))}
              />
              <Input
                placeholder="Description"
                value={editDraft.description}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, description: event.target.value }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="CTA text"
                  value={editDraft.ctaText}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, ctaText: event.target.value }))}
                />
                <Input
                  placeholder="Click URL"
                  value={editDraft.clickUrl}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, clickUrl: event.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <Input
                  placeholder="Topics (comma separated)"
                  value={editDraft.topics}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, topics: event.target.value }))}
                />
                <select
                  className="h-10 rounded-full border border-border bg-background px-4 text-sm"
                  value={editDraft.format}
                  onChange={(event) =>
                    setEditDraft((prev) => ({ ...prev, format: event.target.value as AdvertiserCampaignDraft["format"] }))
                  }
                >
                  <option value="card">Card</option>
                  <option value="text">Text</option>
                  <option value="banner">Banner</option>
                </select>
                <Input
                  className="w-24"
                  placeholder="Weight"
                  value={editDraft.weight}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, weight: event.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Daily budget ($)"
                  value={editDraft.dailyBudgetUsd}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, dailyBudgetUsd: event.target.value }))}
                />
                <Input
                  placeholder="Lifetime budget ($)"
                  value={editDraft.lifetimeBudgetUsd}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, lifetimeBudgetUsd: event.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={closeEditCampaign} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => void saveCampaignEdits()} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PortalShell>
  );
};

export default AdvertiserPortal;
