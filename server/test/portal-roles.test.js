import test from "node:test";
import assert from "node:assert/strict";
import {
  getMembershipRolePriority,
  isAdminMembershipRole,
  isRoleCompatibleWithOrganizationType,
  mapMembershipRoleToPortalRole,
} from "../src/portal-roles.js";

test("mapMembershipRoleToPortalRole maps advertiser and publisher families", () => {
  assert.equal(mapMembershipRoleToPortalRole("advertiser_owner"), "advertiser");
  assert.equal(mapMembershipRoleToPortalRole("publisher_dev"), "publisher");
});

test("mapMembershipRoleToPortalRole maps admin role family", () => {
  assert.equal(mapMembershipRoleToPortalRole("reviewer"), "admin");
  assert.equal(mapMembershipRoleToPortalRole("admin"), "admin");
  assert.equal(mapMembershipRoleToPortalRole("super_admin"), "admin");
});

test("mapMembershipRoleToPortalRole returns null for unknown roles", () => {
  assert.equal(mapMembershipRoleToPortalRole("unknown_role"), null);
  assert.equal(mapMembershipRoleToPortalRole(""), null);
});

test("isAdminMembershipRole is true only for admin roles", () => {
  assert.equal(isAdminMembershipRole("reviewer"), true);
  assert.equal(isAdminMembershipRole("admin"), true);
  assert.equal(isAdminMembershipRole("super_admin"), true);
  assert.equal(isAdminMembershipRole("publisher_owner"), false);
});

test("role compatibility follows organization type", () => {
  assert.equal(isRoleCompatibleWithOrganizationType("advertiser_owner", "advertiser"), true);
  assert.equal(isRoleCompatibleWithOrganizationType("publisher_dev", "publisher"), true);
  assert.equal(isRoleCompatibleWithOrganizationType("admin", "admin"), true);
  assert.equal(isRoleCompatibleWithOrganizationType("publisher_owner", "advertiser"), false);
  assert.equal(isRoleCompatibleWithOrganizationType("unknown_role", "admin"), false);
});

test("membership role priority favors stronger roles", () => {
  assert.ok(getMembershipRolePriority("super_admin") > getMembershipRolePriority("reviewer"));
  assert.ok(getMembershipRolePriority("advertiser_owner") > getMembershipRolePriority("advertiser_member"));
  assert.equal(getMembershipRolePriority("unknown_role"), 0);
});
