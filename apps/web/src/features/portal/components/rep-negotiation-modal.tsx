import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CornerDownRight,
  ExternalLink,
  Lock,
  MessageSquare,
  Sparkles,
  User,
  X,
} from "lucide-react";
import type {
  AnswerNegotiationInput,
  NegotiationRequest,
  Quotation,
} from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RepNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
  negotiations: NegotiationRequest[];
  onAnswerNegotiation: (
    negotiationId: string,
    input: AnswerNegotiationInput
  ) => Promise<void>;
  onApplyLineDiscount?: (lineId: string, discountPct: number) => void;
}

export function RepNegotiationModal({
  isOpen,
  onClose,
  quotation,
  negotiations,
  onAnswerNegotiation,
  onApplyLineDiscount,
}: RepNegotiationModalProps) {
  const [activeTab, setActiveTab] = useState<"SHARE" | "LOG">("SHARE");
  const [copied, setCopied] = useState(false);
  const [repReplies, setRepReplies] = useState<Record<string, string>>({});
  const [isAnswering, setIsAnswering] = useState<string | null>(null);

  if (!isOpen) return null;

  // Mint mock customer token for sharing
  const tokenPayload = JSON.stringify({
    quotationId: quotation.id,
    contactId: quotation.customer?.contacts?.[0]?.id ?? "cst-01-c1",
  });
  const mockToken = btoa(tokenPayload);
  const portalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal?token=${mockToken}`
    : `/portal?token=${mockToken}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleAcceptNegotiation = async (neg: NegotiationRequest) => {
    setIsAnswering(neg.id);
    const reply =
      repReplies[neg.id] ||
      `Approved: Concession of ${neg.counterDiscountPct ?? 0}% provisionally locked.`;

    try {
      await onAnswerNegotiation(neg.id, {
        repComment: reply,
        status: "ANSWERED",
      });

      // If tied to a line and we have counter discount, apply directly
      if (
        neg.lineId &&
        neg.counterDiscountPct !== undefined &&
        neg.counterDiscountPct !== null &&
        onApplyLineDiscount
      ) {
        onApplyLineDiscount(neg.lineId, neg.counterDiscountPct);
      }
    } finally {
      setIsAnswering(null);
    }
  };

  const openNegotiationsCount = negotiations.filter((n) => n.status === "OPEN").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        style={{ maxHeight: "85vh" }}
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-5 bg-surface-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Customer Portal & Negotiations
                </h3>
                {openNegotiationsCount > 0 && (
                  <Badge tone="warning" className="text-xs">
                    {openNegotiationsCount} Action Required
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Quotation {quotation.quotationNumber} • {quotation.customer?.name}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-surface px-6 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("SHARE")}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "SHARE"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Share Portal Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LOG")}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "LOG"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Client Counter-Offers</span>
            {negotiations.length > 0 && (
              <span className="rounded-full bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
                {negotiations.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6">
          {activeTab === "SHARE" ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Lock className="size-4" />
                  <span>Scoped Magic Link Protocol</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  The client portal link below is scoped strictly to this proposal and contact. 
                  Internal margins, cost floors, and approval routing rules are automatically stripped.
                  When the customer opens the link, the security token is scrubbed from the address bar.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Magic Portal Link
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={portalUrl}
                    className="font-mono text-xs bg-surface-muted/50 select-all"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="primary" size="md" className="w-full gap-2 text-xs">
                    <ExternalLink className="size-4" />
                    <span>Launch Customer View in New Tab</span>
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            /* Negotiations Log & Rep Workbench */
            <div className="space-y-4">
              {negotiations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <MessageSquare className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    No client inquiries or counter-offers yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Once the customer accesses the portal and proposes an adjustment, it will appear here for review.
                  </p>
                </div>
              ) : (
                negotiations.map((neg) => {
                  const targetLine = quotation.lines.find((l) => l.id === neg.lineId);
                  const isAnswered = neg.status === "ANSWERED" || neg.status === "ACCEPTED";

                  return (
                    <div
                      key={neg.id}
                      className="rounded-xl border border-border bg-surface-muted/30 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {targetLine ? targetLine.product?.name ?? "Line Item" : "Proposal Level"}
                          </span>
                          {neg.counterDiscountPct !== undefined && (
                            <Badge tone="primary" className="text-xs font-mono">
                              Counter: {neg.counterDiscountPct}%
                            </Badge>
                          )}
                        </div>

                        {isAnswered ? (
                          <Badge tone="success" className="gap-1 text-xs">
                            <CheckCircle2 className="size-3" /> Answered
                          </Badge>
                        ) : (
                          <Badge tone="warning" className="gap-1 text-xs">
                            <Clock className="size-3" /> Pending Rep Review
                          </Badge>
                        )}
                      </div>

                      {/* Customer Note */}
                      <div className="flex items-start gap-2.5 text-xs bg-surface rounded-lg p-3 border border-border/60">
                        <User className="size-3.5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-foreground">Client Request</div>
                          <p className="text-muted-foreground mt-0.5">{neg.comment}</p>
                        </div>
                      </div>

                      {/* Rep Response */}
                      {neg.repComment ? (
                        <div className="flex items-start gap-2.5 text-xs bg-primary/5 rounded-lg p-3 border border-primary/20">
                          <CornerDownRight className="size-3.5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <div className="font-semibold text-primary">Your Response</div>
                            <p className="text-foreground mt-0.5">{neg.repComment}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <Input
                            placeholder="Add approval comment or concession note..."
                            value={repReplies[neg.id] ?? ""}
                            onChange={(e) =>
                              setRepReplies((prev) => ({
                                ...prev,
                                [neg.id]: e.target.value,
                              }))
                            }
                            className="text-xs"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptNegotiation(neg)}
                              disabled={isAnswering === neg.id}
                              className="gap-1.5 text-xs font-semibold"
                            >
                              <Sparkles className="size-3.5" />
                              <span>Accept & Apply Concession</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border p-4 bg-surface-muted/30 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
