import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/api";
import AdPreview, { AdFormat, AdPreviewData } from "@/components/AdPreview";

const FORMATS: AdFormat[] = ["card", "banner", "text"];

// Live "Try it": fetches a real ad from the public demo endpoint and renders it exactly as the SDK does.
const AdPreviewPanel = () => {
  const [format, setFormat] = useState<AdFormat>("card");
  const [topic, setTopic] = useState("");
  const [ad, setAd] = useState<AdPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false);

  const tryIt = async () => {
    setLoading(true); setError(""); setTried(true);
    try {
      const res = await apiRequest<{ success: boolean; data: AdPreviewData[] }>("/demo/ads", {
        method: "POST",
        body: JSON.stringify({ context: { topic: topic.trim() || undefined }, position: "inline", format }),
      });
      setAd(res.data?.[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch a preview ad");
      setAd(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Ad Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A live ad from the network, rendered exactly as the SDK&apos;s{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">PrismAdComponent</code> shows it inside your bot.
        </p>

        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>Format</Label>
            <div className="flex gap-1">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                    format === f ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-topic">Topic (optional)</Label>
            <Input id="ap-topic" placeholder="e.g. productivity, travel" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <Button variant="primary" onClick={() => void tryIt()} disabled={loading} className="gap-1.5">
            <Sparkles className="h-4 w-4" />{loading ? "Loading…" : "Try it"}
          </Button>
        </div>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="rounded-xl border border-dashed border-border bg-background p-4">
          {ad ? (
            <div className="mx-auto max-w-sm">
              <AdPreview ad={ad} format={format} />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loading
                ? "Fetching a live ad…"
                : tried
                  ? "No ads available for that request right now."
                  : "Pick a format and click “Try it” to see a live ad."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdPreviewPanel;
