import type { Request, Response } from "express";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NegotiationOutput } from "./schema.js";
import { draftResponseTool } from "./tools.js";
import { assistNegotiationController } from "./controller.js";
import * as flags from "../../../ai/flags.js";
import * as runner from "../../../ai/agent-runner.js";
import * as prompts from "../../../ai/prompts.js";
import * as context from "./context.js";

describe("Agent 6 — AI Customer Negotiation Assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates NegotiationOutput schema correctly", () => {
    const valid = {
      draftMessage: "We can offer a 10% discount on the hardware package.",
      recommendedCounterPct: 10,
      wouldAutoApprove: true,
      requiredLevelsIfAccepted: [],
    };
    expect(NegotiationOutput.parse(valid)).toEqual(valid);

    const invalid = {
      draftMessage: "", // empty string not allowed
      wouldAutoApprove: false,
      requiredLevelsIfAccepted: "none", // must be array
    };
    expect(() => NegotiationOutput.parse(invalid)).toThrow();
  });

  it("ensures draftResponseTool has write: true and returns needsApproval: true with kind NEGOTIATION", async () => {
    expect(draftResponseTool.write).toBe(true);

    const res = (await draftResponseTool.handler(
      {
        requestId: "req-1",
        draftMessage: "Here is our counter",
        recommendedCounterPct: 12,
      },
      { actorId: "rep-1", agent: "negotiation", runId: "run-1" },
    )) as {
      needsApproval: boolean;
      kind: string;
      proposedAction: unknown;
    };

    expect(res.needsApproval).toBe(true);
    expect(res.kind).toBe("NEGOTIATION");
    expect(res.proposedAction).toEqual({
      requestId: "req-1",
      draftMessage: "Here is our counter",
      recommendedCounterPct: 12,
    });
  });

  it("returns { aiAvailable: false } gracefully when feature flag is off", async () => {
    vi.spyOn(flags, "aiAgentEnabled").mockResolvedValue(false);

    const req = {
      params: { requestId: "neg-1" },
    } as unknown as Request;

    let jsonResult: unknown = null;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((payload) => {
        jsonResult = payload;
      }),
    } as unknown as Response;

    await assistNegotiationController(req, res);

    expect(jsonResult).toEqual(
      expect.objectContaining({
        success: true,
        data: { aiAvailable: false },
      }),
    );
  });

  it("runs agent loop and returns PAUSED_FOR_APPROVAL when drafting response", async () => {
    vi.spyOn(flags, "aiAgentEnabled").mockResolvedValue(true);
    vi.spyOn(prompts, "loadActivePrompt").mockResolvedValue({
      system: "Negotiation assistant system prompt",
      version: 1,
    });
    vi.spyOn(context, "buildNegotiationTaskPrompt").mockResolvedValue(
      JSON.stringify({ requestId: "neg-1" }),
    );
    vi.spyOn(runner, "runAgent").mockResolvedValue({
      status: "PAUSED_FOR_APPROVAL",
      approvalRequestId: "ar-neg-1",
    });

    const req = {
      params: { requestId: "neg-1" },
      user: { sub: "rep-1", role: "sales_rep" },
    } as unknown as Request;

    let jsonResult: unknown = null;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((payload) => {
        jsonResult = payload;
      }),
    } as unknown as Response;

    await assistNegotiationController(req, res);

    expect(jsonResult).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          aiAvailable: true,
          status: "PAUSED_FOR_APPROVAL",
          approvalRequestId: "ar-neg-1",
        }),
      }),
    );
  });
});
