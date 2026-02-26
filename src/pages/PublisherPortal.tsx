import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PublisherPortal = () => {
  return (
    <PortalShell
      title="Bot Developer Portal"
      subtitle="Bots, SDK keys, placement policies, diagnostics, and monetization."
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Registered Bots", value: "0" },
          { label: "Fill Rate (7d)", value: "0.00%" },
          { label: "Revenue (Today)", value: "$0.00" },
          { label: "SDK Errors", value: "0" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Bot Registry</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Register bots and configure environments for dev, staging, and production.
            </p>
            <Button className="mt-4" variant="hero">
              Add Bot
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">SDK and Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate keys, set frequency rules, and monitor integration quality.
            </p>
            <Button className="mt-4" variant="hero-outline">
              Manage SDK
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
};

export default PublisherPortal;
