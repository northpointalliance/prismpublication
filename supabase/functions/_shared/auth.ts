// Auth middleware ported from server/src/portal.ts. (requirePortalUser / requireSdkKey added with
// their domains; this file currently provides the admin-key guard used by leads + legacy admin routes.)
import type { MiddlewareHandler } from "hono";
import type { Env } from "./http.ts";
import { secureEqual } from "./crypto.ts";
import { adminApiKey } from "./config.ts";

// requireAdminKey — compares the `x-admin-key` header to ADMIN_API_KEY (timing-safe). Mirrors portal.ts.
export const requireAdminKey: MiddlewareHandler<Env> = async (c, next) => {
  const supplied = c.req.header("x-admin-key") ?? "";
  if (!adminApiKey || !secureEqual(supplied, adminApiKey)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
