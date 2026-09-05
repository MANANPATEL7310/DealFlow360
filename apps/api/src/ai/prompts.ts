import { db } from "../lib/db.js";

type PromptClient = {
  promptVersion: {
    findFirst: (args: {
      where: { agent: string; active?: boolean };
      orderBy?: { version: "desc" };
    }) => Promise<{ system: string; version: number } | null>;
    updateMany: (args: {
      where: { agent: string; active?: boolean };
      data: { active: boolean };
    }) => Promise<unknown>;
    create: (args: {
      data: { agent: string; version: number; system: string; active: boolean };
    }) => Promise<unknown>;
    update: (args: {
      where: { agent_version: { agent: string; version: number } };
      data: { active: boolean };
    }) => Promise<unknown>;
  };
  $transaction: <T>(fn: (tx: PromptClient) => Promise<T>) => Promise<T>;
};

export async function loadActivePrompt(
  agent: string,
  client: PromptClient = db as unknown as PromptClient,
) {
  const row = await client.promptVersion.findFirst({
    where: { agent, active: true },
  });
  if (!row) {
    throw Object.assign(new Error(`NO_ACTIVE_PROMPT:${agent}`), { http: 500 });
  }

  return { system: row.system, version: row.version };
}

export async function publishPromptVersion(
  agent: string,
  system: string,
  client: PromptClient = db as unknown as PromptClient,
) {
  return client.$transaction(async (tx) => {
    const last = await tx.promptVersion.findFirst({
      where: { agent },
      orderBy: { version: "desc" },
    });
    const version = (last?.version ?? 0) + 1;

    await tx.promptVersion.updateMany({
      where: { agent, active: true },
      data: { active: false },
    });

    return tx.promptVersion.create({
      data: { agent, version, system, active: true },
    });
  });
}

export async function rollbackPrompt(
  agent: string,
  version: number,
  client: PromptClient = db as unknown as PromptClient,
) {
  return client.$transaction(async (tx) => {
    await tx.promptVersion.updateMany({
      where: { agent, active: true },
      data: { active: false },
    });

    return tx.promptVersion.update({
      where: { agent_version: { agent, version } },
      data: { active: true },
    });
  });
}
