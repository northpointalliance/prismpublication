import { ChangeEvent, DragEvent, RefObject } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ImagePlus, UploadCloud, X } from "lucide-react";
import AdPreview from "@/components/AdPreview";

type WizardStep = 1 | 2 | 3;
const WIZARD_STEPS = ["Campaign Info", "Creative Preview", "Budget & Launch"] as const;

interface CampaignInfoDraft {
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  topics: string;
  format: "text" | "card" | "banner";
  weight: string;
}

interface Props {
  wizardStep: WizardStep;
  infoDraft: CampaignInfoDraft;
  wizardDailyUsd: string;
  wizardDurationDays: string;
  wizardDailyBudgetCents: number;
  wizardDays: number;
  wizardTotalBudgetCents: number;
  walletBalanceCents: number;
  dragActive: boolean;
  uploadedPreviewUrl: string | null;
  saving: boolean;
  error: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  formatCurrency: (cents: number) => string;
  onInfoChange: (patch: Partial<CampaignInfoDraft>) => void;
  onDailyUsdChange: (v: string) => void;
  onDurationDaysChange: (v: string) => void;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: DragEvent<HTMLButtonElement>) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const StepIndicator = ({ current }: { current: WizardStep }) => (
  <div className="mb-6 flex items-center gap-2">
    {WIZARD_STEPS.map((label, i) => {
      const num = (i + 1) as WizardStep;
      const done = current > num;
      const active = current === num;
      return (
        <div key={label} className="flex flex-1 items-center gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : num}
            </span>
            <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
          {i < WIZARD_STEPS.length - 1 && (
            <div className={`h-px flex-1 ${done ? "bg-emerald-500" : "bg-border"}`} />
          )}
        </div>
      );
    })}
  </div>
);

// ── Campaign info fields ──────────────────────────────────────────────────────

const CampaignInfoFields = ({ draft, onChange }: {
  draft: CampaignInfoDraft;
  onChange: (patch: Partial<CampaignInfoDraft>) => void;
}) => (
  <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="ci-title">Ad title</Label>
        <Input id="ci-title" placeholder="Your ad headline" value={draft.title} onChange={(e) => onChange({ title: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ci-cta">CTA text</Label>
        <Input id="ci-cta" placeholder="Shop Now" value={draft.ctaText} onChange={(e) => onChange({ ctaText: e.target.value })} />
      </div>
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="ci-desc">Description</Label>
      <Input id="ci-desc" placeholder="Short supporting copy (1–2 sentences)" value={draft.description} onChange={(e) => onChange({ description: e.target.value })} />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="ci-url">Destination URL</Label>
      <Input id="ci-url" placeholder="https://example.com/campaign" value={draft.clickUrl} onChange={(e) => onChange({ clickUrl: e.target.value })} />
    </div>
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <div className="space-y-1.5">
        <Label htmlFor="ci-topics">Target topics</Label>
        <Input id="ci-topics" placeholder="ai, shopping, travel (comma separated)" value={draft.topics} onChange={(e) => onChange({ topics: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ci-format">Format</Label>
        <select
          id="ci-format"
          className="h-10 rounded-full border border-border bg-background px-4 text-sm"
          value={draft.format}
          onChange={(e) => onChange({ format: e.target.value as CampaignInfoDraft["format"] })}
        >
          <option value="card">Card</option>
          <option value="text">Text</option>
          <option value="banner">Banner</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ci-weight" title="How often this ad shows relative to others (1 = lowest, 100 = highest)">
          Weight
        </Label>
        <Input id="ci-weight" className="w-24" placeholder="1–100" value={draft.weight} onChange={(e) => onChange({ weight: e.target.value })} />
      </div>
    </div>
    <p className="text-xs text-muted-foreground">Weight controls display frequency relative to other active ads.</p>
  </div>
);

// ── Wizard ────────────────────────────────────────────────────────────────────

const CreateCampaignWizard = ({
  wizardStep, infoDraft, wizardDailyUsd, wizardDurationDays,
  wizardDailyBudgetCents, wizardDays, wizardTotalBudgetCents,
  walletBalanceCents, dragActive, uploadedPreviewUrl,
  saving, error, fileInputRef, formatCurrency,
  onInfoChange, onDailyUsdChange, onDurationDaysChange,
  onClose, onBack, onNext, onSubmit,
  onFileChange, onDrop, onDragOver, onDragLeave,
}: Props) => createPortal(
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close" />
    <Card className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-xl font-bold">Create New Ad</CardTitle>
        <Button variant="secondary" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent>
        <StepIndicator current={wizardStep} />

        {/* Step 1 */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            <CampaignInfoFields draft={infoDraft} onChange={onInfoChange} />
          </div>
        )}

        {/* Step 2 */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
              onDragLeave={(e) => { e.preventDefault(); onDragLeave(); }}
              onDrop={onDrop}
              className={`w-full rounded-xl border-2 border-dashed p-5 text-left transition ${dragActive ? "border-primary bg-primary/5" : "border-border bg-background"}`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              <div className="flex items-center gap-3">
                <UploadCloud className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Drag image here or click to upload</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF · up to 5 MB.</p>
                </div>
              </div>
            </button>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                  <ImagePlus className="h-4 w-4" />Ad Preview
                </p>
                <div className="flex gap-1">
                  {(["card", "banner", "text"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => onInfoChange({ format: f })}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition ${
                        infoDraft.format === f ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <AdPreview
                ad={{
                  title: infoDraft.title,
                  description: infoDraft.description,
                  ctaText: infoDraft.ctaText,
                  clickUrl: infoDraft.clickUrl,
                  imageUrl: uploadedPreviewUrl,
                }}
                format={infoDraft.format}
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {wizardStep === 3 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="w-daily">Daily budget ($)</Label>
                <Input id="w-daily" placeholder="50" value={wizardDailyUsd} onChange={(e) => onDailyUsdChange(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-days">Campaign duration (days)</Label>
                <Input id="w-days" placeholder="30" value={wizardDurationDays} onChange={(e) => onDurationDaysChange(e.target.value)} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Daily budget</span>
                <span className="font-semibold">{formatCurrency(wizardDailyBudgetCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-semibold">{wizardDays} days</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between">
                <span className="font-semibold text-foreground">Total commitment</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(wizardTotalBudgetCents)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Wallet balance</span>
                <span className={walletBalanceCents < wizardTotalBudgetCents ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>
                  {formatCurrency(walletBalanceCents)}
                </span>
              </div>
            </div>

            {walletBalanceCents < wizardTotalBudgetCents && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Insufficient funds. Add money via the Billing panel, then return here to submit.
              </p>
            )}
          </div>
        )}

        {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={onBack} disabled={wizardStep === 1 || saving}>Back</Button>
          {wizardStep < 3 ? (
            <Button variant="primary" onClick={onNext} disabled={saving}>Next →</Button>
          ) : (
            <Button variant="primary" onClick={onSubmit} disabled={saving || walletBalanceCents < wizardTotalBudgetCents}>
              {saving ? "Submitting…" : "Launch Campaign"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>,
  document.body,
);

export default CreateCampaignWizard;
