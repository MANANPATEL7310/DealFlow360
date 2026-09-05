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
});
