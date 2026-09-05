import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  MessageSquare,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Send,
  RefreshCw,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiRoutes } from "@template/shared";
import { apiClient } from "@/services/http/api-client";
import toast from "react-hot-toast";

export interface NegotiationAiResult {
  draftMessage: string;
  recommendedCounterPct?: number;
  wouldAutoApprove: boolean;
  requiredLevelsIfAccepted: string[];
}

export interface NegotiationAiResponse {
  aiAvailable: boolean;
  reason?: string;
  requestId?: string;
  status?: string;
  approvalRequestId?: string;
  result?: NegotiationAiResult;
}

export interface AiNegotiationAssistantProps {
  requestId: string;
  quotationId?: string;
  onPostMessage?: (text: string) => Promise<void> | void;
}

export function AiNegotiationAssistant({
  requestId,
  quotationId: _quotationId,
  onPostMessage,
}: AiNegotiationAssistantProps) {
  const [data, setData] = useState<NegotiationAiResponse | null>(null);
  const [editableMessage, setEditableMessage] = useState("");

  const assistMutation = useMutation({
    mutationFn: async (id: string) => {
      const url = apiRoutes.aiNegotiation.assist.path.replace(":requestId", id);
      const res = await apiClient.post<{
        success: boolean;
        data: NegotiationAiResponse;
      }>(url);
      return res.data.data;
    },
    onSuccess: (resData) => {
      setData(resData);
      if (resData.result?.draftMessage) {
        setEditableMessage(resData.result.draftMessage);
      }
      if (resData.status === "PAUSED_FOR_APPROVAL") {
        toast.success(
          "Draft response created and enqueued in HITL Approvals inbox.",
        );
      }
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Failed to run negotiation assist";
      toast.error(msg);
    },
  });

  const handleRunAssist = () => {
    assistMutation.mutate(requestId);
  };

  const handleSendToCustomer = async () => {
    if (!editableMessage.trim()) {
      toast.error("Message text cannot be empty.");
      return;
    }
    if (onPostMessage) {
      await onPostMessage(editableMessage);
      toast.success("Message dispatched to customer portal thread via M9.");
    } else {
      toast.success("Draft approved for portal dispatch.");
    }
  };

  const isPending = assistMutation.isPending;
  const result = data?.result;

  return (
    <div
      id={`ai-negotiation-assistant-${requestId}`}
      className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-surface/80 p-5 shadow-sm backdrop-blur-md"
    >
      {/* Header with Internal Rep Guard Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              AI Negotiation Assistant (Agent 6)
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3 text-warning" />
              <span>Internal Sales Rep Surface Only — No Customer Access</span>
            </div>
          </div>
        </div>

        <Button
          id="btn-run-negotiation-assist"
          size="sm"
          variant="outline"
          onClick={handleRunAssist}
          disabled={isPending}
          className="text-xs"
        >
          {isPending ? (
            <>
              <Spinner className="mr-1.5 size-3.5" />
              Analyzing Counter...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1.5 size-3.5" />
              {data ? "Re-evaluate" : "Generate Draft"}
            </>
          )}
        </Button>
      </div>

      {/* Initial State */}
      {!data && !isPending && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Request an in-memory counter term risk analysis and draft response
            for request{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-foreground">
              {requestId}
            </code>
            .
          </p>
          <Button size="sm" onClick={handleRunAssist} className="text-xs">
            <Sparkles className="mr-1.5 size-3.5" />
            Analyze Customer Counter
          </Button>
        </div>
      )}

      {/* AI Off / Degradation */}
      {data && !data.aiAvailable && (
        <div className="space-y-3 rounded-xl border border-border bg-surface-muted/30 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Manual Negotiation Mode (AI Inactive)
          </div>
          <p className="text-xs text-muted-foreground">
            AI drafting is offline. Use the manual response box below to reply
            to customer counters. Governance remains active: accepting any
            counter re-runs M4 blended risk.
          </p>
          <textarea
            className="w-full rounded-md border border-border bg-surface p-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            rows={4}
            placeholder="Type manual response to customer..."
            value={editableMessage}
            onChange={(e) => setEditableMessage(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => void handleSendToCustomer()}
              className="text-xs"
            >
              <Send className="mr-1.5 size-3.5" />
              Send to Customer via M9
            </Button>
          </div>
        </div>
      )}

      {/* Active AI View */}
      {data?.aiAvailable && result && (
        <div className="space-y-4">
          {/* Would-Auto-Approve Banner */}
          {result.wouldAutoApprove ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success-dark dark:text-success-light">
              <CheckCircle2 className="size-4 shrink-0" />
              <div>
                <strong>Policy Compliant:</strong> Accepting this counter stays
                within configured discount policy limits. No secondary approval
                chain required.
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning-dark dark:text-warning-light">
              <AlertTriangle className="size-4 shrink-0" />
              <div>
                <strong>Approval Re-route Required:</strong> Accepting this
                counter will breach tier ceilings and automatically trigger
                re-routing to:{" "}
                <span className="font-semibold">
                  {result.requiredLevelsIfAccepted.length > 0
                    ? result.requiredLevelsIfAccepted.join(", ")
                    : "Sales Manager / Finance"}
                </span>
                .
              </div>
            </div>
          )}

          {/* Recommended Counter Pct */}
          {typeof result.recommendedCounterPct === "number" && (
            <div className="flex items-center justify-between rounded-lg bg-surface-muted/50 p-2.5 text-xs">
              <span className="text-muted-foreground">
                Recommended Counter Discount:
              </span>
              <Badge tone="primary" className="font-mono text-xs font-semibold">
                {result.recommendedCounterPct}%
              </Badge>
            </div>
          )}

          {/* Draft Message Editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Draft Response (Editable by Rep)
            </label>
            <textarea
              id={`negotiation-draft-text-${requestId}`}
              className="w-full rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              rows={5}
              value={editableMessage}
              onChange={(e) => setEditableMessage(e.target.value)}
            />
          </div>

          {/* HITL Notice & Dispatch Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
            <div className="text-xs text-muted-foreground">
              {data.approvalRequestId ? (
                <span>
                  Queued in HITL Inbox (ID:{" "}
                  <code>{data.approvalRequestId}</code>)
                </span>
              ) : (
                <span>
                  Requires rep confirmation before posting to customer portal.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                id="btn-send-portal-message"
                size="sm"
                className="text-xs"
                onClick={() => void handleSendToCustomer()}
              >
                <Send className="mr-1.5 size-3.5" />
                Approve & Post to Portal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
