import type { Request, Response } from "express";
import { sendOk } from "../../../lib/response.js";
import { aiAgentEnabled } from "../../../ai/flags.js";
import { runAgent } from "../../../ai/agent-runner.js";
import { loadActivePrompt } from "../../../ai/prompts.js";
import { DiscountApprovalOutput } from "./schema.js";
import { agent1Tools } from "./tools.js";
import { buildDiscountTaskPrompt } from "./context.js";

export async function reviewDiscountController(req: Request, res: Response) {
  const rawId = req.params.quotationId;
  const quotationId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!quotationId) {
    throw Object.assign(new Error("QUOTATION_ID_REQUIRED"), { http: 400 });
  }

  // Graceful degradation when AI is disabled or not configured
  if (!(await aiAgentEnabled("discount-approval"))) {
    return sendOk(res, { aiAvailable: false });
  }

  try {
    const { system, version } = await loadActivePrompt("discount-approval");
    const userPrompt = await buildDiscountTaskPrompt(quotationId);

    const { status, result } = await runAgent({
      agent: "discount-approval",
      system,
      user: userPrompt,
      tools: agent1Tools,
      outputSchema: DiscountApprovalOutput,
      promptVersion: version,
      ctx: {
        agent: "discount-approval",
        actorId: req.user?.sub || "system",
        quotationId,
      },
    });

    return sendOk(res, {
      aiAvailable: true,
      status,
      ...result,
    });
  } catch (err: unknown) {
    const errObj = err as { message?: string; http?: number } | undefined;
    if (errObj?.message === "AI_BUDGET_EXCEEDED" || errObj?.http === 402) {
      return sendOk(res, {
        aiAvailable: false,
        reason: "AI_BUDGET_EXCEEDED",
      });
    }
    throw err;
  }
}
