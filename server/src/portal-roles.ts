import type { OrganizationMemberRole, OrganizationType } from "@prisma/client";

type PortalRole = "advertiser" | "publisher" | "admin";

const ADMIN_ROLES: Set<string> = new Set<string>(["reviewer", "admin", "super_admin"]);

const ROLE_PRIORITY: Record<OrganizationMemberRole, number> = {
  super_admin: 100,
  admin: 90,
  reviewer: 80,
  advertiser_owner: 70,
  advertiser_finance: 60,
  advertiser_member: 50,
  publisher_owner: 40,
  publisher_ops: 30,
  publisher_dev: 20,
};

export const mapMembershipRoleToPortalRole = (role: string = ""): PortalRole | null => {
  if (role.startsWith("advertiser_")) return "advertiser";
  if (role.startsWith("publisher_")) return "publisher";
  if (ADMIN_ROLES.has(role)) return "admin";
  return null;
};

export const isAdminMembershipRole = (role: string = ""): boolean => ADMIN_ROLES.has(role);

export const isRoleCompatibleWithOrganizationType = (role: string = "", organizationType: string = ""): boolean => {
  const portalRole = mapMembershipRoleToPortalRole(role);
  if (!portalRole) return false;
  return portalRole === organizationType;
};

export const getMembershipRolePriority = (role: string = ""): number =>
  ROLE_PRIORITY[role as OrganizationMemberRole] || 0;
