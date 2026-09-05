import type { Request, Response } from "express";
import { httpStatus } from "../../../constants/http.js";
import { aiAgentEnabled } from "../../../ai/flags.js";
import { runAgent } from "../../../ai/agent-runner.js";
import { loadActivePrompt } from "../../../ai/prompts.js";
import { sendError, sendOk } from "../../../lib/response.js";
import { InsightsOutput } from "./schema.js";
import { agent7Tools } from "./tools.js";

export async function queryInsights(req: Request, res: Response) {
  if (!(await aiAgentEnabled("insights"))) {
    return sendOk(res, { aiAvailable: false });
  }

  try {
    const { system, version } = await loadActivePrompt("insights");
    const { status, result } = await runAgent({
      agent: "insights",
      system,
      promptVersion: version,
      user: String(req.body?.question ?? ""),
      tools: agent7Tools,
      outputSchema: InsightsOutput,
      ctx: {
        agent: "insights",
        actorId: req.user!.sub,
        actorRole: req.user!.role,
      },
    });

    return sendOk(res, {
      aiAvailable: true,
      status,
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
