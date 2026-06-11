// Shared Hono types + middleware (security headers, request id) mirroring server/src/index.ts.
import type { Context, MiddlewareHandler } from "hono";

// Context variables attached by auth middleware (ports the Express req augmentation in types.ts).
export type PortalUser = { id: string; email: string; name: string };
export type PortalWorkspace = {
  user: PortalUser;
  organization: { id: string; name: string; type: string; [k: string]: unknown };
  membership: { role: string; [k: string]: unknown };
};
export type SdkAuth = {
  mode: "master" | "bot";
  rawToken: string;
  botId?: string;
  botPublicId?: string;
  keyId?: string;
};

export type Env = {
  Variables: {
    requestId: string;
    rawBody: string;
    portalUser?: PortalUser;
    portalWorkspace?: PortalWorkspace;
    sdkAuth?: SdkAuth;
  };
};

export type Ctx = Context<Env>;

// Request id + security headers, applied to every response (mirror index.ts lines 73-82).
export const baseMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const incoming = c.req.header("x-request-id");
  const requestId = (incoming ?? crypto.randomUUID()).slice(0, 64);
  c.set("requestId", requestId);
  await next();
  c.header("X-Request-Id", requestId);
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
};

// Small JSON error helper.
export const fail = (c: Ctx, status: number, error: string, extra?: Record<string, unknown>) =>
  c.json({ error, ...(extra ?? {}) }, status as 400);
