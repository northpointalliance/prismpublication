import { Link, Navigate, useNavigate } from "react-router-dom";
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

  const createNewWorkspace = async (type: WorkspaceKind) => {
    setSubmitting(type);
    setError("");
    try {
      await createWorkspace(type);
      navigate(routeForRole(type), { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create workspace";
      setError(message);
    } finally {
      setSubmitting(null);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/app/login");
  };

  const creationOptions: Array<{
    type: WorkspaceKind;
    title: string;
    subtitle: string;
    description: string;
    icon: typeof Building2;
    hoverClass: string;
  }> = [
    {
      type: "advertiser",
      title: "Advertiser Workspace",
      subtitle: "Demand Side",
      description: "Launch campaigns, upload creatives, manage budgets, and review results.",
      icon: Building2,
      hoverClass:
        "border-red-200 bg-red-50/40 hover:border-red-400 hover:bg-red-100 text-red-700",
    },
    {
      type: "publisher",
      title: "Bot Developer Workspace",
      subtitle: "Supply Side",
      description: "Register bots, configure SDK settings, and monitor monetization health.",
      icon: Bot,
      hoverClass:
        "border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-100 text-blue-700",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-65" />
        <div className="absolute left-1/2 top-[10%] h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">
            Back to Website
          </Link>
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Go Back
          </button>
        </div>

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
          <div className="space-y-5">
            <div className="mx-auto grid w-full max-w-3xl gap-4 md:grid-cols-2">
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
                      variant="primary"
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
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-3xl gap-4 md:grid-cols-2">
            {creationOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  type="button"
                  disabled={submitting !== null}
                  onClick={() => void createNewWorkspace(option.type)}
                  className={`group rounded-2xl border p-5 text-left transition-all duration-200 ${option.hoverClass} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em]">{option.subtitle}</p>
                  <h3 className="mt-1 text-2xl font-bold text-foreground">{option.title}</h3>
                  <p className="mt-2 text-sm text-foreground/80">{option.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                    {submitting === option.type ? "Creating..." : "Continue"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChooseWorkspace;
