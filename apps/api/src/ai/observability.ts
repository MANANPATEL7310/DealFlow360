import type { AgentRunStatus } from "@prisma/client";
import { db } from "../lib/db.js";
import { priceRun } from "./guardrails/budget.js";

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
};

type ObservabilityClient = {
  agentStep: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  agentRun: {
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
};

export async function recordStep(
  runId: string,
  index: number,
  kind: "LLM" | "TOOL",
  request: unknown,
  response: unknown,
  usage: Usage | undefined,
  latencyMs: number,
  model: string,
  toolName?: string,
  client: ObservabilityClient = db as unknown as ObservabilityClient,
) {
  const inputTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? 0;
  const costUsd =
    kind === "LLM" ? await priceRun(model, inputTokens, outputTokens) : 0;

  await client.agentStep.create({
    data: {
      runId,
      index,
      kind,
      toolName,
      request,
      response,
      inputTokens,
      outputTokens,
      costUsd,
      latencyMs,
    },
  });

  await client.agentRun.update({
    where: { id: runId },
    data: {
      inputTokens: { increment: inputTokens },
      outputTokens: { increment: outputTokens },
      costUsd: { increment: costUsd },
      latencyMs: { increment: latencyMs },
    },
  });
}

export async function closeRun(
  runId: string,
  status: AgentRunStatus,
  result?: unknown,
  error?: string,
  client: ObservabilityClient = db as unknown as ObservabilityClient,
) {
  await client.agentRun.update({
    where: { id: runId },
    data: {
      status,
      result: result ?? undefined,
      error,
    },
  });
}
