import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";

type Environment = "development" | "staging" | "production";

interface Props {
  botName: string;
  botEnvironment: Environment;
  saving: boolean;
  latestToken: { botId: string; token: string } | null;
  onNameChange: (v: string) => void;
  onEnvironmentChange: (v: Environment) => void;
  onCreate: () => void;
  onCopyToken: (token: string, label: string) => void;
}

const RegisterBotPanel = ({
  botName, botEnvironment, saving, latestToken,
  onNameChange, onEnvironmentChange, onCreate, onCopyToken,
}: Props) => (
  <div className="space-y-4">
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Register Bot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="bot-name">Bot name</Label>
          <Input id="bot-name" placeholder="My Assistant" value={botName} onChange={(e) => onNameChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bot-env">Environment</Label>
          <select
            id="bot-env"
            className="h-10 w-full rounded-full border border-border bg-background px-4 text-sm"
            value={botEnvironment}
            onChange={(e) => onEnvironmentChange(e.target.value as Environment)}
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
        <Button className="w-full" variant="primary" disabled={saving || !botName.trim()} onClick={onCreate}>
          {saving ? "Saving…" : "Add Bot"}
        </Button>
        <p className="text-xs text-muted-foreground">A primary SDK key is generated automatically on creation.</p>
      </CardContent>
    </Card>

    {latestToken && (
      <Card className="border-emerald-200 bg-emerald-50/60">
        <CardHeader>
          <CardTitle className="text-base font-bold text-emerald-800">New SDK Token</CardTitle>
          <p className="text-xs text-emerald-700">Shown once — copy it now.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-emerald-800">
            Bot: <span className="font-semibold font-mono">{latestToken.botId}</span>
          </p>
          <p className="break-all rounded-lg border border-emerald-200 bg-white/80 px-2.5 py-2 font-mono text-xs text-emerald-900">
            {latestToken.token}
          </p>
          <Button size="sm" variant="secondary" onClick={() => onCopyToken(latestToken.token, `token for ${latestToken.botId}`)}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />Copy Token
          </Button>
        </CardContent>
      </Card>
    )}

    <Card className="border-border/80 bg-card/95">
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Security:</strong> Store SDK tokens in server-side secrets only. Full tokens are shown once on key creation or rotation.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default RegisterBotPanel;
