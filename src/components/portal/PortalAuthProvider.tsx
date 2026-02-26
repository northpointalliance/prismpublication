import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest } from "@/lib/api";
import { EntryContextResponse, PortalRole, PortalUser, WorkspaceOption } from "@/lib/portal-auth";

interface PortalAuthContextValue {
  user: PortalUser | null;
  workspaces: WorkspaceOption[];
  currentWorkspaceId: string | null;
  currentRole: PortalRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  refreshEntryContext: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

const getUserHeader = (email: string) => ({ "x-user-email": email.toLowerCase() });
const LOCAL_DEV_SESSION_KEY = "botgrid_local_dev_session";

interface LocalDevAccount {
  email: string;
  password: string;
  user: PortalUser;
  workspaces: WorkspaceOption[];
  defaultWorkspaceId: string;
}

const LOCAL_DEV_ACCOUNTS: LocalDevAccount[] = [
  {
    email: "advertiser.demo@local.test",
    password: "Advertiser123!",
    user: {
      id: "local-advertiser-user",
      email: "advertiser.demo@local.test",
      name: "Advertiser Demo",
    },
    workspaces: [
      {
        id: "local-workspace-advertiser",
        orgId: "local-workspace-advertiser",
        role: "advertiser",
        title: "Advertiser",
        description: "Create campaigns, upload creatives, and manage budget controls.",
      },
    ],
    defaultWorkspaceId: "local-workspace-advertiser",
  },
  {
    email: "botdev.demo@local.test",
    password: "BotDeveloper123!",
    user: {
      id: "local-botdev-user",
      email: "botdev.demo@local.test",
      name: "Bot Developer Demo",
    },
    workspaces: [
      {
        id: "local-workspace-publisher",
        orgId: "local-workspace-publisher",
        role: "publisher",
        title: "Bot Developer",
        description: "Manage bots, SDK keys, placements, and monetization performance.",
      },
    ],
    defaultWorkspaceId: "local-workspace-publisher",
  },
];

const findLocalDevAccount = (email: string) =>
  LOCAL_DEV_ACCOUNTS.find((account) => account.email.toLowerCase() === email.toLowerCase());

export const PortalAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [localDevEmail, setLocalDevEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentRole = useMemo(() => {
    if (!currentWorkspaceId) return null;
    return workspaces.find((item) => item.id === currentWorkspaceId)?.role || null;
  }, [currentWorkspaceId, workspaces]);

  const clearState = () => {
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspaceId(null);
    setLocalDevEmail(null);
    localStorage.removeItem(LOCAL_DEV_SESSION_KEY);
  };

  const applyLocalDevAccount = useCallback((account: LocalDevAccount, workspaceId?: string | null) => {
    setLocalDevEmail(account.email);
    setUser(account.user);
    setWorkspaces(account.workspaces);
    setCurrentWorkspaceId(workspaceId || account.defaultWorkspaceId);
    localStorage.setItem(
      LOCAL_DEV_SESSION_KEY,
      JSON.stringify({
        email: account.email,
        workspaceId: workspaceId || account.defaultWorkspaceId,
      }),
    );
  }, []);

  const loadEntryContext = useCallback(async (session: Session) => {
    const email = session.user.email?.toLowerCase();
    if (!email) {
      clearState();
      return;
    }

    const name = String(session.user.user_metadata?.full_name || email.split("@")[0] || "Portal User");

    await apiRequest(
      "/auth/sync-user",
      {
        method: "POST",
        body: JSON.stringify({ email, name }),
      },
      getUserHeader(email),
    );

    const entry = await apiRequest<EntryContextResponse>("/me/entry-context", undefined, getUserHeader(email));
    setUser(entry.user);
    setWorkspaces(entry.workspaces || []);
    setCurrentWorkspaceId(entry.defaultWorkspaceId || entry.workspaces[0]?.id || null);
  }, []);

  const refreshEntryContext = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      clearState();
      return;
    }
    await loadEntryContext(data.session);
  }, [loadEntryContext]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const rawLocalSession = localStorage.getItem(LOCAL_DEV_SESSION_KEY);
        if (rawLocalSession) {
          const parsed = JSON.parse(rawLocalSession) as { email?: string; workspaceId?: string | null };
          if (parsed.email) {
            const localAccount = findLocalDevAccount(parsed.email);
            if (localAccount) {
              applyLocalDevAccount(localAccount, parsed.workspaceId || undefined);
              return;
            }
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session) {
          await loadEntryContext(data.session);
        } else {
          clearState();
        }
      } catch (_err) {
        if (mounted) {
          clearState();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const handleAuthChange = async (_event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      if (!session) {
        clearState();
        return;
      }
      try {
        await loadEntryContext(session);
      } catch (_err) {
        clearState();
      }
    };

    void bootstrap();
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      void handleAuthChange(event, session);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [applyLocalDevAccount, loadEntryContext]);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const localAccount = findLocalDevAccount(normalizedEmail);
    if (localAccount && localAccount.password === password) {
      applyLocalDevAccount(localAccount);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (localDevEmail) {
      clearState();
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    clearState();
  };

  const selectWorkspace = async (workspaceId: string) => {
    if (localDevEmail) {
      const localAccount = findLocalDevAccount(localDevEmail);
      if (localAccount) {
        applyLocalDevAccount(localAccount, workspaceId);
      }
      return;
    }

    const email = user?.email.toLowerCase();
    if (!email) return;

    const entry = await apiRequest<EntryContextResponse>(
      "/me/default-workspace",
      {
        method: "POST",
        body: JSON.stringify({ workspaceId }),
      },
      getUserHeader(email),
    );

    setLocalDevEmail(null);
    setWorkspaces(entry.workspaces || []);
    setCurrentWorkspaceId(entry.defaultWorkspaceId || workspaceId);
  };

  return (
    <PortalAuthContext.Provider
      value={{
        user,
        workspaces,
        currentWorkspaceId,
        currentRole,
        loading,
        signIn,
        signUp,
        logout,
        selectWorkspace,
        refreshEntryContext,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
};

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext);
  if (!context) {
    throw new Error("usePortalAuth must be used inside PortalAuthProvider");
  }
  return context;
};
