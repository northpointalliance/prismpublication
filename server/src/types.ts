import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      id?: string;
      rawBody?: string;
      portalUser?: User;
      portalWorkspace?: {
        user: User;
        organization: { id: string; name: string; type: string; [key: string]: any };
        membership: { role: string; [key: string]: any };
      };
      sdkAuth?: {
        mode: "master" | "bot";
        rawToken: string;
        botId?: string;
        botPublicId?: string;
        keyId?: string;
      };
    }
  }
}

export {};
