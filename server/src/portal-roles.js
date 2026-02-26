const ADMIN_ROLES = new Set(["reviewer", "admin", "super_admin"]);

export const mapMembershipRoleToPortalRole = (role = "") => {
  if (role.startsWith("advertiser_")) return "advertiser";
  if (role.startsWith("publisher_")) return "publisher";
  if (ADMIN_ROLES.has(role)) return "admin";
  return "admin";
};

export const isAdminMembershipRole = (role = "") => ADMIN_ROLES.has(role);
