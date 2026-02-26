import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest } from "@/lib/api";
import { getPortalHeaders } from "@/lib/portal-api";
import {
  EntryContextResponse,
  PortalRole,
  PortalUser,
  WorkspaceKind,
  WorkspaceOption,
} from "@/lib/portal-auth";

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
  createWorkspace: (type: WorkspaceKind, name?: string, adminKey?: string) => Promise<void>;
  refreshEntryContext: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

const getSessionEmail = (session: Session | null) => session?.user.email?.trim().toLowerCase() || "";

export const PortalAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentRole = useMemo(() => {
    if (!currentWorkspaceId) return null;
    return workspaces.find((item) => item.id === currentWorkspaceId)?.role || null;
  }, [currentWorkspaceId, workspaces]);

  const clearState = useCallback(() => {
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspaceId(null);
  }, []);

  const applyEntryContext = useCallback((entry: EntryContextResponse | null) => {
    if (!entry) {
      setUser(null);
      setWorkspaces([]);
      setCurrentWorkspaceId(null);
      return;
    }

    setUser(entry.user);
    setWorkspaces(entry.workspaces || []);
    setCurrentWorkspaceId(entry.defaultWorkspaceId || entry.workspaces[0]?.id || null);
  }, []);

  const loadEntryContext = useCallback(
    async (session: Session) => {
      const email = getSessionEmail(session);
      if (!email) {
        clearState();
        return;
      }

      const fallbackName = email.split("@")[0] || "Portal User";
      const name = String(session.user.user_metadata?.full_name || fallbackName);

      await apiRequest(
        "/auth/sync-user",
        {
          method: "POST",
          body: JSON.stringify({ email, name }),
        },
        await getPortalHeaders(email),
      );

      const entry = await apiRequest<EntryContextResponse>(
        "/me/entry-context",
        undefined,
        await getPortalHeaders(email),
      );
      applyEntryContext(entry);
    },
    [applyEntryContext, clearState],
  );

  const readActiveEmail = useCallback(async () => {
    if (user?.email) return user.email.toLowerCase();
    const { data } = await supabase.auth.getSession();
    const email = getSessionEmail(data.session);
    if (!email) {
      throw new Error("No active user session");
    }
    return email;
  }, [user?.email]);

  const refreshEntryContext = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      clearState();
      return;
    }
    await loadEntryContext(data.session);
  }, [clearState, loadEntryContext]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
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
      setLoading(true);
      try {
        if (session) {
          await loadEntryContext(session);
        } else {
          clearState();
        }
      } catch (_err) {
        clearState();
      } finally {
        if (mounted) {
          setLoading(false);
        }
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
  }, [clearState, loadEntryContext]);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      throw error;
    }
    if (data.session) {
      await loadEntryContext(data.session);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
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

    if (!data.session) {
      throw new Error("Account created. Confirm your email, then sign in.");
    }

    await loadEntryContext(data.session);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    clearState();
  };

  const selectWorkspace = async (workspaceId: string) => {
    const email = await readActiveEmail();
    const entry = await apiRequest<EntryContextResponse>(
      "/me/default-workspace",
      {
        method: "POST",
        body: JSON.stringify({ workspaceId }),
      },
      await getPortalHeaders(email),
    );
    applyEntryContext(entry);
  };

  const createWorkspace = async (type: WorkspaceKind, name?: string, adminKey?: string) => {
    const email = await readActiveEmail();
    const headers = await getPortalHeaders(email);
    if (type === "admin" && adminKey?.trim()) {
      headers["x-admin-key"] = adminKey.trim();
    }

    const entry = await apiRequest<EntryContextResponse>(
      "/me/create-workspace",
      {
        method: "POST",
        body: JSON.stringify({
          type,
          ...(name?.trim() ? { name: name.trim() } : {}),
        }),
      },
      headers,
    );
    applyEntryContext(entry);
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
        createWorkspace,
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
