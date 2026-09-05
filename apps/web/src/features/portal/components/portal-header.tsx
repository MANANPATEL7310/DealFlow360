import {
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  MoonStar,
  ShieldCheck,
  Sparkles,
  SunMedium,
  User,
} from "lucide-react";
import type { PortalQuotationView, QuotationStatus } from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

interface PortalHeaderProps {
  quotation: PortalQuotationView;
}

function getPortalStatusBadge(status: QuotationStatus) {
  switch (status) {
    case "CONFIRMED":
      return (
        <Badge tone="success" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
          <CheckCircle2 className="size-3.5" />
          Confirmed & Accepted
        </Badge>
      );
    case "PENDING_APPROVAL":
      return (
        <Badge tone="warning" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
          <Clock className="size-3.5" />
          Under Governance Review
        </Badge>
      );
    case "SENT":
      return (
        <Badge tone="primary" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
          <Sparkles className="size-3.5" />
          Active Proposal
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge tone="success" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
          <CheckCircle2 className="size-3.5" />
          Approved for Signing
        </Badge>
      );
    default:
      return (
        <Badge tone="secondary" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
          <FileText className="size-3.5" />
          {status}
        </Badge>
      );
  }
}

export function PortalHeader({ quotation }: PortalHeaderProps) {
  const { resolvedMode, toggleMode } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Portal Label */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-foreground">
                DealFlow<span className="text-primary">360</span>
              </span>
              <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                Client Portal
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Secure proposal review & direct negotiation workspace
            </p>
          </div>
        </div>

        {/* Center / Security Pill */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-surface-muted/60 px-3 py-1 text-xs text-muted-foreground">
          <Lock className="size-3 text-emerald-500" />
          <span>Scoped Token Session</span>
          <span className="text-border">•</span>
          <span className="font-mono font-medium text-foreground">{quotation.code}</span>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-3">
          {getPortalStatusBadge(quotation.status)}

          <div className="hidden lg:flex items-center gap-2 border-l border-border pl-3 text-xs text-muted-foreground">
            <div className="flex size-7 items-center justify-center rounded-full bg-surface-muted">
              <User className="size-3.5 text-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-medium text-foreground">{quotation.customerName}</div>
              <div className="text-muted-foreground">Rep: {quotation.salesRepName}</div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleMode}
            type="button"
            className="size-9 p-0"
            title="Toggle theme"
          >
            {resolvedMode === "dark" ? (
              <SunMedium className="size-4" />
            ) : (
              <MoonStar className="size-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
