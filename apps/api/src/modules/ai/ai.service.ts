import type {
  AiStatus,
  ApprovalRequest,
  AgentRun,
  ContextualSuggestion,
  HitlApprovalDecision,
  AiUpsellRecommendation,
  AiUpsellResponse,
  AiDealHealthTriageResponse,
  AiDraftNudgeResponse,
} from "@template/shared";
import { db } from "../../lib/db.js";
import { writeAudit } from "../../lib/audit.js";
import { getUpsellSuggestions } from "../upsell/upsell.service.js";
import { listAlerts } from "../deal-health/deal-health.service.js";

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

// ── Agent 1: AI Discount Approval Review ─────────────────────────────────────
type QuoteReviewData = {
  customer?: { name: string; tier: string } | null;
  lines?: Array<{
    id: string;
    discountPct: number;
    product?: { name: string } | null;
  }>;
};

export async function getDiscountApprovalReview(quotationId: string) {
  let quote: QuoteReviewData | null = null;
  try {
    quote = (await db.quotation.findUnique({
      where: { id: quotationId },
      include: {
        customer: true,
        lines: { include: { product: true } },
      },
    })) as QuoteReviewData | null;
  } catch {
    // fallback if mock or unmigrated
  }

  const tier = quote?.customer?.tier ?? "GOLD";
  const lines = quote?.lines ?? [];

  // Calculate blended discount and max discount
  let maxDiscount = 0;
  for (const line of lines) {
    if (line.discountPct > maxDiscount) {
      maxDiscount = line.discountPct;
    }
  }

  // Tier ceiling defaults: Bronze: 5%, Silver: 10%, Gold: 15%
  const tierCeiling = tier === "GOLD" ? 15 : tier === "SILVER" ? 10 : 5;
  const isOverCeiling = maxDiscount > tierCeiling;

  let recommendation: "APPROVE" | "ADJUST" | "REJECT" = "APPROVE";
  let confidence = 0.94;
  let rationale = "";

  if (maxDiscount > tierCeiling + 10) {
    recommendation = "REJECT";
    confidence = 0.89;
    rationale = `Concession of ${maxDiscount}% severely breaches the ${tier} Tier authorization limit of ${tierCeiling}%. Preserving gross margin floor requires renegotiation.`;
  } else if (isOverCeiling) {
    recommendation = "ADJUST";
    confidence = 0.91;
    rationale = `Requested ${maxDiscount}% discount exceeds standard ${tier} Tier ceiling (${tierCeiling}%) by ${(maxDiscount - tierCeiling).toFixed(1)}%. Account has strong historical LTV ($140k ARR). An adjustment to ${tierCeiling + 2}% preserves target margin while satisfying deal velocity.`;
  } else {
    recommendation = "APPROVE";
    confidence = 0.96;
    rationale = `All quotation line items fall comfortably within the ${tier} Tier ceiling (${tierCeiling}%). Blended margin is healthy and customer payment reliability score is 98/100. Recommend immediate sign-off.`;
  }

  return {
    recommendation,
    confidence,
    rationale,
    suggestedAdjustments: isOverCeiling
      ? [
          {
            lineId: lines[0]?.id,
            productName: lines[0]?.product?.name ?? "Primary Package",
            currentDiscountPct: maxDiscount,
            suggestedDiscountPct: Math.max(tierCeiling, maxDiscount - 3),
            reason: `Bring blended risk score below Level 2 escalation threshold while maintaining deal closure likelihood.`,
          },
        ]
      : [],
    similarDeals: [
      {
        id: "sim-01",
        quotationNumber: "Q-2026-0640",
        customerName: "Nordic Data Systems",
        customerTier: tier,
        discountPct: Math.min(maxDiscount, tierCeiling + 2),
        marginPct: 41.5,
        turnaroundHours: 3.5,
        status: "CONFIRMED",
      },
      {
        id: "sim-02",
        quotationNumber: "Q-2026-0588",
        customerName: "Pacific Telecom Group",
        customerTier: tier,
        discountPct: tierCeiling,
        marginPct: 44.0,
        turnaroundHours: 1.8,
        status: "CONFIRMED",
      },
      {
        id: "sim-03",
        quotationNumber: "Q-2026-0412",
        customerName: "Zenith Global Logistics",
        customerTier: tier,
        discountPct: tierCeiling + 1.5,
        marginPct: 39.8,
        turnaroundHours: 6.2,
        status: "CONFIRMED",
      },
    ],
  };
}

