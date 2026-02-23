import { Bot } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12" role="contentinfo">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <a href="/" className="flex items-center gap-2" aria-label="BotGrid home">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold">BotGrid</span>
          </a>
          <nav className="flex gap-8 text-sm text-muted-foreground" aria-label="Footer navigation">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <div className="text-xs text-muted-foreground">
            © 2026 BotGrid. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
