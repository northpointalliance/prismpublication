import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { routeForRole, WorkspaceKind, WorkspaceOption } from "@/lib/portal-auth";
import { Building2, Bot, ArrowRight } from "lucide-react";
import { useState } from "react";

const ChooseWorkspace = () => {
  const navigate = useNavigate();
  const { user, loading, workspaces, selectWorkspace, createWorkspace, currentWorkspaceId } = usePortalAuth();
  const [submitting, setSubmitting] = useState<WorkspaceKind | "select" | null>(null);
  const [error, setError] = useState("");

  if (!loading && !user) {
    return <Navigate to="/app/login" replace />;
  }

  const onSelect = async (workspace: WorkspaceOption) => {
    setSubmitting("select");
    setError("");
    try {
      await selectWorkspace(workspace.id);
      navigate(routeForRole(workspace.role), { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to switch workspace";
      setError(message);
    } finally {
      setSubmitting(null);
    }
  };

  const createFirstWorkspace = async (type: WorkspaceKind) => {
    setSubmitting(type);
    setError("");
    try {
      await createWorkspace(type);
      navigate(type === "advertiser" ? "/app/advertiser" : "/app/publisher", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create workspace";
      setError(message);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-65" />
        <div className="absolute left-1/2 top-[10%] h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-4xl">
        <header className="mb-6 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Workspace</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            {workspaces.length ? "Choose Your Workspace" : "Create Your First Workspace"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {user?.email}. {workspaces.length ? "Pick a portal to enter." : "Pick your role to continue."}
          </p>
        </header>

        {error && (
          <Card className="mb-4 border-red-200 bg-red-50/80">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {workspaces.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.id}
                className={`border-border/80 bg-card/90 shadow-sm ${
                  currentWorkspaceId === workspace.id ? "ring-2 ring-primary/40" : ""
                }`}
              >
                <CardHeader>
                  <p className="text-xs font-mono uppercase tracking-[0.14em] text-primary">{workspace.role}</p>
                  <CardTitle className="text-2xl font-bold">{workspace.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">{workspace.description}</p>
                  <Button
                    variant="hero"
                    className="w-full"
                    disabled={submitting !== null}
                    onClick={() => void onSelect(workspace)}
                  >
                    {submitting === "select" ? "Opening..." : `Open ${workspace.title}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/80 bg-card/90 shadow-sm">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-mono uppercase tracking-[0.14em] text-primary">Demand Side</p>
                <CardTitle className="text-2xl font-bold">Advertiser Workspace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Launch campaigns, upload creatives, manage budgets, and review results.
                </p>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={submitting !== null}
                  onClick={() => void createFirstWorkspace("advertiser")}
                >
                  {submitting === "advertiser" ? "Creating..." : "Continue as Advertiser"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/90 shadow-sm">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-mono uppercase tracking-[0.14em] text-primary">Supply Side</p>
                <CardTitle className="text-2xl font-bold">Bot Developer Workspace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Register bots, configure SDK settings, and monitor monetization health.
                </p>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={submitting !== null}
                  onClick={() => void createFirstWorkspace("publisher")}
                >
                  {submitting === "publisher" ? "Creating..." : "Continue as Bot Developer"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChooseWorkspace;
