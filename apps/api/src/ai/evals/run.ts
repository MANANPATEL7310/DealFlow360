import { db } from "../../lib/db.js";

type EvalAgent = {
  run: (input: unknown, opts: { live: boolean }) => Promise<unknown>;
  assert: (
    expected: unknown,
    output: unknown,
  ) => { passed: boolean; score?: number };
};

export const AGENTS: Record<string, EvalAgent> = {};

type EvalClient = {
  agentEval: {
    findMany: () => Promise<
      Array<{ id: string; agent: string; input: unknown; expected: unknown }>
    >;
    update: (args: {
      where: { id: string };
      data: { passed: boolean; score?: number };
    }) => Promise<unknown>;
  };
};

export async function runEvals(
  opts: { live?: boolean } = {},
  client: EvalClient = db as unknown as EvalClient,
) {
  const evals = await client.agentEval.findMany();
  let failures = 0;

  for (const evalCase of evals) {
    const agent = AGENTS[evalCase.agent];
    if (!agent) {
      failures++;
      await client.agentEval.update({
        where: { id: evalCase.id },
        data: { passed: false, score: 0 },
      });
      continue;
    }

    const output = await agent.run(evalCase.input, {
      live: opts.live ?? false,
    });
    const result = agent.assert(evalCase.expected, output);
    if (!result.passed) {
      failures++;
    }

    await client.agentEval.update({
      where: { id: evalCase.id },
      data: result,
    });
  }

  return { total: evals.length, failures };
}

if (process.argv[1]?.endsWith("run.ts")) {
  const live = process.argv.includes("--live");
  const result = await runEvals({ live });
  if (result.failures > 0) {
    process.exitCode = 1;
  }
  console.log(JSON.stringify(result));
}
