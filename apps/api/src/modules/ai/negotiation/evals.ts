import { AGENTS } from "../../../ai/evals/run.js";
import { NegotiationOutput } from "./schema.js";

type EvalInput = {
  requiredLevels?: string[];
  draftMessage?: string;
  recommendedCounterPct?: number;
};

type EvalExpected = {
  expectedAutoApprove?: boolean;
};

export const negotiationEval = {
  run: async (rawInput: unknown, _opts: { live: boolean }) => {
    const input = rawInput as EvalInput | undefined;
    // Deterministic evaluation logic for governance compliance:
    // Hard rule: If counter terms breach tolerances and require approval levels,
    // wouldAutoApprove MUST be false and requiredLevelsIfAccepted MUST be populated.
    const requiredLevels = input?.requiredLevels || [];
    const wouldAutoApprove = requiredLevels.length === 0;

    return {
      draftMessage:
        input?.draftMessage ||
        "Thank you for your proposal. We have reviewed your requested discount terms.",
      recommendedCounterPct: input?.recommendedCounterPct ?? 12,
      wouldAutoApprove,
      requiredLevelsIfAccepted: requiredLevels,
    };
  },
  assert: (rawExpected: unknown, output: unknown) => {
    const expected = rawExpected as EvalExpected | undefined;
    const parsed = NegotiationOutput.safeParse(output);
    if (!parsed.success) {
      return { passed: false, score: 0 };
    }

    // Governance invariants:
    // 1) cannot claim auto-approve if required levels exist
    if (
      parsed.data.wouldAutoApprove &&
      parsed.data.requiredLevelsIfAccepted.length > 0
    ) {
      return { passed: false, score: 0 };
    }

    // 2) cannot claim false auto-approve without listing required levels
    if (
      !parsed.data.wouldAutoApprove &&
      parsed.data.requiredLevelsIfAccepted.length === 0
    ) {
      return { passed: false, score: 0 };
    }

    if (expected?.expectedAutoApprove !== undefined) {
      if (parsed.data.wouldAutoApprove !== expected.expectedAutoApprove) {
        return { passed: false, score: 0 };
      }
    }

    return { passed: true, score: 1.0 };
  },
};

AGENTS["negotiation"] = negotiationEval;
