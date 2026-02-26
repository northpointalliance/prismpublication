import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { routeForRole, WorkspaceOption } from "@/lib/portal-auth";

const ChooseWorkspace = () => {
  const navigate = useNavigate();
  const { user, loading, workspaces, selectWorkspace, currentWorkspaceId } = usePortalAuth();

  if (!loading && !user) {
    return <Navigate to="/app/login" replace />;
  }

  const onSelect = async (workspace: WorkspaceOption) => {
    await selectWorkspace(workspace.id);
    navigate(routeForRole(workspace.role), { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-60" />
        <div className="absolute left-1/2 top-[10%] h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-4xl">
        <header className="mb-6 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Workspace</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Choose Your Role</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {user.email}. Pick the portal you want to enter now.
          </p>
        </header>

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
                <Button variant="hero" className="w-full" onClick={() => void onSelect(workspace)}>
                  Open {workspace.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && workspaces.length === 0 && (
          <Card className="mt-4 border-border/80 bg-card/90">
            <CardContent className="p-4 text-sm text-muted-foreground">
              No workspaces were provisioned for this account yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChooseWorkspace;