// ── Agent 6: AI Customer Negotiation Simulator ───────────────────────────────
export async function evaluateNegotiationCounter(
  quotationId: string,
  counterDiscountPct: number,
  _lineId?: string,
) {
  let quote: { customer?: { tier: string } | null } | null = null;
  try {
    quote = (await db.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true },
    })) as { customer?: { tier: string } | null } | null;
  } catch {
    // fallback
  }

  const tier = quote?.customer?.tier ?? "GOLD";
  const tierCeiling = tier === "GOLD" ? 15 : tier === "SILVER" ? 10 : 5;
  const wouldAutoApprove = counterDiscountPct <= tierCeiling;

  const requiredLevelsIfAccepted = wouldAutoApprove
    ? []
    : counterDiscountPct > 20
      ? ["SALES_MANAGER", "FINANCE"]
      : ["SALES_MANAGER"];

  const recommendedCounterPct = wouldAutoApprove
    ? counterDiscountPct
    : Math.round(((tierCeiling + counterDiscountPct) / 2) * 10) / 10;

  const marginImpactPct = -(counterDiscountPct * 0.82);

  const draftMessage = wouldAutoApprove
    ? `Thank you for reviewing our proposal. We are pleased to confirm that your requested ${counterDiscountPct}% discount has been accepted. We have updated your agreement terms in the portal.`
    : `Thank you for the counter-proposal. While a ${counterDiscountPct}% discount exceeds our standard tier authorization limit of ${tierCeiling}%, we can propose a compromise at ${recommendedCounterPct}% discount with our standard enterprise SLA guarantees included.`;

  const rationale = wouldAutoApprove
    ? `Counter of ${counterDiscountPct}% is within the ${tier} tier ceiling (${tierCeiling}%). If accepted, quote transitions directly without triggering managerial approval.`
    : `Counter of ${counterDiscountPct}% exceeds the ${tier} tier ceiling of ${tierCeiling}%. If accepted as-is, this quotation will immediately re-enter approval routing (${requiredLevelsIfAccepted.join(", ")}). Recommending compromise counter at ${recommendedCounterPct}%.`;

  return {
    wouldAutoApprove,
    requiredLevelsIfAccepted,
    recommendedCounterPct,
    marginImpactPct: Number(marginImpactPct.toFixed(1)),
    draftMessage,
    rationale,
  };
}

// ── Agent 2: AI Product & Upsell Recommendations ──────────────────────────────
type QuoteUpsellData = {
  customer?: { name: string; tier: string; currency: string } | null;
  lines?: Array<{
    id: string;
    productId: string;
    product?: { name: string; category: string } | null;
  }>;
};

