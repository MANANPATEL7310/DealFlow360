export type ApprovalKind =
  | "DISCOUNT"
  | "FULFILLMENT_OVERRIDE"
  | "CREDIT_NOTE"
  | "NUDGE"
  | "NEGOTIATION";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApprovalAgentRun {
  id: string;
  agent: string;
  model: string;
  quotationId?: string | null;
}

export interface ApprovalItem {
  id: string;
  agentRunId: string;
  kind: ApprovalKind;
  proposedAction: Record<string, unknown>;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  agentRun?: ApprovalAgentRun;
}

export interface DecideApprovalPayload {
  decision: "APPROVED" | "REJECTED";
  reason?: string;
  editedAction?: Record<string, unknown>;
}
