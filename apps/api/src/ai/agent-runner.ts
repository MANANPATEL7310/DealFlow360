import type { ZodType } from "zod";
import type OpenAI from "openai";
import { llm } from "./llm.js";
import { env } from "../config/env.js";
import { db } from "../lib/db.js";
import { assertBudget } from "./guardrails/budget.js";
import { redactPII } from "./guardrails/redact.js";
import { recordStep, closeRun } from "./observability.js";
import type { AgentTool, AgentContext, NeedsApproval } from "./tools/types.js";

type BudgetClientParam = Parameters<typeof assertBudget>[0];
type ObservabilityClientParam = Parameters<typeof closeRun>[4];

type PrismaRunClient = {
  agentRun: {
    create: (args: {
      data: {
        agent: string;
        model: string;
        status: "RUNNING";
        quotationId?: string;
        promptVersion?: number;
      };
    }) => Promise<{ id: string }>;
  };
  approvalRequest: {
    create: (args: {
      data: {
        agent: string;
        runId: string;
        quotationId?: string;
        kind: string;
        summary: string;
        proposedAction: unknown;
      };
    }) => Promise<{ id: string }>;
  };
};

export type RunAgentOptions<T> = {
  agent: string;
  system: string;
  user: string;
  tools: AgentTool[];
  outputSchema: ZodType<T>;
  ctx: Omit<AgentContext, "runId">;
  model?: string;
  maxSteps?: number;
  promptVersion?: number;
  client?: typeof db;
  llmClient?: typeof llm;
};

export type RunAgentResponse<T> = {
  status: "DONE" | "PAUSED_FOR_APPROVAL";
  result?: T;
  approvalRequestId?: string;
};

export async function runAgent<T>(
  opts: RunAgentOptions<T>,
): Promise<RunAgentResponse<T>> {
  const client = opts.client ?? db;
  const llmClient = opts.llmClient ?? llm;
  const dbClient = client as unknown as PrismaRunClient;
  const obsClient = client as unknown as ObservabilityClientParam;

  // 1. Spend guardrail check (throws AI_BUDGET_EXCEEDED if over monthly cap)
  await assertBudget(client as unknown as BudgetClientParam);

  const model = opts.model ?? env.AI_DEFAULT_MODEL;
  const run = await dbClient.agentRun.create({
    data: {
      agent: opts.agent,
      model,
      status: "RUNNING",
      quotationId: opts.ctx.quotationId,
      promptVersion: opts.promptVersion,
    },
  });

  const ctx: AgentContext = { ...opts.ctx, runId: run.id };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: opts.system },
    { role: "user", content: redactPII(opts.user) },
  ];

  const toolDefs = opts.tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const maxSteps = opts.maxSteps ?? 8;

  for (let step = 0; step < maxSteps; step++) {
    const started = Date.now();
    const res = await llmClient.chat.completions.create({
      model,
      messages,
      ...(toolDefs.length > 0 ? { tools: toolDefs, tool_choice: "auto" } : {}),
    });

    const msg = res.choices[0]?.message;
    if (!msg) {
      await closeRun(
        run.id,
        "FAILED",
        undefined,
        "NO_COMPLETION_CHOICE",
        obsClient,
      );
      throw new Error("NO_COMPLETION_CHOICE");
    }

    await recordStep(
      run.id,
      step,
      "LLM",
      { messages },
      msg,
      res.usage,
      Date.now() - started,
      model,
      undefined,
      obsClient,
    );

    // If no tool calls, the model concluded with its final structured answer
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      let rawJson: unknown = {};
      try {
        const text = msg.content?.trim() ?? "{}";
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : text;
        rawJson = JSON.parse(jsonStr);
      } catch (parseErr: unknown) {
        const errMsg =
          parseErr instanceof Error ? parseErr.message : String(parseErr);
        await closeRun(
          run.id,
          "FAILED",
          undefined,
          `MALFORMED_JSON: ${errMsg}`,
          obsClient,
        );
        throw parseErr;
      }

      const parsed = opts.outputSchema.parse(rawJson);
      await closeRun(run.id, "DONE", parsed, undefined, obsClient);
      return { status: "DONE", result: parsed };
    }

    messages.push(msg);

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;
      const tool = opts.tools.find((t) => t.name === call.function.name);
      if (!tool) {
        await closeRun(
          run.id,
          "FAILED",
          undefined,
          `UNKNOWN_TOOL:${call.function.name}`,
          obsClient,
        );
        throw new Error(`UNKNOWN_TOOL:${call.function.name}`);
      }

      let args: unknown = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }

      const toolStarted = Date.now();
      const out = await tool.handler(args, ctx);

      await recordStep(
        run.id,
        step,
        "TOOL",
        { toolName: tool.name, args },
        out,
        undefined,
        Date.now() - toolStarted,
        model,
        tool.name,
        obsClient,
      );

      // ── GOVERNANCE GATE ──────────────────────────────────────────────────────────
      // A write tool requiring human sign-off returns { needsApproval: true, kind, summary, proposedAction }.
      // We NEVER mutate here: enqueue ApprovalRequest and pause the run.
      if (tool.write && (out as NeedsApproval)?.needsApproval) {
        const approvalData = out as NeedsApproval;
        const approvalReq = await dbClient.approvalRequest.create({
          data: {
            agent: opts.agent,
            runId: run.id,
            quotationId: ctx.quotationId,
            kind: approvalData.kind,
            summary: approvalData.summary,
            proposedAction: approvalData.proposedAction,
          },
        });

        await closeRun(
          run.id,
          "PAUSED_FOR_APPROVAL",
          undefined,
          undefined,
          obsClient,
        );
        return {
          status: "PAUSED_FOR_APPROVAL",
          approvalRequestId: approvalReq.id,
        };
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(out),
      });
    }
  }

  await closeRun(run.id, "FAILED", undefined, "AGENT_MAX_STEPS", obsClient);
  throw new Error("AGENT_MAX_STEPS");
}
