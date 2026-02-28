import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

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

interface Props {
  walletTxns: WalletTx[];
  payoutReqs: PayoutReq[];
  totalTopUp: number;
  totalPaidOut: number;
  financeTab: "payouts" | "topups";
  processingId: string | null;
  formatCurrency: (cents: number) => string;
  formatDate: (value: string) => string;
  onFinanceTabChange: (tab: "payouts" | "topups") => void;
  onProcessPayout: (id: string) => void;
  onMarkPaid: (id: string) => void;
}

const payoutStatusStyle: Record<PayoutReq["status"], string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-sky-100 text-sky-800 border-sky-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const FinancePanel = ({
  walletTxns, payoutReqs, totalTopUp, totalPaidOut, financeTab, processingId,
  formatCurrency, formatDate, onFinanceTabChange, onProcessPayout, onMarkPaid,
}: Props) => {
  const pendingPayouts = payoutReqs.filter((p) => p.status === "pending");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Advertiser top-ups", value: formatCurrency(totalTopUp), color: "text-foreground" },
          { label: "Paid to publishers", value: formatCurrency(totalPaidOut), color: "text-foreground" },
          { label: "Net platform revenue", value: formatCurrency(totalTopUp - totalPaidOut), color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
              <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              {financeTab === "payouts" ? "Publisher Payouts" : "Advertiser Top-Ups"}
              {pendingPayouts.length > 0 && financeTab === "payouts" && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {pendingPayouts.length} pending
                </span>
              )}
            </CardTitle>
            <div className="flex overflow-hidden rounded-lg border border-border text-xs">
              {(["payouts", "topups"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onFinanceTabChange(t)}
                  className={`px-3 py-1.5 font-medium transition-colors ${financeTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {t === "payouts" ? "Payouts" : "Top-Ups"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {financeTab === "payouts" && (
            <div className="space-y-3">
              {payoutReqs.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No payout requests yet.</p>}
              {payoutReqs.map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{p.organization.name}</p>
                      <p className="text-xs text-muted-foreground">{p.paypalEmail}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                      {p.paypalBatchId && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">Batch: {p.paypalBatchId}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xl font-bold">{formatCurrency(p.amountCents)}</p>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${payoutStatusStyle[p.status]}`}>{p.status}</span>
                      {p.status === "pending" && (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="primary" disabled={processingId === p.id} onClick={() => onProcessPayout(p.id)}>
                            {processingId === p.id ? "Sending…" : "Pay via PayPal"}
                          </Button>
                          <Button size="sm" variant="secondary" disabled={processingId === p.id} onClick={() => onMarkPaid(p.id)}>
                            Mark Paid
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {financeTab === "topups" && (
            <div className="space-y-2">
              {walletTxns.filter((t) => t.type === "topup").length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No top-ups recorded yet.</p>
              )}
              {walletTxns.filter((t) => t.type === "topup").map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{tx.organization.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className="font-semibold text-emerald-600">+{formatCurrency(tx.amountCents)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancePanel;
