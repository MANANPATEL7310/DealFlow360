import { Link } from "react-router";
import { appRoutes } from "@template/shared";
import { LogoMark } from "@/components/shared/logo-mark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface/50 py-12 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 border-b border-border pb-12 md:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-2">
            <LogoMark />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              DealFlow360 is an intelligent, self-governing sales operations
              platform that automates the quotation-to-cash lifecycle for B2B
              enterprises.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
              <span className="size-2 animate-pulse rounded-full bg-secondary" />
              <span>Core Platform Engine Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-foreground uppercase">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-primary"
                >
                  Platform Features
                </a>
              </li>
              <li>
                <a
                  href="#simulator"
                  className="transition-colors hover:text-primary"
                >
                  Risk Engine Simulator
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  className="transition-colors hover:text-primary"
                >
                  Quote-to-Cash Workflow
                </a>
              </li>
              <li>
                <a
                  href="#roles"
                  className="transition-colors hover:text-primary"
                >
                  Role Personas
                </a>
              </li>
            </ul>
          </div>

          {/* Workspaces */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-foreground uppercase">
              Workspaces
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to={appRoutes.app}
                  className="transition-colors hover:text-primary"
                >
                  Sales Rep Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to={appRoutes.login}
                  className="transition-colors hover:text-primary"
                >
                  Manager Approvals
                </Link>
              </li>
              <li>
                <Link
                  to={appRoutes.login}
                  className="transition-colors hover:text-primary"
                >
                  Customer Portal Demo
                </Link>
              </li>
              <li>
                <Link
                  to={appRoutes.login}
                  className="transition-colors hover:text-primary"
                >
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} DealFlow360. All rights reserved.</p>
          <p className="font-mono text-xs">
            Engineered for High-Velocity Sales Operations
          </p>
        </div>
      </div>
    </footer>
  );
}
