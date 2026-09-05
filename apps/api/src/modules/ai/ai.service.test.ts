import { describe, expect, it } from "vitest";
import {
  getAiStatus,
  listApprovalRequests,
  decideApprovalRequest,
  listAgentRuns,
  getContextualSuggestions,
  getDiscountApprovalReview,
  evaluateNegotiationCounter,
  getAiUpsellRecommendations,
  getAiDealHealthTriage,
  draftAiNudge,
  getAiFulfillmentProposal,
  getAiBillingExplanation,
  draftAiCreditNote,
  evaluateAiReportQuery,
  updateAiConfig,
} from "./ai.service.js";

describe("Agentic AI Layer — End-to-End Service Tests", () => {
  it("Phase 6: getAiStatus returns active model, monthly budget, and per-agent flags", async () => {
    const status = await getAiStatus();
    expect(status).toBeDefined();
    expect(status.monthlyBudgetUsd).toBeGreaterThan(0);
    expect(status.activeModel).toContain("claude");
    expect(status.agentFlags).toHaveProperty("discount-approval");
    expect(status.agentFlags).toHaveProperty("billing-assistant");
    expect(status.agentFlags).toHaveProperty("fulfillment-planner");
  });

  it("Phase 6: updateAiConfig dynamically updates budget cap and agent flags", async () => {
    const updated = await updateAiConfig(
      {
        monthlyBudgetUsd: 75.0,
        agentFlags: { "discount-approval": true },
      },
      "usr-admin",
    );
    expect(updated.monthlyBudgetUsd).toBe(75.0);
    expect(updated.agentFlags?.["discount-approval"]).toBe(true);
  });

  it("Phase 1: listApprovalRequests and decideApprovalRequest manage HITL queue", async () => {
    const approvals = await listApprovalRequests();
    expect(Array.isArray(approvals)).toBe(true);
    expect(approvals.length).toBeGreaterThan(0);

    const first = approvals[0]!;
    const decided = await decideApprovalRequest(
      first.id,
      { decision: "APPROVED", reason: "Verified compliance with governance" },
      "usr-mgr",
    );
    expect(decided.status).toBe("APPROVED");
  });

  it("Phase 1: listAgentRuns returns execution telemetry traces", async () => {
    const runs = await listAgentRuns(10);
    expect(Array.isArray(runs)).toBe(true);
    if (runs.length > 0) {
      expect(runs[0]).toHaveProperty("agent");
      expect(runs[0]).toHaveProperty("latencyMs");
      expect(runs[0]).toHaveProperty("costUsd");
    }
  });

  it("Phase 1: getContextualSuggestions returns intelligent suggestions by screen route", async () => {
    const quoteSugs = await getContextualSuggestions("/app/quotations/q-01");
    expect(quoteSugs.length).toBeGreaterThan(0);
    expect(quoteSugs[0]).toHaveProperty("actionType");

    const approvalSugs = await getContextualSuggestions("/app/approvals");
    expect(approvalSugs.length).toBeGreaterThan(0);

    const billingSugs = await getContextualSuggestions("/app/billing");
    expect(billingSugs.length).toBeGreaterThan(0);
  });

  it("Agent 1: getDiscountApprovalReview computes governance review & RAG deals", async () => {
    const review = await getDiscountApprovalReview("quo-sample-01");
    expect(["APPROVE", "ADJUST", "REJECT"]).toContain(review.recommendation);
    expect(review.confidence).toBeGreaterThan(0.5);
    expect(review.rationale.length).toBeGreaterThan(20);
    expect(Array.isArray(review.similarDeals)).toBe(true);
  });

  it("Agent 6: evaluateNegotiationCounter accurately simulates buyer concession impact", async () => {
    const autoApproved = await evaluateNegotiationCounter("quo-sample-01", 5);
    expect(autoApproved.wouldAutoApprove).toBe(true);
    expect(autoApproved.requiredLevelsIfAccepted.length).toBe(0);

    const escalated = await evaluateNegotiationCounter("quo-sample-01", 25);
    expect(escalated.wouldAutoApprove).toBe(false);
    expect(escalated.requiredLevelsIfAccepted.length).toBeGreaterThan(0);
    expect(escalated.marginImpactPct).toBeLessThan(0);
    expect(escalated.draftMessage.length).toBeGreaterThan(20);
  });

  it("Agent 2: getAiUpsellRecommendations ranks complementary add-ons with tags", async () => {
    const res = await getAiUpsellRecommendations("quo-sample-01");
    expect(Array.isArray(res.suggestions)).toBe(true);
    expect(res.suggestions.length).toBeGreaterThan(0);
    expect(res.suggestions[0]).toHaveProperty("tag");
    expect(res.suggestions[0]).toHaveProperty("marginDeltaPct");
    expect(res.suggestions[0]).toHaveProperty("fitScore");
  });

  it("Agent 5: getAiDealHealthTriage triages anomalies and computes pipeline at risk", async () => {
    const triage = await getAiDealHealthTriage();
    expect(Array.isArray(triage.triagedAlerts)).toBe(true);
    expect(triage.triagedAlerts.length).toBeGreaterThan(0);
    expect(triage.executiveSummary.length).toBeGreaterThan(20);
    expect(triage.triagedAlerts[0]).toHaveProperty("priority");
    expect(triage.triagedAlerts[0]).toHaveProperty("escalationRiskScore");
  });

  it("Agent 5: draftAiNudge generates personalized buyer follow-up across tones", async () => {
    const triage = await getAiDealHealthTriage();
    const alertId = triage.triagedAlerts[0]!.alertId;

    const prof = await draftAiNudge(alertId, "professional");
    expect(prof.draftMessage.length).toBeGreaterThan(20);

    const exec = await draftAiNudge(alertId, "executive");
    expect(exec.suggestedSubject).toContain("Executive");

    const urg = await draftAiNudge(alertId, "urgency");
    expect(urg.suggestedSubject).toContain("Time-sensitive");
  });

  it("Agent 3: getAiFulfillmentProposal calculates multi-warehouse split & freight savings", async () => {
    const proposal = await getAiFulfillmentProposal("quo-sample-01");
    expect(Array.isArray(proposal.proposedSplits)).toBe(true);
    expect(proposal.tradeoffScore).toBeGreaterThan(50);
    expect(proposal.rationale.length).toBeGreaterThan(20);
  });

  it("Agent 4: getAiBillingExplanation explains hybrid billing schedules & proration", async () => {
    const explanation = await getAiBillingExplanation("quo-sample-01");
    expect(explanation.executiveSummary.length).toBeGreaterThan(20);
    expect(explanation.upfrontChargesBreakdown.length).toBeGreaterThan(10);
    expect(explanation.recurringSchedulesBreakdown.length).toBeGreaterThan(10);
    expect(explanation.prorationPolicyVerified).toBe(true);
  });

  it("Agent 4: draftAiCreditNote stages credit notes into the Finance HITL queue", async () => {
    const res = await draftAiCreditNote(
      {
        quotationId: "quo-sample-01",
        scheduleId: "sch-01",
        sourceInvoiceId: "inv-01",
        suggestedAmountMinor: 15000,
        reason: "Mid-cycle subscription license adjustment",
      },
      "usr-finance-01",
    );
    expect(res.stagedInHitlQueue).toBe(true);
    expect(res.approvalRequestId).toContain("hitl-cn-");

    const approvals = await listApprovalRequests();
    const found = approvals.find((a) => a.id === res.approvalRequestId);
    expect(found).toBeDefined();
    expect(found?.kind).toBe("CREDIT_NOTE");
  });

  it("Agent 7: evaluateAiReportQuery synthesizes conversational sales analytics", async () => {
    const res = await evaluateAiReportQuery(
      "Show me hardware deals in Q3 with discount erosion",
      undefined,
      "sales_manager",
      "usr-01",
    );
    expect(res.queryIntent.length).toBeGreaterThan(10);
    expect(res.appliedFilters.category).toBe("HARDWARE");
    expect(res.executiveNarrative.length).toBeGreaterThan(30);
    expect(Array.isArray(res.keyTakeaways)).toBe(true);
    expect(Array.isArray(res.recommendedActions)).toBe(true);
    expect(res.confidenceScore).toBeGreaterThan(0.8);
  });
});
