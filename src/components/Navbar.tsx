import { Button } from "@/components/ui/button";
import { Bot, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">BotGrid</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#publishers" className="hover:text-foreground transition-colors">Publishers</a>
          <a href="#advertisers" className="hover:text-foreground transition-colors">Advertisers</a>
          <a href="#stats" className="hover:text-foreground transition-colors">Network</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">Sign In</Button>
          <Button variant="hero" size="sm">Get Started</Button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-border/50 px-6 py-4 space-y-3">
          <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground">How It Works</a>
          <a href="#publishers" className="block text-sm text-muted-foreground hover:text-foreground">Publishers</a>
          <a href="#advertisers" className="block text-sm text-muted-foreground hover:text-foreground">Advertisers</a>
          <Button variant="hero" size="sm" className="w-full mt-2">Get Started</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
