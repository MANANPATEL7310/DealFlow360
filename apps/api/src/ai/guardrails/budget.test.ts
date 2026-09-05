import { beforeEach, describe, expect, it, vi } from "vitest";

describe("AI budget guard", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("JWT_SECRET", "test-secret-at-least-16-chars");
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/test");
    vi.stubEnv("AI_MONTHLY_BUDGET_USD", "50");
  });

  it("uses the first day of the current month as the spend window", () => {
    const firstDayOfMonth = (now: Date) =>
      new Date(now.getFullYear(), now.getMonth(), 1);

    expect(firstDayOfMonth(new Date("2026-09-05T12:34:56Z"))).toEqual(
      new Date(2026, 8, 1),
    );
  });

  it("throws before a run starts when monthly spend is over budget", async () => {
    const { assertBudget } = await import("./budget.js");
    const client = {
      agentRun: {
        aggregate: async () => ({ _sum: { costUsd: 50 } }),
      },
    };

    await expect(
      assertBudget(client, new Date("2026-09-05T00:00:00Z")),
    ).rejects.toMatchObject({ message: "AI_BUDGET_EXCEEDED", http: 402 });
  });

  it("prices token usage from model rates stored in settings", async () => {
    const { priceRun } = await import("./budget.js");
    const client = {
      systemSetting: {
        findUnique: async () => ({
          value: JSON.stringify({ modelA: { in: 2, out: 6 } }),
        }),
      },
    };

    await expect(priceRun("modelA", 500_000, 250_000, client)).resolves.toBe(
      2.5,
    );
  });
});
