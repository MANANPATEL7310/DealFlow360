import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { appRoutes } from "@template/shared";
import { LogoMark } from "@/components/shared/logo-mark";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Platform Features", href: "#features" },
    { label: "Risk Simulator", href: "#simulator" },
    { label: "Quote-to-Cash Workflow", href: "#workflow" },
    { label: "Role Workspaces", href: "#roles" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to={appRoutes.home}
            className="group hover:scale-1.02 transition-transform"
          >
            <LogoMark />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link to={appRoutes.login}>
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to={appRoutes.app}>
            <Button size="sm" className="gap-2 font-semibold shadow-md">
              Launch Workspace
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="animate-in slide-in-from-top-2 border-b border-border bg-surface px-6 py-5 shadow-xl md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-foreground hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            <div className="my-2 border-t border-border" />
            <div className="flex flex-col gap-2">
              <Link
                to={appRoutes.login}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="outline" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link to={appRoutes.app} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center gap-2">
                  Launch Workspace
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