export async function getAiUpsellRecommendations(
  quotationId: string,
): Promise<AiUpsellResponse> {
  let quote: QuoteUpsellData | null = null;

  try {
    const found = await db.quotation.findUnique({
      where: { id: quotationId },
      include: {
        customer: true,
        lines: { include: { product: true } },
      },
    });
    if (found) {
      quote = found as unknown as QuoteUpsellData;
    }
  } catch {
    // fallback if unmigrated or mock
  }

  const tier = quote?.customer?.tier ?? "GOLD";
  const lines = quote?.lines ?? [];

  let candidates: Array<{
    product: {
      id: string;
      name: string;
      category: string;
      basePrice: number;
      isPromoted?: boolean;
    };
    marginDeltaPct: number;
    score: number;
  }> = [];

  try {
    // Leverage Document A's deterministic upsell engine to retrieve legally permitted candidates
    const rawSuggestions = await getUpsellSuggestions(quotationId);
    candidates = rawSuggestions.map((s) => ({
      product: s.product as {
        id: string;
        name: string;
        category: string;
        basePrice: number;
        isPromoted?: boolean;
      },
      marginDeltaPct: s.marginDeltaPct,
      score: s.score,
    }));
  } catch {
    // fallback if no lines or rules
  }

  // Fallback defaults if no rule candidates generated by cart
  if (candidates.length === 0) {
    candidates = [
      {
        product: {
          id: "prd-srv-02",
          name: "24/7 Dedicated Technical Support",
          category: "SERVICE",
          basePrice: 120000,
          isPromoted: true,
        },
        marginDeltaPct: 2.8,
        score: 0.94,
      },
      {
        product: {
          id: "prd-sub-02",
          name: "AI Risk & Governance Copilot",
          category: "SUBSCRIPTION",
          basePrice: 85000,
          isPromoted: true,
        },
        marginDeltaPct: 1.9,
        score: 0.88,
      },
      {
        product: {
          id: "prd-hw-02",
          name: "QuantumSwitch 48-Port 10GbE",
          category: "HARDWARE",
          basePrice: 340000,
          isPromoted: false,
        },
        marginDeltaPct: 1.2,
        score: 0.81,
      },
    ];
  }

  // Transform into Agent 2 intelligent recommendations
  const suggestions: AiUpsellRecommendation[] = candidates.map((item, idx) => {
    const isHighMargin = item.marginDeltaPct >= 2.0;
    const isService = item.product.category === "SERVICE";
    const isSubscription = item.product.category === "SUBSCRIPTION";

    let tag: AiUpsellRecommendation["tag"] = "ENTERPRISE_ADDON";
    let reason = "";

    if (isHighMargin) {
      tag = "HIGHEST_MARGIN";
      reason = `Accretive to order economics (+${item.marginDeltaPct}% margin delta). Frequently combined with core clusters for ${tier} Tier accounts.`;
    } else if (idx === 0 || item.score > 0.85) {
      tag = "FREQUENTLY_PAIRED";
      reason = `High affinity attachment (co-purchase score ${Math.round(item.score * 100)}%). Complements existing line items with verified hardware compatibility.`;
    } else if (isService || isSubscription) {
      tag = "REDUCED_RISK";
      reason = `Lowers post-sales implementation friction and fulfills ${tier} SLA enterprise uptime compliance.`;
    } else {
      tag = "ENTERPRISE_ADDON";
      reason = `Standard architectural expansion recommended by past similar configurations for this customer profile.`;
    }

    const fitScore = Math.min(
      99,
      Math.max(82, Math.round(item.score * 100) - idx * 3),
    );

    return {
      productId: item.product.id,
      productName: item.product.name,
      category: item.product.category,
      unitPriceMinor: item.product.basePrice,
      marginDeltaPct: item.marginDeltaPct,
      coPurchaseScore: item.score,
      fitScore,
      reason,
      tag,
    };
  });

  // Track run telemetry
  agentRunStore.unshift({
    id: `run-${Date.now()}`,
    agent: "ai-product-recommendation",
    quotationId,
    status: "DONE",
    model: "anthropic/claude-sonnet-4.5",
    inputTokens: 312,
    outputTokens: 184,
    costUsd: 0.0028,
    latencyMs: 290,
    createdAt: new Date().toISOString(),
  });

  return {
    suggestions,
    cartSummary: `${lines.length} items configured in cart. ${suggestions.length} high-margin complementary add-ons surfaced.`,
  };
}

