import { describe, expect, it } from "vitest";
import { BillingOutput } from "./schema.js";
import { draftCreditNote, getSchedule } from "./tools.js";

describe("Agent 4 — AI Billing Assistant", () => {
  it("validates valid BillingOutput schema with integer minor units", () => {
    const validData = {
      explanation:
        "The customer is billed $120/mo with a mid-cycle upgrade resulting in a $35 prorated charge.",
      prorationBreakdown: [
        {
          periodStart: "2026-09-01T00:00:00.000Z",
          periodEnd: "2026-09-30T23:59:59.999Z",
          amountMinor: 3500,
        },
      ],
      proposedCreditNote: {
        amountMinor: 1500,
        reason: "Billing duplicate during onboarding",
        sourceInvoiceId: "inv-123",
      },
    };

    const parsed = BillingOutput.parse(validData);
    expect(parsed.explanation).toBe(validData.explanation);
    expect(parsed.prorationBreakdown?.[0]?.amountMinor).toBe(3500);
    expect(parsed.proposedCreditNote?.amountMinor).toBe(1500);
  });

  it("fails validation if amountMinor is a float instead of integer", () => {
    const invalidData = {
      explanation: "Float test",
      proposedCreditNote: {
        amountMinor: 15.5,
        reason: "Invalid float",
        sourceInvoiceId: "inv-1",
      },
    };
    expect(() => BillingOutput.parse(invalidData)).toThrow();
  });

  it("draft_credit_note tool unconditionally enforces Finance HITL approval", async () => {
    const ctx = {
      actorId: "rep-1",
      actorRole: "sales_rep",
      agent: "billing",
      runId: "run-billing-1",
      quotationId: "quote-100",
    };

    const result = await draftCreditNote.handler(
      {
        sourceInvoiceId: "inv-abc",
        amountMinor: 4500,
        reason: "Service outage credit",
      },
      ctx,
    );

    expect(result).toMatchObject({
      needsApproval: true,
      kind: "CREDIT_NOTE",
      summary: expect.stringContaining("4500"),
      proposedAction: {
        sourceInvoiceId: "inv-abc",
        amountMinor: 4500,
        reason: "Service outage credit",
        quotationId: "quote-100",
      },
    });
  });

  it("get_billing_schedule tool has correct signature", () => {
    expect(getSchedule.name).toBe("get_billing_schedule");
    expect(getSchedule.parameters).toHaveProperty("required");
  });
});
