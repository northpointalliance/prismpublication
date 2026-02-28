import { Navigate, Outlet } from "react-router-dom";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { PortalRole } from "@/lib/portal-auth";

export const RequirePortalLogin = () => {
  const { user, loading } = usePortalAuth();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/app/login" replace />;
  }
  return <Outlet />;
};

export const RequireWorkspaceSelection = () => {
  const { loading, currentWorkspaceId } = usePortalAuth();
  if (loading) return null;
  if (!currentWorkspaceId) {
    return <Navigate to="/app/choose-workspace" replace />;
  }
  return <Outlet />;
};

export const RequireWorkspaceRole = ({ role }: { role: PortalRole }) => {
  const { loading, currentRole } = usePortalAuth();
  if (loading) return null;
  if (currentRole !== role) {
    return <Navigate to="/app/choose-workspace" replace />;
  }
  return <Outlet />;
};

// Admin-specific guard: only checks that the user has an admin workspace membership.
// Does not require it to be the "selected" workspace, so /notadmin works as a direct URL.
export const RequireAdminAccess = () => {
  const { loading, workspaces } = usePortalAuth();
  if (loading) return null;
  if (!workspaces.some((w) => w.role === "admin")) {
    return <Navigate to="/app/login" replace />;
  }
  return <Outlet />;
};
