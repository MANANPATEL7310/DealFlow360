import { useState } from "react";
import { type PortalMagicLink } from "@template/shared";
import { Check, Clock, Copy, ExternalLink, Link2, ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MagicLinkModalProps {
  magicLink: PortalMagicLink | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MagicLinkModal({
  magicLink,
  isOpen,
  onClose,
}: MagicLinkModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !magicLink) return null;

  const fullUrl = `${window.location.origin}${magicLink.url}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Magic link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <Card className="bg-card relative w-full max-w-lg space-y-6 border-border p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
              <ShieldCheck className="size-3.5" />
              Tokenized Portal Access
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Customer Negotiation Magic Link
            </h2>
            <p className="text-xs text-muted-foreground">
              Authorized link for {magicLink.customerName} (
              {magicLink.contactEmail})
            </p>
          </div>
          <button
            className="hover:bg-muted rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Security & Expiry Banner */}
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border border-border p-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 text-primary" />
            <span>Valid for 7 days (Single Session)</span>
          </div>
          <span className="font-semibold text-foreground">
            PS §10 Compliant
          </span>
        </div>

        {/* Link Container */}
        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
            Shareable Negotiation URL
          </label>
          <div className="flex items-center gap-2">
            <div className="bg-muted/50 flex flex-1 items-center gap-2 overflow-hidden rounded-lg border border-border px-3 py-2 font-mono text-xs text-foreground">
              <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{fullUrl}</span>
            </div>
            <Button
              className="shrink-0 gap-1.5"
              type="button"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <a
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            href={magicLink.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>Simulate Customer View</span>
            <ExternalLink className="size-3" />
          </a>

          <Button variant="outline" type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
