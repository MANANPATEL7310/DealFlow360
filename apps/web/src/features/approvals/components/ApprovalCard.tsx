import { useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Bot,
  Clock,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";
import type { ApprovalItem, ApprovalKind } from "../types";
import { useDecideApproval } from "../api/use-approvals";

interface ApprovalCardProps {
  item: ApprovalItem;
}

function canRoleDecide(kind: ApprovalKind, role?: string): boolean {
  if (!role) return false;
  if (role === "admin") return true;

  switch (kind) {
    case "DISCOUNT":
      return role === "sales_manager" || role === "finance";
    case "CREDIT_NOTE":
      return role === "finance";
    case "NEGOTIATION":
    case "NUDGE":
      return role === "sales_rep";
    case "FULFILLMENT_OVERRIDE":
      return role === "sales_manager";
    default:
      return false;
  }
}

function getRequiredRoleLabel(kind: ApprovalKind): string {
  switch (kind) {
    case "DISCOUNT":
      return "Sales Manager or Finance";
    case "CREDIT_NOTE":
      return "Finance";
    case "NEGOTIATION":
    case "NUDGE":
      return "Owning Sales Rep";
    case "FULFILLMENT_OVERRIDE":
      return "Sales Manager";
    default:
      return "Authorized Staff";
  }
}

export function ApprovalCard({ item }: ApprovalCardProps) {
  const user = useAuthStore((s) => s.user);
  const decideMutation = useDecideApproval();
  const [isEditing, setIsEditing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editedPayloadText, setEditedPayloadText] = useState(() =>
    JSON.stringify(item.proposedAction, null, 2),
  );

  const isEligible = canRoleDecide(item.kind, user?.role);
  const isPending = item.status === "PENDING";

  const handleApproveDirect = async () => {
    try {
      await decideMutation.mutateAsync({
        id: item.id,
        payload: { decision: "APPROVED" },
      });
      toast.success("Approved and applied.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to record decision";
      toast.error(msg);
    }
  };

  const handleApproveEdited = async () => {
    try {
      const parsed = JSON.parse(editedPayloadText) as Record<string, unknown>;
      await decideMutation.mutateAsync({
        id: item.id,
        payload: {
          decision: "APPROVED",
          editedAction: parsed,
        },
      });
      toast.success("Edited action approved and applied successfully.");
      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        toast.error("Invalid JSON in edited action.");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to record decision";
      toast.error(msg);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    try {
      await decideMutation.mutateAsync({
        id: item.id,
        payload: {
          decision: "REJECTED",
          reason: rejectReason.trim(),
        },
      });
      toast.success("Proposed action rejected.");
      setIsRejecting(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to record rejection";
      toast.error(msg);
    }
  };

  return (
    <div
      id={`approval-card-${item.id}`}
      className="relative flex flex-col justify-between rounded-xl border border-border/80 bg-surface/70 p-5 shadow-sm backdrop-blur-md transition-all hover:border-border hover:shadow-md"
    >
      <div className="space-y-4">
        {/* Header Badges & Agent info */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="size-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {item.agentRun?.agent ?? "AI Assistant"}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              tone={
                item.kind === "DISCOUNT"
                  ? "warning"
                  : item.kind === "NEGOTIATION"
                    ? "secondary"
                    : "neutral"
              }
              className="text-xs font-medium"
            >
              {item.kind}
            </Badge>
            <Badge
              tone={
                item.status === "PENDING"
                  ? "warning"
                  : item.status === "APPROVED"
                    ? "success"
                    : "danger"
              }
              className="text-xs font-semibold tracking-wider uppercase"
            >
              {item.status}
            </Badge>
          </div>
        </div>

        {/* Proposed Action Visual Inspection */}
        <div className="rounded-lg bg-surface-muted/50 p-3.5 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase">
              <FileText className="size-3.5" />
              Proposed Action Content
            </span>
            {item.agentRun?.quotationId && (
              <span className="text-xs text-muted-foreground">
                Quote:{" "}
                <code className="font-mono text-foreground">
                  {item.agentRun.quotationId}
                </code>
              </span>
            )}
          </div>

          {item.kind === "NEGOTIATION" && item.proposedAction.draftMessage ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Draft response to customer portal negotiation:
              </p>
              <blockquote className="rounded-md border-l-2 border-primary bg-surface/80 p-2.5 text-xs text-foreground italic">
                &ldquo;{String(item.proposedAction.draftMessage)}&rdquo;
              </blockquote>
              {typeof item.proposedAction.counterDiscountPct === "number" && (
                <div className="text-xs text-foreground">
                  Proposed Counter Discount:{" "}
                  <span className="font-semibold text-primary">
                    {String(item.proposedAction.counterDiscountPct)}%
                  </span>
                </div>
              )}
            </div>
          ) : item.kind === "DISCOUNT" &&
            item.proposedAction.suggestedAdjustments ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Suggested Quotation Line Adjustments:
              </p>
              <div className="space-y-1">
                {Array.isArray(item.proposedAction.suggestedAdjustments) &&
                  item.proposedAction.suggestedAdjustments.map((adj, idx) => {
                    const typed = adj as {
                      lineId?: string;
                      toDiscountPct?: number;
                    };
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded bg-surface/80 px-2.5 py-1 text-xs"
                      >
                        <span className="font-mono text-muted-foreground">
                          {typed.lineId ?? `Line #${idx + 1}`}
                        </span>
                        <span className="font-semibold text-warning-dark dark:text-warning-light">
                          Target: {typed.toDiscountPct}% discount
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <pre className="max-h-36 overflow-auto rounded bg-surface/90 p-2 font-mono text-xs text-foreground">
              {JSON.stringify(item.proposedAction, null, 2)}
            </pre>
          )}
        </div>

        {/* Role Eligibility Guard */}
        {!isEligible && isPending && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning-dark dark:text-warning-light">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              Decision restricted to{" "}
              <strong>{getRequiredRoleLabel(item.kind)}</strong>. You are logged
              in as <code>{user?.role ?? "guest"}</code>.
            </span>
          </div>
        )}

        {/* Inline Edit Action Form */}
        {isEditing && (
          <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">
                Edit Proposed Action Before Applying
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <textarea
              id={`edit-json-${item.id}`}
              className="w-full rounded-md border border-border bg-surface p-2 font-mono text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              rows={5}
              value={editedPayloadText}
              onChange={(e) => setEditedPayloadText(e.target.value)}
            />
            <Button
              size="sm"
              className="w-full text-xs"
              onClick={() => void handleApproveEdited()}
              disabled={decideMutation.isPending}
            >
              {decideMutation.isPending ? (
                <Spinner className="mr-1.5 size-3.5" />
              ) : (
                <CheckCircle2 className="mr-1.5 size-3.5" />
              )}
              Save & Approve
            </Button>
          </div>
        )}

        {/* Inline Rejection Reason Form */}
        {isRejecting && (
          <div className="space-y-2 rounded-lg border border-danger/30 bg-danger/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-danger">
                Provide Rejection Reason
              </span>
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <input
              id={`reject-reason-${item.id}`}
              type="text"
              placeholder="e.g. Counter discount too high for bronze tier"
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-danger focus:outline-none"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full border-danger/40 text-xs text-danger hover:bg-danger/10"
              onClick={() => void handleReject()}
              disabled={decideMutation.isPending}
            >
              {decideMutation.isPending ? (
                <Spinner className="mr-1.5 size-3.5" />
              ) : (
                <XCircle className="mr-1.5 size-3.5" />
              )}
              Confirm Rejection
            </Button>
          </div>
        )}
      </div>

      {/* Decision Buttons */}
      {isPending && !isEditing && !isRejecting && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/40 pt-3">
          <Button
            id={`btn-reject-${item.id}`}
            size="sm"
            variant="outline"
            className="text-xs text-danger hover:bg-danger/10"
            disabled={!isEligible || decideMutation.isPending}
            onClick={() => setIsRejecting(true)}
          >
            <XCircle className="mr-1.5 size-3.5" />
            Reject
          </Button>

          <Button
            id={`btn-edit-${item.id}`}
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={!isEligible || decideMutation.isPending}
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="mr-1.5 size-3.5" />
            Edit
          </Button>

          <Button
            id={`btn-approve-${item.id}`}
            size="sm"
            className="text-xs"
            disabled={!isEligible || decideMutation.isPending}
            onClick={() => void handleApproveDirect()}
          >
            {decideMutation.isPending ? (
              <Spinner className="mr-1.5 size-3.5" />
            ) : (
              <CheckCircle2 className="mr-1.5 size-3.5" />
            )}
            Approve & Execute
          </Button>
        </div>
      )}

      {/* Completed Stamp */}
      {!isPending && (
        <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 text-xs text-muted-foreground">
          <span>
            Decided by: <strong>{item.decidedBy ?? "Authorized User"}</strong>
          </span>
          {item.decidedAt && (
            <span>{new Date(item.decidedAt).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </div>
  );
}
