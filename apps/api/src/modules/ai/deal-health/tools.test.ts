import { describe, expect, it } from "vitest";
import { draftNudge } from "./tools.js";

describe("AI deal health tools", () => {
  it("always routes drafted nudges to human approval", async () => {
    await expect(
      draftNudge.handler(
        {
          alertId: "alert-1",
          quotationId: "quote-1",
          message: "Can we reconnect this week?",
        },
        {
          actorId: "rep-1",
          actorRole: "sales_rep",
          agent: "deal-health",
          runId: "run-1",
        },
      ),
    ).resolves.toMatchObject({
      needsApproval: true,
      kind: "NUDGE",
      proposedAction: {
        alertId: "alert-1",
        quotationId: "quote-1",
        channel: "CUSTOMER_EMAIL",
        message: "Can we reconnect this week?",
      },
    });
  });
});
