import type { AgentContext, AgentTool } from "../../../ai/tools/types.js";
import {
  getBillingSchedule,
  reconcilePayments,
  simulateProration,
} from "../../billing/billing.service.js";

export const getSchedule: AgentTool = {
  name: "get_billing_schedule",
  description:
    "One-time lines, recurring lines, and the upcoming billing schedule for the order.",
  parameters: {
    type: "object",
    properties: { quotationId: { type: "string" } },
    required: ["quotationId"],
  },
  handler: async (args: unknown) => {
    const { quotationId } = (args ?? {}) as { quotationId: string };
    return getBillingSchedule(quotationId);
  },
};

export const computeProration: AgentTool = {
  name: "compute_proration",
  description:
    "Exact proration for a mid-cycle quantity/plan change (authoritative M8 prorate()).",
  parameters: {
    type: "object",
    properties: {
      subscriptionId: { type: "string" },
      lineId: { type: "string" },
      changeDate: { type: "string" },
      newPeriodAmountMinor: { type: "number" },
    },
    required: ["changeDate"],
  },
  handler: async (args: unknown) => {
    return simulateProration(
      (args ?? {}) as {
        subscriptionId?: string;
        lineId?: string;
        changeDate?: string | Date;
        newPeriodAmountMinor?: number;
      },
    );
  },
};

export const reconcile: AgentTool = {
  name: "reconcile_payments",
  description: "Payments recorded vs invoices due; highlights mismatches.",
  parameters: {
    type: "object",
    properties: { quotationId: { type: "string" } },
    required: ["quotationId"],
  },
  handler: async (args: unknown) => {
    const { quotationId } = (args ?? {}) as { quotationId: string };
    return reconcilePayments(quotationId);
  },
};

export const draftCreditNote: AgentTool = {
  name: "draft_credit_note",
  description:
    "Draft a credit note against an invoice for Finance to review. Does not create it.",
  write: true,
  parameters: {
    type: "object",
    properties: {
      sourceInvoiceId: { type: "string" },
      amountMinor: { type: "number" },
      reason: { type: "string" },
      quotationId: { type: "string" },
    },
    required: ["sourceInvoiceId", "amountMinor", "reason"],
  },
  handler: async (args: unknown, ctx: AgentContext) => {
    const { sourceInvoiceId, amountMinor, reason, quotationId } = (args ??
      {}) as {
      sourceInvoiceId: string;
      amountMinor: number;
      reason: string;
      quotationId?: string;
    };

    const qId = quotationId ?? ctx.quotationId;

    return {
      needsApproval: true,
      kind: "CREDIT_NOTE" as const,
      summary: `Credit note of ${amountMinor} minor against invoice ${sourceInvoiceId}: ${reason}`,
      proposedAction: {
        sourceInvoiceId,
        amountMinor: Math.round(amountMinor),
        reason,
        quotationId: qId,
      },
    };
  },
};

export const agent4Tools: AgentTool[] = [
  getSchedule,
  computeProration,
  reconcile,
  draftCreditNote,
];
