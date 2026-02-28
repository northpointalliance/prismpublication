import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PayPalButtons } from "@paypal/react-paypal-js";

interface WalletTransaction {
  id: string;
  type: "topup" | "spend" | "refund";
  amountCents: number;
  description?: string;
  createdAt: string;
}

interface Props {
  walletLoading: boolean;
  walletBalanceCents: number;
  topUpAmountUsd: string;
  transactions: WalletTransaction[];
  formatCurrency: (cents: number) => string;
  onTopUpAmountChange: (v: string) => void;
  createPayPalOrder: () => Promise<string>;
  onPayPalApprove: (data: { orderID: string }) => Promise<void>;
  onPayPalError: (err: unknown) => void;
}

const BillingPanel = ({
  walletLoading, walletBalanceCents, topUpAmountUsd, transactions,
  formatCurrency, onTopUpAmountChange, createPayPalOrder, onPayPalApprove, onPayPalError,
}: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl font-bold">Billing</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Wallet Balance</p>
        <p className="mt-1 text-3xl font-bold">
          {walletLoading ? "…" : formatCurrency(walletBalanceCents)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Budgets are reserved at campaign submission.</p>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">Add Funds via PayPal</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="b-amount">Amount ($)</Label>
            <Input
              id="b-amount"
              placeholder="250"
              value={topUpAmountUsd}
              onChange={(e) => onTopUpAmountChange(e.target.value)}
            />
          </div>
          <PayPalButtons
            style={{ layout: "vertical", color: "blue", shape: "pill", label: "pay" }}
            createOrder={createPayPalOrder}
            onApprove={onPayPalApprove}
            onError={onPayPalError}
          />
          <p className="text-center text-[11px] text-muted-foreground">
            Secured by PayPal · No card details stored on Prism
          </p>
        </div>
      </div>

      {transactions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Recent Transactions
          </p>
          <div className="space-y-1.5">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {tx.type === "topup" ? "↑ Top-up" : tx.type === "spend" ? "↓ Spend" : "↺ Refund"}
                  {tx.description ? ` · ${tx.description.slice(0, 32)}` : ""}
                </span>
                <span className={tx.type === "topup" ? "font-semibold text-emerald-600" : "font-semibold text-foreground"}>
                  {tx.type === "topup" ? "+" : "-"}{formatCurrency(tx.amountCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export default BillingPanel;
