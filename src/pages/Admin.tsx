import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import SiteShell from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";

interface AdminOverview {
  totalAds: number;
  activeAds: number;
  totalEvents: number;
  totalLeads: number;
}

interface AdminAd {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  advertiser: string;
  imageUrl?: string | null;
  topics: string[];
  format: "text" | "card" | "banner";
  isActive: boolean;
  weight: number;
  updatedAt: string;
}

interface AdminEvent {
  id: string;
  eventType: "impression" | "click" | "revenue";
  botId: string;
  userId?: string | null;
  createdAt: string;
  ad?: { id: string; title: string; advertiser: string } | null;
}

interface AdminLead {
  id: string;
  role: "publisher" | "advertiser" | "demo" | "general";
  name: string;
  email: string;
  company?: string | null;
  source?: string | null;
  createdAt: string;
}

interface AdDraft {
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  advertiser: string;
  imageUrl: string;
  topics: string;
  format: "text" | "card" | "banner";
  weight: string;
}

const emptyDraft: AdDraft = {
  title: "",
  description: "",
  ctaText: "",
  clickUrl: "",
  advertiser: "",
  imageUrl: "",
  topics: "ai, ads",
  format: "card",
  weight: "1",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const Admin = () => {
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [draft, setDraft] = useState<AdDraft>(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const requestHeaders = useMemo(
    () => (adminKey ? { "x-admin-key": adminKey } : undefined),
    [adminKey],
  );

  const loadData = useCallback(async () => {
    if (!requestHeaders) return;
    setLoading(true);
    setError("");
    try {
      const [overviewData, adData, eventData, leadData] = await Promise.all([
        apiRequest<AdminOverview>("/admin/overview", undefined, requestHeaders),
        apiRequest<AdminAd[]>("/admin/ads", undefined, requestHeaders),
        apiRequest<AdminEvent[]>("/admin/events?limit=80", undefined, requestHeaders),
        apiRequest<AdminLead[]>("/admin/leads", undefined, requestHeaders),
      ]);
      setOverview(overviewData);
      setAds(adData);
      setEvents(eventData);
      setLeads(leadData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load admin data";
      setError(message);
      if (message.toLowerCase().includes("unauthorized")) {
        setAdminKey("");
      }
    } finally {
      setLoading(false);
    }
  }, [requestHeaders]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const unlockAdmin = async (event: FormEvent) => {
    event.preventDefault();
    if (!adminKeyInput.trim()) {
      setError("Enter admin key first.");
      return;
    }
    setAdminKey(adminKeyInput.trim());
  };

  const createAd = async (event: FormEvent) => {
    event.preventDefault();
    if (!requestHeaders) return;
    setError("");
    setNotice("");
    try {
      await apiRequest(
        "/admin/ads",
        {
          method: "POST",
          body: JSON.stringify({
            title: draft.title,
            description: draft.description,
            ctaText: draft.ctaText,
            clickUrl: draft.clickUrl,
            advertiser: draft.advertiser,
            imageUrl: draft.imageUrl || undefined,
            topics: draft.topics
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
            format: draft.format,
            isActive: true,
            weight: Number(draft.weight || 1),
          }),
        },
        requestHeaders,
      );
      setDraft(emptyDraft);
      setNotice("Ad created.");
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ad");
    }
  };

  const toggleAd = async (ad: AdminAd) => {
    if (!requestHeaders) return;
    setError("");
    try {
      await apiRequest(
        `/admin/ads/${ad.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: !ad.isActive }),
        },
        requestHeaders,
      );
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ad");
    }
  };

  return (
    <SiteShell>
      <section className="relative overflow-hidden px-4 pb-16 pt-36 md:pb-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 grid-pattern opacity-60" />
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
        </div>
        <div className="relative mx-auto max-w-6xl space-y-6">
          <header className="rounded-3xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-xl md:p-8">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Admin</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Campaign Control Panel</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
              Manage ad inventory, verify SDK events, and review inbound leads from one local dashboard.
            </p>
          </header>

          {!adminKey && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Unlock Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={unlockAdmin} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="password"
                    value={adminKeyInput}
                    onChange={(event) => setAdminKeyInput(event.target.value)}
                    placeholder="Enter ADMIN_API_KEY"
                    className="h-11"
                  />
                  <Button type="submit" variant="hero" className="h-11 px-6">
                    Unlock
                  </Button>
                </form>
                <p className="mt-3 text-xs text-muted-foreground">
                  Use the `ADMIN_API_KEY` value from your local <code>server/.env</code>.
                </p>
              </CardContent>
            </Card>
          )}

          {adminKey && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="hero" onClick={() => void loadData()} disabled={loading}>
                  {loading ? "Refreshing..." : "Refresh Data"}
                </Button>
                <Button
                  type="button"
                  variant="hero-outline"
                  onClick={() => {
                    setAdminKey("");
                    setAdminKeyInput("");
                  }}
                >
                  Lock Panel
                </Button>
              </div>

              {overview && (
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    { label: "Total Ads", value: overview.totalAds },
                    { label: "Active Ads", value: overview.activeAds },
                    { label: "Tracked Events", value: overview.totalEvents },
                    { label: "Inbound Leads", value: overview.totalLeads },
                  ].map((item) => (
                    <Card key={item.label}>
                      <CardContent className="p-5">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
                        <p className="mt-2 text-3xl font-bold">{item.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Create Ad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-3" onSubmit={createAd}>
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
                          placeholder="CTA Text"
                          value={draft.ctaText}
                          onChange={(event) => setDraft((prev) => ({ ...prev, ctaText: event.target.value }))}
                        />
                        <Input
                          placeholder="Advertiser"
                          value={draft.advertiser}
                          onChange={(event) => setDraft((prev) => ({ ...prev, advertiser: event.target.value }))}
                        />
                      </div>
                      <Input
                        placeholder="Click URL"
                        value={draft.clickUrl}
                        onChange={(event) => setDraft((prev) => ({ ...prev, clickUrl: event.target.value }))}
                      />
                      <Input
                        placeholder="Image URL (optional)"
                        value={draft.imageUrl}
                        onChange={(event) => setDraft((prev) => ({ ...prev, imageUrl: event.target.value }))}
                      />
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
                            setDraft((prev) => ({
                              ...prev,
                              format: event.target.value as AdDraft["format"],
                            }))
                          }
                        >
                          <option value="card">Card</option>
                          <option value="text">Text</option>
                          <option value="banner">Banner</option>
                        </select>
                        <Input
                          placeholder="Weight"
                          className="w-24"
                          value={draft.weight}
                          onChange={(event) => setDraft((prev) => ({ ...prev, weight: event.target.value }))}
                        />
                      </div>
                      <Button type="submit" variant="hero" className="w-full">
                        Save Ad
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Ad Inventory</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {ads.map((ad) => (
                      <article key={ad.id} className="rounded-2xl border border-border/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{ad.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{ad.advertiser}</p>
                          </div>
                          <Button
                            type="button"
                            variant={ad.isActive ? "hero-outline" : "hero"}
                            size="sm"
                            onClick={() => void toggleAd(ad)}
                          >
                            {ad.isActive ? "Disable" : "Enable"}
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{ad.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {ad.topics.map((topic) => (
                            <span key={topic} className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                    {ads.length === 0 && <p className="text-sm text-muted-foreground">No ads in inventory yet.</p>}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Recent SDK Events</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[400px] overflow-y-auto">
                    <ul className="space-y-3">
                      {events.map((event) => (
                        <li key={event.id} className="rounded-xl border border-border/70 p-3 text-sm">
                          <p className="font-semibold capitalize">{event.eventType}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.ad?.title || "Unknown ad"} • {event.botId} • {formatDate(event.createdAt)}
                          </p>
                        </li>
                      ))}
                      {events.length === 0 && <li className="text-sm text-muted-foreground">No events yet.</li>}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Recent Leads</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[400px] overflow-y-auto">
                    <ul className="space-y-3">
                      {leads.map((lead) => (
                        <li key={lead.id} className="rounded-xl border border-border/70 p-3 text-sm">
                          <p className="font-semibold">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.email} • {lead.role} • {formatDate(lead.createdAt)}
                          </p>
                        </li>
                      ))}
                      {leads.length === 0 && <li className="text-sm text-muted-foreground">No leads yet.</li>}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {error && <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {notice && <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
        </div>
      </section>
    </SiteShell>
  );
};

export default Admin;
