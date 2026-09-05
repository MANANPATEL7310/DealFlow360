import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAiUsageSummary,
  listAuditLogs,
  listSettings,
  updateSetting,
} from "./admin.service.js";
import { writeAudit } from "../../lib/audit.js";

vi.mock("../../lib/audit.js", () => ({
  writeAudit: vi.fn(async () => undefined),
}));

const now = new Date("2026-02-20T00:00:00Z");

function row(overrides: { key: string; value: string }) {
  return {
    id: `setting-${overrides.key}`,
    key: overrides.key,
    value: overrides.value,
    scope: "global",
    createdAt: now,
    updatedAt: now,
  };
}

function client({
  settings = [],
  existing = null,
  updated = null,
  auditLogs = [],
  auditLogCount = 0,
}: {
  settings?: ReturnType<typeof row>[];
  existing?: ReturnType<typeof row> | null;
  updated?: ReturnType<typeof row> | null;
  auditLogs?: unknown[];
  auditLogCount?: number;
}) {
  return {
    systemSetting: {
      findMany: vi.fn(async () => settings),
      findUnique: vi.fn(async () => existing),
      update: vi.fn(async () => {
        if (!updated) {
          throw new Error("Missing test update row");
        }
        return updated;
      }),
    },
    auditLog: {
      findMany: vi.fn(async () => auditLogs),
      count: vi.fn(async () => auditLogCount),
    },
  };
}

describe("admin settings service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists settings with parsed JSON values", async () => {
    const fake = client({
      settings: [
        row({ key: "ai.enabled", value: "false" }),
        row({ key: "health.stalledDays", value: "7" }),
      ],
    });

    await expect(listSettings(fake)).resolves.toMatchObject([
      { key: "ai.enabled", value: false },
      { key: "health.stalledDays", value: 7 },
    ]);
    expect(fake.systemSetting.findMany).toHaveBeenCalledWith({
      orderBy: { key: "asc" },
    });
  });

  it("updates a setting with a JSON stringified value and audit entry", async () => {
    const fake = client({
      existing: row({ key: "health.stalledDays", value: "7" }),
      updated: row({ key: "health.stalledDays", value: "14" }),
    });

    await expect(
      updateSetting("health.stalledDays", 14, "admin-1", fake),
    ).resolves.toMatchObject({
      key: "health.stalledDays",
      value: 14,
    });

    expect(fake.systemSetting.update).toHaveBeenCalledWith({
      where: { key: "health.stalledDays" },
      data: { value: "14" },
    });
    expect(writeAudit).toHaveBeenCalledWith({
      actorId: "admin-1",
      actorKind: "user",
      action: "settings.updated",
      entity: "SystemSetting",
      entityId: "setting-health.stalledDays",
      reason: "Changed health.stalledDays",
      diff: { key: "health.stalledDays", before: 7, after: 14 },
    });
  });

  it("throws a 404 when updating an unknown setting", async () => {
    const fake = client({});

    await expect(
      updateSetting("missing.key", true, "admin-1", fake),
    ).rejects.toMatchObject({
      message: "SETTING_NOT_FOUND",
      http: 404,
    });
    expect(fake.systemSetting.update).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("lists audit logs with filters and pagination", async () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const to = new Date("2026-01-31T00:00:00Z");
    const log = { id: "audit-1", action: "settings.updated" };
    const fake = client({ auditLogs: [log], auditLogCount: 21 });

    await expect(
      listAuditLogs(
        {
          entity: "SystemSetting",
          entityId: "setting-1",
          actorId: "admin-1",
          action: "settings",
          from,
          to,
          page: 2,
          pageSize: 10,
        },
        fake,
      ),
    ).resolves.toEqual({
      items: [log],
      page: 2,
      pageSize: 10,
      total: 21,
      totalPages: 3,
    });

    const where = {
      entity: "SystemSetting",
      entityId: "setting-1",
      actorId: "admin-1",
      action: { startsWith: "settings" },
      createdAt: { gte: from, lte: to },
    };
    expect(fake.auditLog.findMany).toHaveBeenCalledWith({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      skip: 10,
    });
    expect(fake.auditLog.count).toHaveBeenCalledWith({ where });
  });

  it("summarizes AI usage for admin visibility", async () => {
    const fake = {
      agentRun: {
        aggregate: vi.fn(async () => ({
          _sum: { costUsd: 0.03, inputTokens: 300, outputTokens: 120 },
          _count: { _all: 2 },
        })),
        findMany: vi.fn(async () => [
          {
            agent: "fulfillment",
            status: "DONE",
            costUsd: 0.01,
            latencyMs: 100,
            inputTokens: 100,
            outputTokens: 40,
          },
          {
            agent: "fulfillment",
            status: "PAUSED_FOR_APPROVAL",
            costUsd: 0.02,
            latencyMs: 300,
            inputTokens: 200,
            outputTokens: 80,
          },
        ]),
      },
    };

    await expect(
      getAiUsageSummary(new Date("2026-09-05T00:00:00Z"), fake),
    ).resolves.toMatchObject({
      totalRuns: 2,
      totalCostUsd: 0.03,
      totalInputTokens: 300,
      totalOutputTokens: 120,
      p95LatencyMs: 300,
      failureRate: 0,
      hitlPauseRate: 0.5,
      byAgent: [
        {
          agent: "fulfillment",
          runs: 2,
          p95LatencyMs: 300,
          hitlPauseRate: 0.5,
        },
      ],
    });
  });
});
