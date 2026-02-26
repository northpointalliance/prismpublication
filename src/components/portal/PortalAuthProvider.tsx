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

export const PortalAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentRole = useMemo(() => {
    if (!currentWorkspaceId) return null;
    return workspaces.find((item) => item.id === currentWorkspaceId)?.role || null;
  }, [currentWorkspaceId, workspaces]);

  const clearState = () => {
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspaceId(null);
  };

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
  }, [loadEntryContext]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    clearState();
  };

  const selectWorkspace = async (workspaceId: string) => {
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