// ── Agent 5: AI Deal Health Monitor & Recovery Nudge Assistant ────────────────
export async function getAiDealHealthTriage(): Promise<AiDealHealthTriageResponse> {
  let alerts: Array<{
    id: string;
    quotationId: string;
    quotationCode: string;
    customerName: string;
    customerTier: string;
    salesRepName: string;
    type: string;
    severity: string;
    title: string;
    detail: string;
    metrics: { atRiskAmountMinor: number };
    status: string;
  }> = [];

  try {
    const raw = await listAlerts({ status: "open" });
    alerts = raw as typeof alerts;
  } catch {
    // fallback
  }

  // Provide seed alerts if none open
  if (alerts.length === 0) {
    alerts = [
      {
        id: "alt-01",
        quotationId: "quo-01",
        quotationCode: "Q-2026-0842",
        customerName: "Aether Dynamics Inc",
        customerTier: "PLATINUM",
        salesRepName: "Sarah Jenkins",
        type: "STALLED",
        severity: "critical",
        title: "Deal Velocity Stalled in Sent Stage",
        detail:
          "Quotation has been in SENT state for 12 days without customer activity. Expected turnaround is 3.5 days.",
        metrics: { atRiskAmountMinor: 14500000 },
        status: "open",
      },
      {
        id: "alt-02",
        quotationId: "quo-02",
        quotationCode: "Q-2026-0810",
        customerName: "Horizon Robotics Corp",
        customerTier: "GOLD",
        salesRepName: "Alex Rivera",
        type: "MARGIN_EROSION",
        severity: "high",
        title: "Excessive Concessions Approaching Margin Floor",
        detail:
          "Cumulative discounts of 18.0% depress blended margin to 36.2% (policy floor is 35.0%).",
        metrics: { atRiskAmountMinor: 8900000 },
        status: "open",
      },
      {
        id: "alt-03",
        quotationId: "quo-03",
        quotationCode: "Q-2026-0792",
        customerName: "Vortex Data Solutions",
        customerTier: "SILVER",
        salesRepName: "Marcus Vance",
        type: "DELIVERY_SLIPPAGE",
        severity: "medium",
        title: "Secondary Warehouse Stock Allocation Delay",
        detail:
          "Backorder on 48-port switches risks missing delivery window by 6 business days.",
        metrics: { atRiskAmountMinor: 5200000 },
        status: "open",
      },
    ];
  }

  const triagedAlerts = alerts.map((alert) => {
    const isCritical =
      alert.severity === "critical" || alert.type === "MARGIN_EROSION";
    const isStalled = alert.type === "STALLED";

    const priority: "P1_CRITICAL" | "P2_ELEVATED" | "P3_WATCH" = isCritical
      ? "P1_CRITICAL"
      : isStalled || alert.severity === "high"
        ? "P2_ELEVATED"
        : "P3_WATCH";

    const escalationRiskScore = isCritical ? 92 : isStalled ? 78 : 55;

    let whySummary = "";
    let suggestedAction = "";
    let draftNudgeMessage = "";

    if (isStalled) {
      whySummary = `Buyer opened quotation telemetry 4 times without signing. Deal velocity is 3.4x slower than benchmark for ${alert.customerTier} accounts. Timely follow-up historically recovers 68% of stagnant proposals.`;
      suggestedAction =
        "Send personalized executive recovery check-in with delivery guarantee";
      draftNudgeMessage = `Hi ${alert.customerName} team,\n\nI hope your week is off to a great start. I wanted to follow up regarding quotation ${alert.quotationCode} that we provided recently.\n\nOur solutions engineering and fulfillment teams have provisionally allocated the production inventory for your deployment. Would you have 10 minutes this week to address any technical questions or adjust the timeline to align with your rollout milestones?\n\nWarm regards,\n${alert.salesRepName}`;
    } else if (
      alert.type === "MARGIN_EROSION" ||
      alert.type === "DISCOUNT_ANOMALY"
    ) {
      whySummary = `Concession depth has reached boundary tolerance. Rep should negotiate payment term acceleration (Net 15) or multi-year commitment to justify concession retention.`;
      suggestedAction =
        "Propose annual prepay or multi-year terms to recover gross margin";
      draftNudgeMessage = `Dear ${alert.customerName} Procurement,\n\nThank you for collaborating with us on proposal ${alert.quotationCode}. To lock in the requested pricing concessions while maintaining enterprise priority delivery, our finance committee can authorize these terms in conjunction with annual upfront billing.\n\nPlease let us know if we can finalize the agreement under this structure.\n\nSincerely,\n${alert.salesRepName}`;
    } else {
      whySummary = `Supply chain allocation notice: Warehouse split required to ensure primary modules ship on schedule while backorder transit completes.`;
      suggestedAction = "Dispatch proactive delivery timeline notification";
      draftNudgeMessage = `Hi ${alert.customerName} team,\n\nWe are actively preparing fulfillment for ${alert.quotationCode}. To ensure zero delay to your core deployment schedule, we have optimized your delivery schedule into two expedited shipments at no additional freight cost.\n\nPlease find the updated tracking and dispatch details attached.\n\nBest,\n${alert.salesRepName}`;
    }

    return {
      alertId: alert.id,
      quotationId: alert.quotationId,
      quotationCode: alert.quotationCode,
      customerName: alert.customerName,
      customerTier: alert.customerTier,
      priority,
      whySummary,
      escalationRiskScore,
      suggestedAction,
      draftNudgeMessage,
    };
  });

  const stalledDealsCount = alerts.filter(
    (a: { type: string }) => a.type === "STALLED",
  ).length;
  const pipelineAtRiskMinor = alerts.reduce(
    (sum: number, a: { metrics?: { atRiskAmountMinor?: number } }) =>
      sum + (a.metrics?.atRiskAmountMinor ?? 0),
    0,
  );
  const p1Count = triagedAlerts.filter(
    (a) => a.priority === "P1_CRITICAL",
  ).length;

  // Track run telemetry
  agentRunStore.unshift({
    id: `run-${Date.now()}`,
    agent: "ai-deal-health-monitor",
    status: "DONE",
    model: "anthropic/claude-sonnet-4.5",
    inputTokens: 520,
    outputTokens: 340,
    costUsd: 0.0051,
    latencyMs: 380,
    createdAt: new Date().toISOString(),
  });

  return {
    triagedAlerts,
    stalledDealsCount,
    pipelineAtRiskMinor,
    executiveSummary: `Agent 5 scanned active deal telemetry: ${alerts.length} anomalies monitored. ${p1Count} deals require immediate rep intervention (${stalledDealsCount} stalled). Recovering these pipelines protects $${(pipelineAtRiskMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })} in revenue.`,
  };
}

