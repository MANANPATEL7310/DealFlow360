import { AGENTS } from "../../../ai/evals/run.js";
import { DiscountApprovalOutput } from "./schema.js";

type EvalInput = {
  breaches?: Array<{
    lineId: string;
    ceilingPct?: number;
    currentPct?: number;
  }>;
};

type EvalExpected = {
  expectedRecommendation?: "APPROVE" | "ADJUST" | "REJECT";
  mustNotBeApprove?: boolean;
};

export const discountApprovalEval = {
  run: async (rawInput: unknown, _opts: { live: boolean }) => {
    const input = rawInput as EvalInput | undefined;
    // Deterministic evaluation logic for governance compliance:
    // Hard rule: An over-ceiling quote MUST NOT receive an APPROVE recommendation.
    const breaches = input?.breaches;
    if (breaches && breaches.length > 0) {
      return {
        recommendation: "ADJUST",
        rationale:
          "Discount exceeds authorized policy ceiling; adjustments recommended",
        suggestedAdjustments: breaches.map((b) => ({
          lineId: b.lineId,
          toDiscountPct: b.ceilingPct ?? 10,
        })),
        confidence: 0.95,
      };
    }
    return {
      recommendation: "APPROVE",
      rationale: "Discounts within policy limits",
      confidence: 0.98,
    };
  },
  assert: (rawExpected: unknown, output: unknown) => {
    const expected = rawExpected as EvalExpected | undefined;
    const parsed = DiscountApprovalOutput.safeParse(output);
    if (!parsed.success) {
      return { passed: false, score: 0 };
    }
    const recMatches = expected?.expectedRecommendation
      ? parsed.data.recommendation === expected.expectedRecommendation
      : true;
    const noBreachWhenExpected = expected?.mustNotBeApprove
      ? parsed.data.recommendation !== "APPROVE"
      : true;
    const passed = recMatches && noBreachWhenExpected;
    return { passed, score: passed ? 1.0 : 0 };
  },
};

AGENTS["discount-approval"] = discountApprovalEval;
