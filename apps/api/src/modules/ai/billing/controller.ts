import type { Request, Response } from "express";
import { sendOk } from "../../../lib/response.js";
import { aiAgentEnabled } from "../../../ai/flags.js";
import { runAgent } from "../../../ai/agent-runner.js";
import { loadActivePrompt } from "../../../ai/prompts.js";
import { BillingOutput } from "./schema.js";
import { agent4Tools } from "./tools.js";
import { buildBillingTaskPrompt } from "./context.js";

export async function explainBill(req: Request, res: Response) {
  const { quotationId } = req.params;

  if (!(await aiAgentEnabled("billing"))) {
    return sendOk(res, { aiAvailable: false });
  }

  try {
    const { system } = await loadActivePrompt("billing");
    const { status, result, approvalRequestId } = await runAgent({
      agent: "billing",
      system,
      user: await buildBillingTaskPrompt(quotationId as string),
      tools: agent4Tools,
      outputSchema: BillingOutput,
      ctx: {
        agent: "billing",
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        quotationId: quotationId as string,
      },
    });

    return sendOk(res, {
      aiAvailable: true,
      status,
      result,
      approvalRequestId,
    });
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message === "AI_BUDGET_EXCEEDED") {
      return sendOk(res, { aiAvailable: false });
    }
    throw e;
  }
}
