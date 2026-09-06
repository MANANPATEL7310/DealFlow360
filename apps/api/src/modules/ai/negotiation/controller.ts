import type { Request, Response } from "express";
import { sendOk } from "../../../lib/response.js";
import { aiAgentEnabled } from "../../../ai/flags.js";
import { runAgent } from "../../../ai/agent-runner.js";
import { loadActivePrompt } from "../../../ai/prompts.js";
import { isDegradableAiError } from "../../../ai/degrade.js";
import { NegotiationOutput } from "./schema.js";
import { agent6Tools } from "./tools.js";
import { buildNegotiationTaskPrompt } from "./context.js";

export async function assistNegotiationController(req: Request, res: Response) {
  const rawId = req.params.requestId;
  const requestId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!requestId) {
    throw Object.assign(new Error("REQUEST_ID_REQUIRED"), { http: 400 });
  }

  // Graceful degradation when AI is disabled
  if (!(await aiAgentEnabled("negotiation"))) {
    return sendOk(res, { aiAvailable: false });
  }

  try {
    const { system, version } = await loadActivePrompt("negotiation");
    const userPrompt = await buildNegotiationTaskPrompt(requestId);

    const { status, result, approvalRequestId } = await runAgent({
      agent: "negotiation",
      system,
      user: userPrompt,
      tools: agent6Tools,
      outputSchema: NegotiationOutput,
      promptVersion: version,
      ctx: {
        agent: "negotiation",
        actorId: req.user?.sub || "rep",
        quotationId: requestId,
      },
    });

    return sendOk(res, {
      aiAvailable: true,
      status,
      approvalRequestId,
      ...(result ?? {}),
    });
  } catch (err: unknown) {
    const { degrade, reason } = isDegradableAiError(err);
    if (degrade) {
      return sendOk(res, { aiAvailable: false, reason });
    }
    throw err;
  }
}
