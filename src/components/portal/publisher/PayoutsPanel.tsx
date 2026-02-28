import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";

interface PayoutItem {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
}

interface PayoutData {
  totalEarnedCents: number;
  totalPaidCents: number;
  availableCents: number;
  paypalEmail: string | null;
  recentPayouts: PayoutItem[];
}

interface Props {
  payoutData: PayoutData | null;
  paypalEmailDraft: string;
  savingEmail: boolean;
  withdrawing: boolean;
  formatCurrency: (cents: number) => string;
  onEmailChange: (v: string) => void;
  onSaveEmail: () => void;
  onWithdraw: () => void;
}

const PayoutsPanel = ({
  payoutData, paypalEmailDraft, savingEmail, withdrawing,
  formatCurrency, onEmailChange, onSaveEmail, onWithdraw,
}: Props) => (
  <Card className="border-border/80 bg-card/95">
    <CardHeader>
      <CardTitle className="text-xl font-bold">Payouts</CardTitle>
      <p className="text-sm text-muted-foreground">Withdraw your earnings via PayPal.</p>
    </CardHeader>
    <CardContent className="space-y-3">
      {payoutData && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: "Total Earned", value: formatCurrency(payoutData.totalEarnedCents) },
            { label: "Total Paid Out", value: formatCurrency(payoutData.totalPaidCents) },
            { label: "Available Now", value: formatCurrency(payoutData.availableCents), highlight: true },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`rounded-lg border px-2 py-2 ${highlight ? "border-emerald-200 bg-emerald-50/60" : "border-border bg-card"}`}>
              <p className="uppercase tracking-[0.07em] text-muted-foreground">{label}</p>
              <p className={`mt-1 font-semibold ${highlight ? "text-emerald-700" : "text-foreground"}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="pp-email">Your PayPal email</Label>
        <Input
          id="pp-email"
          type="email"
          placeholder="you@paypal.com"
          value={paypalEmailDraft}
          onChange={(e) => onEmailChange(e.target.value)}
        />
        <Button size="sm" variant="secondary" disabled={savingEmail || !paypalEmailDraft.trim()} onClick={onSaveEmail}>
          {savingEmail ? "Saving…" : "Save Email"}
        </Button>
      </div>

      <Button
        className="w-full"
        variant="primary"
        disabled={withdrawing || !payoutData?.paypalEmail || (payoutData?.availableCents ?? 0) < 100}
        onClick={onWithdraw}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {withdrawing ? "Processing…" : `Withdraw ${payoutData ? formatCurrency(payoutData.availableCents) : ""}`}
      </Button>
      {!payoutData?.paypalEmail && (
        <p className="text-center text-xs text-muted-foreground">Save your PayPal email to enable withdrawals.</p>
      )}

      {(payoutData?.recentPayouts?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent Payouts</p>
          {payoutData!.recentPayouts.slice(0, 4).map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                p.status === "paid" ? "bg-emerald-100 text-emerald-800" :
                p.status === "processing" ? "bg-sky-100 text-sky-800" :
                p.status === "failed" ? "bg-red-100 text-red-800" :
                "bg-muted text-muted-foreground"}`}>{p.status}</span>
              <span className="font-semibold text-foreground">{formatCurrency(p.amountCents)}</span>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default PayoutsPanel;
