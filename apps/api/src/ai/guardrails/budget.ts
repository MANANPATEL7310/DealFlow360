import { env } from "../../config/env.js";
import { db } from "../../lib/db.js";
import { getSetting } from "../../lib/settings.js";

type BudgetClient = {
  agentRun: {
    aggregate: (args: {
      _sum: { costUsd: true };
      where: { createdAt: { gte: Date } };
    }) => Promise<{ _sum: { costUsd: number | null } }>;
  };
};

type ModelRates = Record<string, { in: number; out: number }>;

export function firstDayOfMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function assertBudget(
  client: BudgetClient = db as unknown as BudgetClient,
  now = new Date(),
) {
  const agg = await client.agentRun.aggregate({
    _sum: { costUsd: true },
    where: { createdAt: { gte: firstDayOfMonth(now) } },
  });
  const spent = agg._sum.costUsd ?? 0;

  if (spent >= env.AI_MONTHLY_BUDGET_USD) {
    throw Object.assign(new Error("AI_BUDGET_EXCEEDED"), {
      http: 402,
      spent,
    });
  }
}

export async function priceRun(
  model: string,
  inputTokens: number,
  outputTokens: number,
  client?: Parameters<typeof getSetting<ModelRates>>[2],
) {
  const rates = await getSetting<ModelRates>("ai.modelRates", {}, client);
  const rate = rates[model] ?? { in: 0, out: 0 };

  return (
    (inputTokens / 1_000_000) * rate.in + (outputTokens / 1_000_000) * rate.out
  );
}
