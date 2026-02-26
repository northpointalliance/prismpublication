import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface SiteShellProps {
  children: ReactNode;
  mainClassName?: string;
  mainId?: string;
}

const SiteShell = ({ children, mainClassName = "", mainId = "main-content" }: SiteShellProps) => {
  return (
    <div className="min-h-screen bg-background">
      <a
        href={`#${mainId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id={mainId} className={mainClassName}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default SiteShell;
