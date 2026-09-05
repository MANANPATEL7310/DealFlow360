import type { Request, Response } from "express";
import { httpStatus } from "../../../constants/http.js";
import { aiAgentEnabled } from "../../../ai/flags.js";
import { runAgent } from "../../../ai/agent-runner.js";
import { loadActivePrompt } from "../../../ai/prompts.js";
import { sendError, sendOk } from "../../../lib/response.js";
import { getOpenAlertIds } from "../../deal-health/deal-health.service.js";
import { buildTriageTaskPrompt } from "./context.js";
import { DealHealthOutput } from "./schema.js";
import { agent5Tools } from "./tools.js";

export async function triageAlerts(req: Request, res: Response) {
  if (!(await aiAgentEnabled("deal-health"))) {
    return sendOk(res, { aiAvailable: false });
  }

  try {
    const { system, version } = await loadActivePrompt("deal-health");
    const { status, result, approvalRequestId } = await runAgent({
      agent: "deal-health",
      system,
      promptVersion: version,
      user: await buildTriageTaskPrompt(),
      tools: agent5Tools,
      outputSchema: DealHealthOutput,
      ctx: {
        agent: "deal-health",
        actorId: req.user!.sub,
        actorRole: req.user!.role,
      },
    });
    const knownAlertIds = new Set(await getOpenAlertIds());
    const prioritized = (result?.prioritized ?? []).filter((item) =>
      knownAlertIds.has(item.alertId),
    );

    return sendOk(res, {
      aiAvailable: true,
      status,
      approvalRequestId,
      prioritized,
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
