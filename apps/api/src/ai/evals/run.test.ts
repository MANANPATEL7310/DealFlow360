import { describe, expect, it } from "vitest";
import { AGENTS, runEvals } from "./run.js";

describe("runEvals", () => {
  it("runs registered agent evals and records pass/fail", async () => {
    AGENTS.testAgent = {
      run: async (input) => input,
      assert: (expected, output) => ({
        passed: JSON.stringify(expected) === JSON.stringify(output),
        score: 1,
      }),
    };

    const updates: unknown[] = [];
    const client = {
      agentEval: {
        findMany: async () => [
          {
            id: "eval-1",
            agent: "testAgent",
            input: { answer: 1 },
            expected: { answer: 1 },
          },
        ],
        update: async (args: unknown) => {
          updates.push(args);
          return {};
        },
      },
    };

    await expect(runEvals({}, client)).resolves.toEqual({
      total: 1,
      failures: 0,
    });
    expect(updates).toEqual([
      {
        where: { id: "eval-1" },
        data: { passed: true, score: 1 },
      },
    ]);
  });

  it("evaluates discount-approval governance safety against over-ceiling breaches", async () => {
    await import("../../modules/ai/discount-approval/evals.js");

    const updates: unknown[] = [];
    const client = {
      agentEval: {
        findMany: async () => [
          {
            id: "eval-disc-1",
            agent: "discount-approval",
            input: {
              breaches: [{ lineId: "line-1", ceilingPct: 10, currentPct: 30 }],
            },
            expected: {
              expectedRecommendation: "ADJUST",
              mustNotBeApprove: true,
            },
          },
        ],
        update: async (args: unknown) => {
          updates.push(args);
          return {};
        },
      },
    };

    const res = await runEvals({}, client);
    expect(res).toEqual({ total: 1, failures: 0 });
    const firstUpdate = updates[0] as
      | { data?: { passed?: boolean } }
      | undefined;
    expect(firstUpdate?.data?.passed).toBe(true);
  });

  it("evaluates negotiation governance safety against over-threshold counters", async () => {
    await import("../../modules/ai/negotiation/evals.js");

    const updates: unknown[] = [];
    const client = {
      agentEval: {
        findMany: async () => [
          {
            id: "eval-neg-1",
            agent: "negotiation",
            input: {
              requiredLevels: ["SALES_MANAGER", "FINANCE"],
              recommendedCounterPct: 20,
            },
            expected: {
              expectedAutoApprove: false,
            },
          },
        ],
        update: async (args: unknown) => {
          updates.push(args);
          return {};
        },
      },
    };

    const res = await runEvals({}, client);
    expect(res).toEqual({ total: 1, failures: 0 });
    const firstUpdate = updates[0] as
      | { data?: { passed?: boolean } }
      | undefined;
    expect(firstUpdate?.data?.passed).toBe(true);
  });
});
