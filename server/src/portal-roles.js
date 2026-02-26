const ADMIN_ROLES = new Set(["reviewer", "admin", "super_admin"]);
const ROLE_PRIORITY = {
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

export const mapMembershipRoleToPortalRole = (role = "") => {
  if (role.startsWith("advertiser_")) return "advertiser";
  if (role.startsWith("publisher_")) return "publisher";
  if (ADMIN_ROLES.has(role)) return "admin";
  return null;
};

export const isAdminMembershipRole = (role = "") => ADMIN_ROLES.has(role);

export const isRoleCompatibleWithOrganizationType = (role = "", organizationType = "") => {
  const portalRole = mapMembershipRoleToPortalRole(role);
  if (!portalRole) return false;
  return portalRole === organizationType;
};

export const getMembershipRolePriority = (role = "") => ROLE_PRIORITY[role] || 0;
