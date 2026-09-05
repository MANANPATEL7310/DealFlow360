import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  CreateNegotiationInput,
  PortalConfirmResult,
  PortalQuotationLine,
  PortalQuotationView,
} from "@template/shared";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { portalApi } from "../api/portal-api";
import { PortalConfirmModal } from "../components/portal-confirm-modal";
import { PortalHeader } from "../components/portal-header";
import { PortalHistoryFeed } from "../components/portal-history-feed";
import { PortalLinesTable } from "../components/portal-lines-table";
import { PortalNegotiationDrawer } from "../components/portal-negotiation-drawer";
import { PortalProposalSummary } from "../components/portal-proposal-summary";
import { initPortalToken, setPortalToken } from "../lib/portal-token";

export function PortalPage() {
  const [quotation, setQuotation] = useState<PortalQuotationView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals / Drawers state
  const [isNegotiateOpen, setIsNegotiateOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<PortalQuotationLine | null>(
    null,
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const loadQuotation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await portalApi.getQuotation();
      setQuotation(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to load quotation proposal.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Scrub token from address bar and persist in sessionStorage
    initPortalToken();
    loadQuotation();
  }, []);

  const handleDemoAccess = () => {
    // Set demo token and load
    const demoPayload = JSON.stringify({
      quotationId: "qt-101",
      contactId: "cst-01-c1",
    });
    const demoToken = btoa(demoPayload);
    setPortalToken(demoToken);
    loadQuotation();
  };

  const handleOpenNegotiate = (line?: PortalQuotationLine) => {
    setSelectedLine(line ?? null);
    setIsNegotiateOpen(true);
  };

  const handleSubmitNegotiation = async (input: CreateNegotiationInput) => {
    const updated = await portalApi.submitNegotiation(input);
    setQuotation(updated);
    setBannerNotice(
      "Counter-offer submitted successfully to your sales representative!",
    );
    setTimeout(() => setBannerNotice(null), 6000);
  };

  const handleExecuteConfirm = async (): Promise<PortalConfirmResult> => {
    return portalApi.confirmQuotation();
  };

  const handleConfirmSuccess = (_result: PortalConfirmResult) => {
    loadQuotation();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 ring-1 ring-primary/25">
          <Spinner className="size-6" />
        </div>
        <h2 className="text-base font-semibold text-foreground">
          Verifying Magic Link Credentials
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Establishing end-to-end encrypted session for commercial proposal...
        </p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-warning/10 text-warning ring-1 ring-warning/25 mb-4">
            <Lock className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            Portal Authentication Required
          </h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {error ??
              "This customer proposal requires an authorized secure magic link to view."}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={handleDemoAccess}
              className="w-full gap-2 font-semibold shadow-sm"
            >
              <Sparkles className="size-4" />
              <span>Launch Demo Proposal (QT-2026-0101)</span>
              <ArrowRight className="size-4" />
            </Button>

            <Button
              variant="outline"
              onClick={loadQuotation}
              className="w-full gap-2 text-xs"
            >
              <RefreshCw className="size-3.5" />
              <span>Retry Session</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLocked = quotation.status === "CONFIRMED";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Isolated Standalone Portal Header */}
      <PortalHeader quotation={quotation} />

      {/* Floating Notice / Alert Banner */}
      {bannerNotice && (
        <div className="sticky top-16 z-20 mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-xs text-primary font-medium shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{bannerNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-primary hover:underline text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Proposal Canvas */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Proposal Hero Summary */}
        <PortalProposalSummary
          quotation={quotation}
          onOpenNegotiate={() => handleOpenNegotiate()}
          onOpenConfirm={() => setIsConfirmOpen(true)}
        />

        {/* Itemized Deliverables Table */}
        <PortalLinesTable
          lines={quotation.lines}
          negotiations={quotation.negotiations}
          isLocked={isLocked}
          onNegotiateLine={(line) => handleOpenNegotiate(line)}
        />

        {/* Live Negotiation Audit Trail */}
        <PortalHistoryFeed
          negotiations={quotation.negotiations}
          lines={quotation.lines}
        />
      </main>

      {/* Negotiation Drawer Modal */}
      <PortalNegotiationDrawer
        isOpen={isNegotiateOpen}
        onClose={() => setIsNegotiateOpen(false)}
        quotation={quotation}
        selectedLine={selectedLine}
        onSubmit={handleSubmitNegotiation}
      />

      {/* Finalize & Governance Gate Modal */}
      <PortalConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        quotation={quotation}
        onConfirmSuccess={handleConfirmSuccess}
        onExecuteConfirm={handleExecuteConfirm}
      />

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span>
              DealFlow360 External Enterprise Gateway • ISO 27001 Certified
            </span>
          </div>
          <p>© 2026 DealFlow360 Technologies Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
