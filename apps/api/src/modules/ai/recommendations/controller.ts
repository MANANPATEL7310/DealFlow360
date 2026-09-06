import type { Request, Response } from "express";
import { sendOk } from "../../../lib/response.js";
import { aiAgentEnabled } from "../../../ai/flags.js";
import { runAgent } from "../../../ai/agent-runner.js";
import { loadActivePrompt } from "../../../ai/prompts.js";
import { isDegradableAiError } from "../../../ai/degrade.js";
import { RecommendationOutput } from "./schema.js";
import { agent2Tools, getUpsellCandidates } from "./tools.js";
import { buildCartSummary } from "./context.js";

export async function recommend(req: Request, res: Response) {
  const { quotationId } = req.params;

  if (!(await aiAgentEnabled("recommendation"))) {
    return sendOk(res, { aiAvailable: false });
  }

  try {
    const { system } = await loadActivePrompt("recommendation");
    const { result } = await runAgent({
      agent: "recommendation",
      system,
      user: await buildCartSummary(quotationId as string),
      tools: agent2Tools,
      outputSchema: RecommendationOutput,
      ctx: {
        agent: "recommendation",
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        quotationId: quotationId as string,
      },
    });

    // Backstop invariant: never return a productId M6 didn't sanction.
    const candidates = (await getUpsellCandidates.handler(
      { quotationId },
      {} as never,
    )) as Array<{ product: { id: string } }>;
    const allowed = new Set(candidates.map((c) => c.product.id));

    const suggestions = (result?.suggestions ?? []).filter((s) =>
      allowed.has(s.productId),
    );

    return sendOk(res, { aiAvailable: true, suggestions });
  } catch (e: unknown) {
    const { degrade, reason } = isDegradableAiError(e);
    if (degrade) {
      return sendOk(res, { aiAvailable: false, reason });
    }
    throw e;
  }
}
