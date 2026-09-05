import type { Request, Response } from "express";
import { sendError, sendOk } from "../../../lib/response.js";
import { aiAgentEnabled } from "../../../ai/flags.js";
import { runAgent } from "../../../ai/agent-runner.js";
import { loadActivePrompt } from "../../../ai/prompts.js";
import { agent3Tools } from "./tools.js";
import { FulfillmentOutput } from "./schema.js";
import { buildFulfillmentTaskPrompt } from "./context.js";
import { httpStatus } from "../../../constants/http.js";

export async function planFulfillment(req: Request, res: Response) {
  const quotationId = req.params.quotationId as string;

  if (!(await aiAgentEnabled("fulfillment"))) {
    return sendOk(res, { aiAvailable: false });
  }

  try {
    const { system, version } = await loadActivePrompt("fulfillment");
    const { status, result, approvalRequestId } = await runAgent({
      agent: "fulfillment",
      system,
      promptVersion: version,
      user: await buildFulfillmentTaskPrompt(quotationId),
      tools: agent3Tools,
      outputSchema: FulfillmentOutput,
      ctx: {
        agent: "fulfillment",
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        quotationId,
      },
    });

    return sendOk(res, {
      aiAvailable: true,
      status,
      approvalRequestId,
      ...(result ?? {}),
    });
  } catch (error) {
    const err = error as Error & { http?: number };
    if (
      err.message === "AI_BUDGET_EXCEEDED" ||
      err.message.startsWith("NO_ACTIVE_PROMPT:")
    ) {
      return sendOk(res, { aiAvailable: false });
    }

    return sendError(
      res,
      err.http ?? httpStatus.internalServerError,
      err.message,
    );
  }
}
