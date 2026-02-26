export type PortalRole = "advertiser" | "publisher" | "admin";

export interface PortalUser {
  id: string;
  email: string;
  name: string;
}

export interface WorkspaceOption {
  id: string;
  orgId: string;
  role: PortalRole;
  title: string;
  description: string;
}

export type WorkspaceKind = "advertiser" | "publisher" | "admin";

export interface EntryContextResponse {
  user: PortalUser;
  workspaces: WorkspaceOption[];
  defaultWorkspaceId: string | null;
}

export const routeForRole = (role: PortalRole) => {
  if (role === "advertiser") return "/app/advertiser";
  if (role === "publisher") return "/app/publisher";
  return "/app/admin";
};
