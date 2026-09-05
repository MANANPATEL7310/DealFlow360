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