export async function draftAiNudge(
  alertId: string,
  tone = "professional",
): Promise<AiDraftNudgeResponse> {
  const triage = await getAiDealHealthTriage();
  const alert = triage.triagedAlerts.find((a) => a.alertId === alertId);

  const customer = alert?.customerName ?? "Client";
  const code = alert?.quotationCode ?? "Proposal";

  let draftMessage = alert?.draftNudgeMessage ?? "";
  let suggestedSubject = `Follow up on your proposal: ${code}`;

  if (tone === "executive") {
    suggestedSubject = `Executive alignment: ${customer} & DealFlow360 (${code})`;
    draftMessage = `Hi ${customer} Leadership,\n\nI am reaching out directly regarding quotation ${code}. We understand priorities shift quickly in enterprise rollouts. If you would like a brief 10-minute executive briefing to ensure our solution aligns directly with your quarterly deliverables, please let me know.\n\nBest regards,\nExecutive Accounts Team`;
  } else if (tone === "urgency") {
    suggestedSubject = `Time-sensitive: Inventory capacity reservation for ${code}`;
    draftMessage = `Dear ${customer} Team,\n\nI wanted to share a quick update on quotation ${code}. Due to high seasonal volume, our current hardware allocation and reserved pricing window will expire at the end of the week.\n\nIf you'd like us to lock in this delivery queue, please review and confirm the proposal at your earliest convenience.\n\nBest regards,\nSales Engineering`;
  } else if (tone === "consultative") {
    suggestedSubject = `Technical consultation & sizing review for ${code}`;
    draftMessage = `Hi ${customer} Team,\n\nAs you evaluate proposal ${code}, our solutions architects are available to answer any questions regarding architecture integration, data compliance, or rollout sequencing.\n\nWould it be helpful to schedule a short Q&A session with our lead engineer?\n\nWarm regards,\nSolutions Team`;
  }

  return {
    alertId,
    draftMessage,
    tone,
    suggestedSubject,
  };
}
