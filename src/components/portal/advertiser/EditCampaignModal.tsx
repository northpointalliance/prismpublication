import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

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

interface Props {
  info: CampaignInfoDraft;
  budget: CampaignBudgetDraft;
  saving: boolean;
  error: string;
  onInfoChange: (patch: Partial<CampaignInfoDraft>) => void;
  onBudgetChange: (patch: Partial<CampaignBudgetDraft>) => void;
  onClose: () => void;
  onSave: () => void;
}

const EditCampaignModal = ({
  info, budget, saving, error,
  onInfoChange, onBudgetChange, onClose, onSave,
}: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
    <Card className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-xl font-bold">Edit Campaign</CardTitle>
        <Button variant="secondary" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info fields */}
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ef-title">Ad title</Label>
              <Input id="ef-title" placeholder="Your ad headline" value={info.title} onChange={(e) => onInfoChange({ title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-cta">CTA text</Label>
              <Input id="ef-cta" placeholder="Shop Now" value={info.ctaText} onChange={(e) => onInfoChange({ ctaText: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-desc">Description</Label>
            <Input id="ef-desc" placeholder="Short supporting copy (1–2 sentences)" value={info.description} onChange={(e) => onInfoChange({ description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-url">Destination URL</Label>
            <Input id="ef-url" placeholder="https://example.com/campaign" value={info.clickUrl} onChange={(e) => onInfoChange({ clickUrl: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="ef-topics">Target topics</Label>
              <Input id="ef-topics" placeholder="ai, shopping, travel (comma separated)" value={info.topics} onChange={(e) => onInfoChange({ topics: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-format">Format</Label>
              <select
                id="ef-format"
                className="h-10 rounded-full border border-border bg-background px-4 text-sm"
                value={info.format}
                onChange={(e) => onInfoChange({ format: e.target.value as CampaignInfoDraft["format"] })}
              >
                <option value="card">Card</option>
                <option value="text">Text</option>
                <option value="banner">Banner</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-weight" title="How often this ad shows relative to others (1 = lowest, 100 = highest)">Weight</Label>
              <Input id="ef-weight" className="w-24" placeholder="1–100" value={info.weight} onChange={(e) => onInfoChange({ weight: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Weight controls display frequency relative to other active ads.</p>
        </div>

        {/* Budget fields */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Budget</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ef-daily">Daily budget ($)</Label>
              <Input id="ef-daily" placeholder="50" value={budget.dailyBudgetUsd} onChange={(e) => onBudgetChange({ dailyBudgetUsd: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-lifetime">Lifetime budget ($)</Label>
              <Input id="ef-lifetime" placeholder="500" value={budget.lifetimeBudgetUsd} onChange={(e) => onBudgetChange({ lifetimeBudgetUsd: e.target.value })} />
            </div>
          </div>
        </div>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default EditCampaignModal;
