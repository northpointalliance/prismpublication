import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlatformSettings {
  platformFeePct: number;
}

interface Props {
  platformSettings: PlatformSettings | null;
  feeDraft: string;
  savingFee: boolean;
  onFeeDraftChange: (v: string) => void;
  onSave: () => void;
}

const PlatformFeeForm = ({ platformSettings, feeDraft, savingFee, onFeeDraftChange, onSave }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base font-semibold">Platform Fee</CardTitle>
      <p className="text-xs text-muted-foreground">Prism keeps this percentage. Publishers receive the rest.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={feeDraft}
            onChange={(e) => onFeeDraftChange(e.target.value)}
            className="pr-8"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
        </div>
        <Button variant="primary" disabled={savingFee} onClick={onSave}>
          {savingFee ? "Saving…" : "Save"}
        </Button>
      </div>

      {platformSettings && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">Prism keeps</p>
            <p className="mt-1 text-xl font-bold text-foreground">{platformSettings.platformFeePct}%</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Publisher gets</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{(100 - platformSettings.platformFeePct).toFixed(1)}%</p>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export default PlatformFeeForm;
