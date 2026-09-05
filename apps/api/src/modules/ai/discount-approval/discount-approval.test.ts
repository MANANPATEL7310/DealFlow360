import type { Request, Response } from "express";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DiscountApprovalOutput } from "./schema.js";
import { agent1Tools } from "./tools.js";
import { reviewDiscountController } from "./controller.js";
import * as flags from "../../../ai/flags.js";
import * as runner from "../../../ai/agent-runner.js";
import * as prompts from "../../../ai/prompts.js";
import * as context from "./context.js";

describe("Agent 1 — AI Discount Approval Assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates DiscountApprovalOutput schema correctly", () => {
    const valid = {
      recommendation: "APPROVE" as const,
      rationale: "Within category ceiling and low blended risk",
      suggestedAdjustments: [{ lineId: "line-1", toDiscountPct: 8 }],
      confidence: 0.92,
    };
    expect(DiscountApprovalOutput.parse(valid)).toEqual(valid);

    const invalid = {
      recommendation: "MAYBE", // invalid enum
      rationale: "",
      confidence: 1.5, // out of range
    };
    expect(() => DiscountApprovalOutput.parse(invalid)).toThrow();
  });

  it("ensures all agent1Tools are strictly read-only (no write tools)", () => {
    for (const tool of agent1Tools) {
      expect(Boolean(tool.write)).toBe(false);
    }
  });

  it("returns { aiAvailable: false } gracefully when feature flag is off", async () => {
    vi.spyOn(flags, "aiAgentEnabled").mockResolvedValue(false);

    const req = {
      params: { quotationId: "q-1" },
    } as unknown as Request;

    let jsonResult: unknown = null;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((payload) => {
        jsonResult = payload;
      }),
    } as unknown as Response;

    await reviewDiscountController(req, res);

    expect(jsonResult).toEqual(
      expect.objectContaining({
        success: true,
        data: { aiAvailable: false },
      }),
    );
  });

  it("runs agent loop and returns structured output when enabled", async () => {
    vi.spyOn(flags, "aiAgentEnabled").mockResolvedValue(true);
    vi.spyOn(prompts, "loadActivePrompt").mockResolvedValue({
      system: "System prompt for discount approval",
      version: 1,
    });
    vi.spyOn(context, "buildDiscountTaskPrompt").mockResolvedValue(
      JSON.stringify({ quotationId: "q-1" }),
    );
    vi.spyOn(runner, "runAgent").mockResolvedValue({
      status: "DONE",
      result: {
        recommendation: "ADJUST",
        rationale: "Line 2 breaches category ceiling of 10%",
        suggestedAdjustments: [{ lineId: "line-2", toDiscountPct: 10 }],
        confidence: 0.95,
      },
    });

    const req = {
      params: { quotationId: "q-1" },
      user: { sub: "mgr-1", role: "sales_manager" },
    } as unknown as Request;

    let jsonResult: unknown = null;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((payload) => {
        jsonResult = payload;
      }),
    } as unknown as Response;

    await reviewDiscountController(req, res);

    expect(jsonResult).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          aiAvailable: true,
          status: "DONE",
          recommendation: "ADJUST",
          suggestedAdjustments: [{ lineId: "line-2", toDiscountPct: 10 }],
        }),
      }),
    );
  });

  it("degrades gracefully to { aiAvailable: false } on AI_BUDGET_EXCEEDED", async () => {
    vi.spyOn(flags, "aiAgentEnabled").mockResolvedValue(true);
    vi.spyOn(prompts, "loadActivePrompt").mockResolvedValue({
      system: "System prompt",
      version: 1,
    });
    vi.spyOn(context, "buildDiscountTaskPrompt").mockResolvedValue("{}");
    vi.spyOn(runner, "runAgent").mockRejectedValue(
      Object.assign(new Error("AI_BUDGET_EXCEEDED"), { http: 402 }),
    );

    const req = {
      params: { quotationId: "q-1" },
    } as unknown as Request;

    let jsonResult: unknown = null;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((payload) => {
        jsonResult = payload;
      }),
    } as unknown as Response;

    await reviewDiscountController(req, res);

    expect(jsonResult).toEqual(
      expect.objectContaining({
        success: true,
        data: {
          aiAvailable: false,
          reason: "AI_BUDGET_EXCEEDED",
        },
      }),
    );
  });
});
