import { Button } from "@/components/ui/button";
import { Bot, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";

const primaryLinks = [
  { label: "Publishers", to: "/publishers" },
  { label: "Advertisers", to: "/advertisers" },
  { label: "How It Works", to: "/sdk" },
  { label: "Company", to: "/company" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = usePortalAuth();
  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <nav
      className="fixed left-1/2 top-4 z-50 w-[min(1120px,calc(100%-1.5rem))] -translate-x-1/2"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center justify-between rounded-full border border-white/20 bg-background/80 px-5 shadow-[0_18px_45px_-28px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2" aria-label="BotGrid home" onClick={closeMobileMenu}>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">BotGrid</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {primaryLinks.map((link) => (
            <Link key={link.label} to={link.to} className="hover:text-foreground transition-colors font-medium">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center">
          <Link to={user ? "/app/choose-workspace" : "/app/login"}>
            <Button variant="hero" size="sm">{user ? "Open App" : "Login"}</Button>
          </Link>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden mt-3 rounded-2xl border border-white/20 bg-card/95 px-6 py-4 shadow-[0_20px_45px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          <ul className="space-y-3 text-sm">
            {primaryLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="block text-muted-foreground hover:text-foreground"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to={user ? "/app/choose-workspace" : "/app/login"} onClick={closeMobileMenu}>
            <Button variant="hero" size="sm" className="w-full mt-4">{user ? "Open App" : "Login"}</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
