import type { z } from "zod";
import { env } from "../config/env.js";
import { db } from "../lib/db.js";
import { assertBudget } from "./guardrails/budget.js";
import { redactPII } from "./guardrails/redact.js";
import { llm } from "./llm.js";
import { closeRun, recordStep } from "./observability.js";
import type { AgentContext, AgentTool } from "./tools/types.js";

type RunnerResult<T> = {
  status: "DONE" | "PAUSED_FOR_APPROVAL";
  result?: T;
  approvalRequestId?: string;
};

export async function runAgent<T>(opts: {
  agent: string;
  system: string;
  user: string;
  tools: AgentTool[];
  outputSchema: z.ZodType<T>;
  ctx: Omit<AgentContext, "runId">;
  model?: string;
  maxSteps?: number;
  promptVersion?: number;
}): Promise<RunnerResult<T>> {
  await assertBudget();

  const model = opts.model ?? env.AI_DEFAULT_MODEL;
  const run = await db.agentRun.create({
    data: {
      agent: opts.agent,
      model,
      status: "RUNNING",
      quotationId: opts.ctx.quotationId,
      promptVersion: opts.promptVersion,
    },
  });
  const ctx: AgentContext = { ...opts.ctx, runId: run.id };
  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: opts.system },
    { role: "user", content: redactPII(opts.user) },
  ];
  const toolDefs = opts.tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  try {
    for (let step = 0; step < (opts.maxSteps ?? 8); step++) {
      const started = Date.now();
      const response = await llm.chat.completions.create({
        model,
        messages: messages as never,
        tools: toolDefs,
        tool_choice: "auto",
      });
      const message = response.choices[0]?.message;
      if (!message) {
        throw new Error("AI_EMPTY_RESPONSE");
      }

      await recordStep(
        run.id,
        step,
        "LLM",
        { messages },
        message,
        response.usage,
        Date.now() - started,
        model,
      );

      if (!message.tool_calls?.length) {
        const parsed = opts.outputSchema.parse(
          JSON.parse(message.content ?? "{}"),
        );
        await closeRun(run.id, "DONE", parsed);
        return { status: "DONE", result: parsed };
      }

      messages.push(message as never);
      for (const call of message.tool_calls) {
        if (call.type !== "function") {
          throw new Error(`UNSUPPORTED_TOOL_CALL:${call.type}`);
        }

        const tool = opts.tools.find(
          (candidate) => candidate.name === call.function.name,
        );
        if (!tool) {
          throw new Error(`UNKNOWN_TOOL:${call.function.name}`);
        }

        const args = JSON.parse(call.function.arguments || "{}");
        const out = await tool.handler(args, ctx);
        await recordStep(
          run.id,
          step,
          "TOOL",
          args,
          out,
          undefined,
          0,
          model,
          tool.name,
        );

        if (tool.write && typeof out === "object" && out !== null) {
          const maybeApproval = out as {
            needsApproval?: boolean;
            kind?: string;
            summary?: string;
            proposedAction?: unknown;
          };
          if (maybeApproval.needsApproval) {
            const approval = await db.approvalRequest.create({
              data: {
                agent: opts.agent,
                runId: run.id,
                quotationId: ctx.quotationId,
                kind: String(maybeApproval.kind),
                summary: String(maybeApproval.summary),
                proposedAction: maybeApproval.proposedAction as never,
              },
            });
            await closeRun(run.id, "PAUSED_FOR_APPROVAL");
            return {
              status: "PAUSED_FOR_APPROVAL",
              approvalRequestId: approval.id,
            };
          }
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(out),
        });
      }
    }

    throw new Error("AGENT_MAX_STEPS");
  } catch (error) {
    await closeRun(run.id, "FAILED", undefined, (error as Error).message);
    throw error;
  }
}
