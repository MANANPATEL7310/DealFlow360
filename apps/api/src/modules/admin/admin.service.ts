import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import type { AuditLogQuery } from "./admin.schema.js";

type SettingRow = {
  id: string;
  key: string;
  value: string;
  scope: string;
  createdAt: Date;
  updatedAt: Date;
};

type DbClient = {
  systemSetting: {
    findMany: (args: { orderBy: { key: "asc" } }) => Promise<SettingRow[]>;
    findUnique: (args: {
      where: { key: string };
    }) => Promise<SettingRow | null>;
    update: (args: {
      where: { key: string };
      data: { value: string };
    }) => Promise<SettingRow>;
  };
  auditLog: {
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy: { createdAt: "desc" };
      take: number;
      skip: number;
    }) => Promise<unknown[]>;
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  };
};

type AiUsageClient = {
  agentRun: {
    aggregate: (args: {
      _sum: { costUsd: true; inputTokens: true; outputTokens: true };
      _count: { _all: true };
      where: Record<string, unknown>;
    }) => Promise<{
      _sum: {
        costUsd: number | null;
        inputTokens: number | null;
        outputTokens: number | null;
      };
      _count: { _all: number };
    }>;
    findMany: (args: {
      where: Record<string, unknown>;
      select: {
        agent: true;
        status: true;
        costUsd: true;
        latencyMs: true;
        inputTokens: true;
        outputTokens: true;
      };
      orderBy: { createdAt: "desc" };
    }) => Promise<
      Array<{
        agent: string;
        status: string;
        costUsd: number;
        latencyMs: number;
        inputTokens: number;
        outputTokens: number;
      }>
    >;
  };
};

export type ParsedSetting = Omit<SettingRow, "value"> & { value: unknown };

function notFound(code: string) {
  return Object.assign(new Error(code), { http: 404 });
}

function parseSettingValue(value: string): unknown {
  return JSON.parse(value);
}

function serializeSettingValue(value: unknown): string {
  return JSON.stringify(value);
}

function toParsedSetting(row: SettingRow): ParsedSetting {
  return {
    ...row,
    value: parseSettingValue(row.value),
  };
}

export async function listSettings(
  client: DbClient = db as unknown as DbClient,
) {
  const rows = await client.systemSetting.findMany({
    orderBy: { key: "asc" },
  });

  return rows.map(toParsedSetting);
}

export async function updateSetting(
  key: string,
  value: unknown,
  actorId: string,
  client: DbClient = db as unknown as DbClient,
) {
  const existing = await client.systemSetting.findUnique({ where: { key } });
  if (!existing) {
    throw notFound("SETTING_NOT_FOUND");
  }

  const before = parseSettingValue(existing.value);
  const updated = await client.systemSetting.update({
    where: { key },
    data: { value: serializeSettingValue(value) },
  });

  await writeAudit({
    actorId,
    actorKind: "user",
    action: "settings.updated",
    entity: "SystemSetting",
    entityId: updated.id,
    reason: `Changed ${key}`,
    diff: { key, before, after: value },
  });

  return toParsedSetting(updated);
}

export async function listAuditLogs(
  filters: AuditLogQuery,
  client: DbClient = db as unknown as DbClient,
) {
  const where: Record<string, unknown> = {};
  if (filters.entity) {
    where.entity = filters.entity;
  }
  if (filters.entityId) {
    where.entityId = filters.entityId;
  }
  if (filters.actorId) {
    where.actorId = filters.actorId;
  }
  if (filters.action) {
    where.action = { startsWith: filters.action };
  }
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  const page = filters.page;
  const pageSize = filters.pageSize;
  const [items, total] = await Promise.all([
    client.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    client.auditLog.count({ where }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

function monthStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function percentile(values: number[], p: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0;
}

export async function getAiUsageSummary(
  now = new Date(),
  client: AiUsageClient = db as unknown as AiUsageClient,
) {
  const where = { createdAt: { gte: monthStart(now) } };
  const [totals, runs] = await Promise.all([
    client.agentRun.aggregate({
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      _count: { _all: true },
      where,
    }),
    client.agentRun.findMany({
      where,
      select: {
        agent: true,
        status: true,
        costUsd: true,
        latencyMs: true,
        inputTokens: true,
        outputTokens: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const byAgent = new Map<
    string,
    {
      runs: number;
      costUsd: number;
      inputTokens: number;
      outputTokens: number;
      failures: number;
      pausedForApproval: number;
      latencies: number[];
    }
  >();

  for (const run of runs) {
    const bucket = byAgent.get(run.agent) ?? {
      runs: 0,
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      failures: 0,
      pausedForApproval: 0,
      latencies: [],
    };
    bucket.runs += 1;
    bucket.costUsd += run.costUsd;
    bucket.inputTokens += run.inputTokens;
    bucket.outputTokens += run.outputTokens;
    bucket.failures += run.status === "FAILED" ? 1 : 0;
    bucket.pausedForApproval += run.status === "PAUSED_FOR_APPROVAL" ? 1 : 0;
    bucket.latencies.push(run.latencyMs);
    byAgent.set(run.agent, bucket);
  }

  return {
    monthStart: monthStart(now),
    totalRuns: totals._count._all,
    totalCostUsd: totals._sum.costUsd ?? 0,
    totalInputTokens: totals._sum.inputTokens ?? 0,
    totalOutputTokens: totals._sum.outputTokens ?? 0,
    p95LatencyMs: percentile(
      runs.map((run) => run.latencyMs),
      95,
    ),
    failureRate:
      runs.length > 0
        ? runs.filter((run) => run.status === "FAILED").length / runs.length
        : 0,
    hitlPauseRate:
      runs.length > 0
        ? runs.filter((run) => run.status === "PAUSED_FOR_APPROVAL").length /
          runs.length
        : 0,
    byAgent: [...byAgent.entries()].map(([agent, bucket]) => ({
      agent,
      runs: bucket.runs,
      costUsd: bucket.costUsd,
      inputTokens: bucket.inputTokens,
      outputTokens: bucket.outputTokens,
      p95LatencyMs: percentile(bucket.latencies, 95),
      failureRate: bucket.runs > 0 ? bucket.failures / bucket.runs : 0,
      hitlPauseRate:
        bucket.runs > 0 ? bucket.pausedForApproval / bucket.runs : 0,
    })),
  };
}
