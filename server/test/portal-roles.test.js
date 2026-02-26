import test from "node:test";
import assert from "node:assert/strict";
import { isAdminMembershipRole, mapMembershipRoleToPortalRole } from "../src/portal-roles.js";

test("mapMembershipRoleToPortalRole maps advertiser and publisher families", () => {
  assert.equal(mapMembershipRoleToPortalRole("advertiser_owner"), "advertiser");
  assert.equal(mapMembershipRoleToPortalRole("publisher_dev"), "publisher");
});

test("mapMembershipRoleToPortalRole maps admin role family", () => {
  assert.equal(mapMembershipRoleToPortalRole("reviewer"), "admin");
  assert.equal(mapMembershipRoleToPortalRole("admin"), "admin");
  assert.equal(mapMembershipRoleToPortalRole("super_admin"), "admin");
});

test("isAdminMembershipRole is true only for admin roles", () => {
  assert.equal(isAdminMembershipRole("reviewer"), true);
  assert.equal(isAdminMembershipRole("admin"), true);
  assert.equal(isAdminMembershipRole("super_admin"), true);
  assert.equal(isAdminMembershipRole("publisher_owner"), false);
});
