import { describe, expect, it, vi } from "vitest";
import { closeRun, recordStep } from "./observability.js";

vi.mock("./guardrails/budget.js", () => ({
  priceRun: vi.fn(async () => 0.001),
}));

describe("AI observability", () => {
  it("records a step and rolls totals onto the run", async () => {
    const client = {
      agentStep: { create: vi.fn(async () => ({})) },
      agentRun: { update: vi.fn(async () => ({})) },
    };

    await recordStep(
      "run-1",
      0,
      "LLM",
      { prompt: "x" },
      { answer: "y" },
      { prompt_tokens: 10, completion_tokens: 5 },
      123,
      "modelA",
      undefined,
      client,
    );

    expect(client.agentStep.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        runId: "run-1",
        kind: "LLM",
        inputTokens: 10,
        outputTokens: 5,
        costUsd: 0.001,
      }),
    });
    expect(client.agentRun.update).toHaveBeenCalledWith({
      where: { id: "run-1" },
      data: expect.objectContaining({
        inputTokens: { increment: 10 },
        outputTokens: { increment: 5 },
        costUsd: { increment: 0.001 },
        latencyMs: { increment: 123 },
      }),
    });
  });

  it("closes a run with status and result", async () => {
    const client = {
      agentStep: { create: vi.fn(async () => ({})) },
      agentRun: { update: vi.fn(async () => ({})) },
    };

    await closeRun("run-1", "DONE", { ok: true }, undefined, client);

    expect(client.agentRun.update).toHaveBeenCalledWith({
      where: { id: "run-1" },
      data: { status: "DONE", result: { ok: true }, error: undefined },
    });
  });
});
