import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";
import { runAgent } from "./agent-runner.js";
import type { AgentTool } from "./tools/types.js";
import type { db } from "../lib/db.js";
import type { llm } from "./llm.js";

describe("Agent Runner (runAgent)", () => {
  const dummySchema = z.object({
    recommendation: z.string(),
    score: z.number(),
  });

  const mockDb = {
    agentRun: {
      create: vi.fn(async ({ data }) => ({
        id: "run-mock-1",
        ...data,
      })),
      update: vi.fn(async () => ({})),
      aggregate: vi.fn(async () => ({ _sum: { costUsd: 0 } })),
    },
    agentStep: {
      create: vi.fn(async () => ({})),
    },
    approvalRequest: {
      create: vi.fn(async ({ data }) => ({
        id: "ar-mock-1",
        ...data,
      })),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes directly when LLM returns structured answer without tools", async () => {
    const mockLlm = {
      chat: {
        completions: {
          create: vi.fn(async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: JSON.stringify({
                    recommendation: "APPROVE",
                    score: 0.95,
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 20, completion_tokens: 15 },
          })),
        },
      },
    };

    const res = await runAgent({
      agent: "test-agent",
      system: "You are a test assistant.",
      user: "Please evaluate test@domain.com",
      tools: [],
      outputSchema: dummySchema,
      ctx: { actorId: "user-1", agent: "test-agent", quotationId: "q-1" },
      client: mockDb as unknown as typeof db,
      llmClient: mockLlm as unknown as typeof llm,
    });

    expect(res.status).toBe("DONE");
    expect(res.result).toEqual({ recommendation: "APPROVE", score: 0.95 });
    expect(mockDb.agentRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        agent: "test-agent",
        status: "RUNNING",
        quotationId: "q-1",
      }),
    });
    expect(mockDb.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run-mock-1" },
        data: expect.objectContaining({
          status: "DONE",
          result: { recommendation: "APPROVE", score: 0.95 },
        }),
      }),
    );
  });

  it("handles markdown code-fenced json responses from LLM", async () => {
    const mockLlm = {
      chat: {
        completions: {
          create: vi.fn(async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  content:
                    "```json\n" +
                    JSON.stringify({
                      recommendation: "REJECT",
                      score: 0.2,
                    }) +
                    "\n```",
                },
              },
            ],
            usage: { prompt_tokens: 25, completion_tokens: 20 },
          })),
        },
      },
    };

    const res = await runAgent({
      agent: "test-agent",
      system: "You are a test assistant.",
      user: "Assess this",
      tools: [],
      outputSchema: dummySchema,
      ctx: { actorId: "user-1", agent: "test-agent" },
      client: mockDb as unknown as typeof db,
      llmClient: mockLlm as unknown as typeof llm,
    });

    expect(res.status).toBe("DONE");
    expect(res.result).toEqual({ recommendation: "REJECT", score: 0.2 });
  });

  it("runs tool loop and finishes with DONE", async () => {
    const mockTool: AgentTool = {
      name: "fetch_customer_metric",
      description: "Gets metrics",
      parameters: { type: "object", properties: {}, required: [] },
      handler: vi.fn(async () => ({ tenureMonths: 24 })),
    };

    let callCount = 0;
    const mockLlm = {
      chat: {
        completions: {
          create: vi.fn(async () => {
            callCount++;
            if (callCount === 1) {
              return {
                choices: [
                  {
                    message: {
                      role: "assistant",
                      tool_calls: [
                        {
                          id: "call_1",
                          type: "function",
                          function: {
                            name: "fetch_customer_metric",
                            arguments: "{}",
                          },
                        },
                      ],
                    },
                  },
                ],
                usage: { prompt_tokens: 30, completion_tokens: 10 },
              };
            }
            return {
              choices: [
                {
                  message: {
                    role: "assistant",
                    content: JSON.stringify({
                      recommendation: "APPROVE",
                      score: 0.88,
                    }),
                  },
                },
              ],
              usage: { prompt_tokens: 40, completion_tokens: 15 },
            };
          }),
        },
      },
    };

    const res = await runAgent({
      agent: "test-agent",
      system: "Sys",
      user: "User",
      tools: [mockTool],
      outputSchema: dummySchema,
      ctx: { actorId: "user-1", agent: "test-agent", quotationId: "q-1" },
      client: mockDb as unknown as typeof db,
      llmClient: mockLlm as unknown as typeof llm,
    });

    expect(mockTool.handler).toHaveBeenCalledTimes(1);
    expect(res.status).toBe("DONE");
    expect(res.result).toEqual({ recommendation: "APPROVE", score: 0.88 });
  });

  it("pauses run when write tool returns needsApproval: true (HITL governance gate)", async () => {
    const mockWriteTool: AgentTool = {
      name: "propose_discount_adjustment",
      description: "Proposes discount",
      write: true,
      parameters: {
        type: "object",
        properties: {
          lineId: { type: "string" },
          discountPct: { type: "number" },
        },
        required: ["lineId", "discountPct"],
      },
      handler: vi.fn(async () => ({
        needsApproval: true,
        kind: "DISCOUNT" as const,
        summary: "Suggest 12% discount on line-1",
        proposedAction: { lineId: "line-1", discountPct: 12 },
      })),
    };

    const mockLlm = {
      chat: {
        completions: {
          create: vi.fn(async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  tool_calls: [
                    {
                      id: "call_write_1",
                      type: "function",
                      function: {
                        name: "propose_discount_adjustment",
                        arguments: JSON.stringify({
                          lineId: "line-1",
                          discountPct: 12,
                        }),
                      },
                    },
                  ],
                },
              },
            ],
            usage: { prompt_tokens: 35, completion_tokens: 20 },
          })),
        },
      },
    };

    const res = await runAgent({
      agent: "discount-approval",
      system: "Sys",
      user: "User request",
      tools: [mockWriteTool],
      outputSchema: dummySchema,
      ctx: {
        actorId: "user-1",
        agent: "discount-approval",
        quotationId: "q-100",
      },
      client: mockDb as unknown as typeof db,
      llmClient: mockLlm as unknown as typeof llm,
    });

    expect(mockWriteTool.handler).toHaveBeenCalledTimes(1);
    expect(res.status).toBe("PAUSED_FOR_APPROVAL");
    expect(res.approvalRequestId).toBe("ar-mock-1");
    expect(mockDb.approvalRequest.create).toHaveBeenCalledWith({
      data: {
        agent: "discount-approval",
        runId: "run-mock-1",
        quotationId: "q-100",
        kind: "DISCOUNT",
        summary: "Suggest 12% discount on line-1",
        proposedAction: { lineId: "line-1", discountPct: 12 },
      },
    });
    expect(mockDb.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run-mock-1" },
        data: expect.objectContaining({
          status: "PAUSED_FOR_APPROVAL",
        }),
      }),
    );
  });

  it("enforces maxSteps termination and marks run as FAILED", async () => {
    const mockTool: AgentTool = {
      name: "loop_tool",
      description: "Loops forever",
      parameters: { type: "object", properties: {}, required: [] },
      handler: vi.fn(async () => ({ status: "ok" })),
    };

    const mockLlm = {
      chat: {
        completions: {
          create: vi.fn(async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  tool_calls: [
                    {
                      id: "call_loop",
                      type: "function",
                      function: { name: "loop_tool", arguments: "{}" },
                    },
                  ],
                },
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 10 },
          })),
        },
      },
    };

    await expect(
      runAgent({
        agent: "test-agent",
        system: "Sys",
        user: "User",
        tools: [mockTool],
        outputSchema: dummySchema,
        ctx: { actorId: "user-1", agent: "test-agent" },
        maxSteps: 3,
        client: mockDb as unknown as typeof db,
        llmClient: mockLlm as unknown as typeof llm,
      }),
    ).rejects.toThrow("AGENT_MAX_STEPS");

    expect(mockDb.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run-mock-1" },
        data: expect.objectContaining({
          status: "FAILED",
          error: "AGENT_MAX_STEPS",
        }),
      }),
    );
  });
});
