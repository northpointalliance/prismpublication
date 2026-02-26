import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AdvertiserPortal = () => {
  return (
    <PortalShell
      title="Advertiser Portal"
      subtitle="Campaigns, creatives, budget controls, and performance."
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active Campaigns", value: "0" },
          { label: "Pending Review", value: "0" },
          { label: "Spend (Today)", value: "$0.00" },
          { label: "CTR (7d)", value: "0.00%" },
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
            <CardTitle className="text-xl font-bold">Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create campaign drafts, attach creative formats, and submit to moderation.
            </p>
            <Button className="mt-4" variant="hero">
              New Campaign
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Budget and Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure daily and total caps, then review spend and transaction history.
            </p>
            <Button className="mt-4" variant="hero-outline">
              Open Billing
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
};

export default AdvertiserPortal;
