export type AgentContext = {
  actorId: string;
  actorRole?: string;
  agent: string;
  runId: string;
  quotationId?: string;
};

export type AgentTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  write?: boolean;
  handler: (args: unknown, ctx: AgentContext) => Promise<unknown>;
};

export type NeedsApproval = {
  needsApproval: true;
  kind:
    | "DISCOUNT"
    | "CREDIT_NOTE"
    | "NUDGE"
    | "NEGOTIATION"
    | "FULFILLMENT_OVERRIDE";
  summary: string;
  proposedAction: unknown;
};
