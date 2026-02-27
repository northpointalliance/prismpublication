import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";

interface PortalShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const PortalShell = ({ title, subtitle, children }: PortalShellProps) => {
  const { user, logout } = usePortalAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-primary">BotGrid App</p>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app/choose-workspace">
              <Button variant="secondary" size="sm">Switch Workspace</Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => void logout()}>
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-6 rounded-2xl border border-border/80 bg-card/80 px-4 py-3 text-sm text-muted-foreground">
          Signed in as <span className="font-semibold text-foreground">{user?.email}</span>
        </div>
        {children}
      </main>
    </div>
  );
};

export default PortalShell;
