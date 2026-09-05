import type {
  AiStatus,
  ApprovalRequest,
  AgentRun,
  ContextualSuggestion,
  HitlApprovalDecision,
} from "@template/shared";
import { db } from "../../lib/db.js";
import { writeAudit } from "../../lib/audit.js";

// In-memory persistent state for HITL queue during runtime
const hitlApprovalStore: Map<string, ApprovalRequest> = new Map();
const agentRunStore: AgentRun[] = [];

// Seed initial HITL items so the UI is immediately testable and vivid
function initializeStore() {
  if (hitlApprovalStore.size > 0) return;

  const initialRequests: ApprovalRequest[] = [
    {
      id: "hitl-001",
      agent: "discount-approval",
      runId: "run-001",
      quotationId: "q-mock-01",
      quotationNumber: "Q-2026-0891",
      customerName: "Acme Cloud Infrastructure",
      kind: "DISCOUNT",
      summary:
        "Agent recommends approving 18.5% blended discount (exceeds 15% tier ceiling by 3.5%) based on $125k ARR historical contract value.",
      rationale:
        "Blended margin remains robust at 42.1% (min policy is 35%). Historical LTV is in 95th percentile with 0 late payments.",
      proposedAction: {
        action: "CONFIRM_DISCOUNT_EXCEPTION",
        requestedDiscountPct: 18.5,
        policyCeilingPct: 15.0,
        marginPct: 42.1,
        requiresLevel: "SALES_MANAGER",
        suggestedCounterPct: 16.5,
      },
      status: "PENDING",
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: "hitl-002",
      agent: "billing-assistant",
      runId: "run-002",
      quotationId: "q-mock-02",
      quotationNumber: "Q-2026-0877",
      customerName: "Nordic Data Systems",
      kind: "CREDIT_NOTE",
      summary:
        "Draft credit note for mid-cycle billing downgrade on Pro Tier licenses (14 unused days).",
      rationale:
        "Authoritative proration engine computes exactly $437.50 credit. Verified against active payment intent and invoice #INV-4019.",
      proposedAction: {
        action: "DRAFT_CREDIT_NOTE",
        amountMinor: 43750,
        currency: "USD",
        sourceInvoiceId: "inv-4019",
        reason:
          "Mid-cycle seat reduction (5 seats, 14 days remaining in cycle)",
      },
      status: "PENDING",
      createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    },
    {
      id: "hitl-003",
      agent: "deal-health-monitor",
      runId: "run-003",
      quotationId: "q-mock-03",
      quotationNumber: "Q-2026-0842",
      customerName: "Zenith Retail Group",
      kind: "NUDGE",
      summary:
        "Draft executive follow-up nudge for deal stalled in 'Sent' stage for 11 days (expected turnaround: 4 days).",
      rationale:
        "Stall risk score 78/100. Contact opened quote 4 times yesterday without signing. Timely executive nudge boosts close probability by +34%.",
      proposedAction: {
        action: "SEND_OUTBOUND_NUDGE",
        channel: "EMAIL",
        recipient: "procurement@zenithretail.com",
        subject: "Follow-up regarding DealFlow360 Enterprise Deployment Terms",
        draftBody:
          "Hi Sarah,\n\nFollowing up on our Enterprise proposal sent last week. We noticed your team was reviewing the deployment timeline. I can arrange a quick 15-minute call with our solutions architect tomorrow to finalize any hardware provisioning questions.\n\nBest regards,\nSales Operations Team",
      },
      status: "PENDING",
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      id: "hitl-004",
      agent: "fulfillment-planner",
      runId: "run-004",
      quotationId: "q-mock-04",
      quotationNumber: "Q-2026-0865",
      customerName: "Pacific Logistics Ltd",
      kind: "FULFILLMENT_OVERRIDE",
      summary:
        "Cross-dock split override: route 30 units from Secondary East Warehouse to prevent 18-day backorder penalty.",
      rationale:
        "Estimated incremental freight cost is $120.00 (within override tolerance band). Prevents contract SLA breach penalty of $1,500.",
      proposedAction: {
        action: "OVERRIDE_SPLIT_ALLOCATION",
        primaryWarehouseId: "wh-west",
        secondaryWarehouseId: "wh-east",
        unitsShifted: 30,
        incrementalShippingCostMinor: 12000,
        estimatedDeliveryDays: 2,
      },
      status: "PENDING",
      createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    },
    {
      id: "hitl-005",
      agent: "negotiation-assistant",
      runId: "run-005",
      quotationId: "q-mock-05",
      quotationNumber: "Q-2026-0902",
      customerName: "Apex BioTech Partners",
      kind: "NEGOTIATION",
      summary:
        "Customer portal counter-offer: Requested 22% discount on Annual Subscription. Agent drafts counter at 17.5% with 2-year commit.",
      rationale:
        "Customer ask would fail governance ceilings and require Finance VP escalation. Proposed counter auto-approves within Sales Manager tier.",
      proposedAction: {
        action: "SEND_PORTAL_COUNTER",
        customerRequestedDiscountPct: 22.0,
        proposedCounterDiscountPct: 17.5,
        requiredCommitmentMonths: 24,
        wouldAutoApprove: true,
        draftMessage:
          "Thank you for the counter-proposal. While a 22% discount is outside our standard annual authorization limits, we can offer a 17.5% discount locked in for a 24-month agreement, inclusive of priority onboarding support.",
      },
      status: "PENDING",
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  ];

  for (const req of initialRequests) {
    hitlApprovalStore.set(req.id, req);
  }

  // Seed sample agent runs
  agentRunStore.push(
    {
      id: "run-001",
      agent: "discount-approval",
      quotationId: "q-mock-01",
      status: "PAUSED_FOR_APPROVAL",
      model: "anthropic/claude-sonnet-4.5",
      inputTokens: 1420,
      outputTokens: 380,
      costUsd: 0.0098,
      latencyMs: 1420,
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: "run-002",
      agent: "billing-assistant",
      quotationId: "q-mock-02",
      status: "PAUSED_FOR_APPROVAL",
      model: "anthropic/claude-sonnet-4.5",
      inputTokens: 980,
      outputTokens: 240,
      costUsd: 0.0065,
      latencyMs: 980,
      createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    },
    {
      id: "run-006",
      agent: "product-recommendation",
      quotationId: "q-mock-01",
      status: "DONE",
      model: "anthropic/claude-sonnet-4.5",
      inputTokens: 850,
      outputTokens: 195,
      costUsd: 0.0051,
      latencyMs: 760,
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: "run-007",
      agent: "sales-insights",
      quotationId: null,
      status: "DONE",
      model: "anthropic/claude-sonnet-4.5",
      inputTokens: 1200,
      outputTokens: 410,
      costUsd: 0.0089,
      latencyMs: 1150,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  );
}

// Ensure store is initialized
initializeStore();

export async function getAiStatus(): Promise<AiStatus> {
  let isAiEnabled = false;
  try {
    const row = await db.systemSetting.findUnique({
      where: { key: "ai.enabled" },
    });
    if (row) {
      const parsed = JSON.parse(row.value);
      isAiEnabled = Boolean(parsed);
    }
  } catch {
    isAiEnabled = true;
  }

  // Calculate month-to-date spend from stored runs
  const totalCost = agentRunStore.reduce((sum, r) => sum + r.costUsd, 0.0303);

  return {
    enabled: isAiEnabled,
    aiAvailable: isAiEnabled,
    monthlyBudgetUsd: 50.0,
    spendUsd: Number(totalCost.toFixed(4)),
    activeModel: "anthropic/claude-sonnet-4.5",
    degradedReason: !isAiEnabled
      ? "AI features disabled in system settings. Running in deterministic fallback mode."
      : null,
    agentFlags: {
      "discount-approval": true,
      "product-recommendation": true,
      "fulfillment-planner": true,
      "billing-assistant": true,
      "deal-health-monitor": true,
      "negotiation-assistant": true,
      "sales-insights": true,
    },
  };
}

export async function listApprovalRequests(
  status?: string,
): Promise<ApprovalRequest[]> {
  initializeStore();
  const all = Array.from(hitlApprovalStore.values());
  if (!status) return all;
  return all.filter((r) => r.status.toLowerCase() === status.toLowerCase());
}

export async function decideApprovalRequest(
  id: string,
  decision: HitlApprovalDecision,
  actorId?: string,
): Promise<ApprovalRequest> {
  initializeStore();
  const req = hitlApprovalStore.get(id);
  if (!req) {
    throw Object.assign(new Error("APPROVAL_REQUEST_NOT_FOUND"), { http: 404 });
  }

  const updated: ApprovalRequest = {
    ...req,
    status: decision.decision,
    decidedBy: actorId ?? "sales_manager_user",
    decidedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    proposedAction: decision.modifiedAction ?? req.proposedAction,
  };

  hitlApprovalStore.set(id, updated);

  // Write immutable compliance audit log
  await writeAudit({
    actorId,
    actorKind: "user",
    action: `ai.hitl.${decision.decision.toLowerCase()}`,
    entity: "ApprovalRequest",
    entityId: id,
    reason: decision.reason ?? `HITL decision: ${decision.decision}`,
    diff: {
      before: { status: req.status },
      after: { status: updated.status, proposedAction: updated.proposedAction },
    },
  });

  return updated;
}

export async function listAgentRuns(limit = 20): Promise<AgentRun[]> {
  initializeStore();
  return agentRunStore.slice(0, limit);
}

export async function getContextualSuggestions(
  path: string,
): Promise<ContextualSuggestion[]> {
  if (path.includes("quotations/new") || path.includes("quotations/")) {
    return [
      {
        id: "sug-01",
        agent: "product-recommendation",
        title: "High-affinity add-on detected",
        description:
          "Adding 'Premium 24/7 SLA Support' boosts order margin by +2.4% while remaining under customer tier discount threshold.",
        actionLabel: "View Upsell Candidates",
        actionType: "NAVIGATE_UPSELL",
        confidence: 0.92,
      },
      {
        id: "sug-02",
        agent: "discount-approval",
        title: "Discount ceiling check",
        description:
          "Current quote lines average 11.2% discount. Well within Gold Tier 15% ceiling; no manager approval escalation triggered.",
        actionLabel: "Simulate Margin Risk",
        actionType: "SIMULATE_RISK",
        confidence: 0.98,
      },
    ];
  }

  if (path.includes("approvals")) {
    return [
      {
        id: "sug-03",
        agent: "discount-approval",
        title: "3 Deals with similar risk profile",
        description:
          "Historically, quotes with 15–18% discount for Gold Tier closed within 5 days with zero payment default.",
        actionLabel: "Compare Historical Deals",
        actionType: "VIEW_RAG_COMPARISON",
        confidence: 0.88,
      },
    ];
  }

  if (path.includes("deal-health")) {
    return [
      {
        id: "sug-04",
        agent: "deal-health-monitor",
        title: "2 High-probability recovery targets",
        description:
          "Quotes #Q-2026-0842 and #Q-2026-0810 are stalled. Sending AI personalized nudges typically re-engages buyers within 48 hours.",
        actionLabel: "Review Draft Nudges",
        actionType: "OPEN_NUDGE_MODAL",
        confidence: 0.85,
      },
    ];
  }

  if (path.includes("billing")) {
    return [
      {
        id: "sug-05",
        agent: "billing-assistant",
        title: "Upcoming subscription billing cycle",
        description:
          "14 annual recurring contracts renew in the next 30 days ($38,400 projected invoice value). All schedules verified.",
        actionLabel: "Inspect Schedule",
        actionType: "VIEW_SCHEDULE",
        confidence: 0.95,
      },
    ];
  }

  return [
    {
      id: "sug-00",
      agent: "sales-insights",
      title: "Pipeline velocity insight",
      description:
        "Average quotation turnaround time decreased by 18% this month. Hardware deals have the fastest approval-to-confirm cycle.",
      actionLabel: "Open Sales Intelligence",
      actionType: "OPEN_INSIGHTS",
      confidence: 0.94,
    },
  ];
}
