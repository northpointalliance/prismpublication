import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, XCircle } from "lucide-react";

interface PlatformSettings {
  platformFeePct: number;
  paypalMode: string;
  paypalEnabled: boolean;
  paypalClientIdMasked?: string | null;
  paypalFromDb?: boolean;
}

interface Props {
  platformSettings: PlatformSettings | null;
  ppClientId: string;
  ppClientSecret: string;
  ppMode: "sandbox" | "live";
  savingPaypal: boolean;
  onClientIdChange: (v: string) => void;
  onClientSecretChange: (v: string) => void;
  onModeChange: (v: "sandbox" | "live") => void;
  onSave: () => void;
}

const PayPalConfigForm = ({
  platformSettings, ppClientId, ppClientSecret, ppMode, savingPaypal,
  onClientIdChange, onClientSecretChange, onModeChange, onSave,
}: Props) => (
  <Card className="sm:col-span-2">
    <CardHeader>
      <div className="flex items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-semibold">PayPal Credentials</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stored securely in the database. Changes take effect immediately — no restart needed.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {platformSettings?.paypalEnabled ? (
            <><CheckCircle className="h-4 w-4 text-emerald-500" /><span className="text-emerald-700">Connected</span></>
          ) : (
            <><XCircle className="h-4 w-4 text-red-500" /><span className="text-red-700">Not configured</span></>
          )}
        </span>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {platformSettings?.paypalEnabled && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Mode</span>
            <Badge variant={platformSettings.paypalMode === "live" ? "default" : "secondary"}>
              {platformSettings.paypalMode}
            </Badge>
          </div>
          {platformSettings.paypalClientIdMasked && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Client ID</span>
              <code className="font-mono text-foreground">{platformSettings.paypalClientIdMasked}</code>
              {platformSettings.paypalFromDb && (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">DB</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Client ID</label>
          <Input
            placeholder={platformSettings?.paypalClientIdMasked ?? "Paste your PayPal Client ID"}
            value={ppClientId}
            onChange={(e) => onClientIdChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Client Secret
            {platformSettings?.paypalEnabled && (
              <span className="ml-1 text-muted-foreground/70">(leave blank to keep current)</span>
            )}
          </label>
          <Input
            type="password"
            placeholder="Paste your PayPal Client Secret"
            value={ppClientSecret}
            onChange={(e) => onClientSecretChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-lg border border-border text-xs">
          {(["sandbox", "live"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={`px-3 py-1.5 font-medium transition-colors capitalize ${ppMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <Button variant="primary" disabled={savingPaypal} onClick={onSave}>
          {savingPaypal ? "Saving…" : "Save PayPal Config"}
        </Button>
        <a
          href="https://developer.paypal.com/dashboard/applications"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />Get credentials
        </a>
      </div>
    </CardContent>
  </Card>
);

export default PayPalConfigForm;
