import { Link } from "react-router-dom";
import PortalShell from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AdminPortal = () => {
  return (
    <PortalShell
      title="Platform Admin Portal"
      subtitle="Global oversight for reviews, risk, finance, and operations."
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Campaigns Pending", value: "0" },
          { label: "Bot Reviews Pending", value: "0" },
          { label: "Risk Alerts", value: "0" },
          { label: "Incidents Open", value: "0" },
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
            <CardTitle className="text-xl font-bold">Moderation and Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review campaigns and bots, then enforce trust and policy decisions.
            </p>
            <Button className="mt-4" variant="hero">
              Open Review Queue
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Legacy Admin Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Existing campaign control panel is still available while the new admin app expands.
            </p>
            <Link to="/admin">
              <Button className="mt-4" variant="hero-outline">
                Open Existing Panel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
};

export default AdminPortal;
