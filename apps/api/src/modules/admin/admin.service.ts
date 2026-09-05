import { getAuditLogsStore, writeAudit } from "../../lib/audit.js";
import { getSettingsMap } from "../../lib/settings.js";
import type { AuditLog, AuditLogQuery, SystemSetting } from "./admin.schema.js";

export class AdminService {
  /**
   * Returns all active runtime system settings.
   */
  listSettings(): SystemSetting[] {
    const map = getSettingsMap();
    return Array.from(map.values());
  }

  /**
   * Updates a single system setting and commits an immutable compliance audit record.
   */
  async updateSetting(
    key: string,
    newValue: unknown,
    actorId?: string,
    actorName?: string,
  ): Promise<SystemSetting> {
    const map = getSettingsMap();
    const existing = map.get(key);

    if (!existing) {
      throw new Error(`Setting with key "${key}" not found.`);
    }

    const oldValue = existing.value;
    const updated: SystemSetting = {
      ...existing,
      value: newValue,
      updatedAt: new Date().toISOString(),
    };

    map.set(key, updated);

    // Write immutable compliance audit log entry
    await writeAudit({
      actorId: actorId ?? "usr-admin-01",
      actorName: actorName ?? "System Administrator",
      actorKind: "user",
      action: "settings.updated",
      entity: "SystemSetting",
      entityId: key,
      reason: `Updated runtime parameter ${existing.label}`,
      diff: {
        key,
        before: oldValue,
        after: newValue,
      },
    });

    return updated;
  }

  /**
   * Queries the append-only compliance audit trail with filtering and pagination.
   */
  listAuditLogs(query: AuditLogQuery): {
    items: AuditLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    let logs = getAuditLogsStore();

    if (query.entity) {
      const qEntity = query.entity.toLowerCase();
      logs = logs.filter((l) => l.entity.toLowerCase().includes(qEntity));
    }

    if (query.entityId) {
      logs = logs.filter((l) => l.entityId === query.entityId);
    }

    if (query.actorId) {
      logs = logs.filter((l) => l.actorId === query.actorId);
    }

    if (query.action) {
      const qAction = query.action.toLowerCase();
      logs = logs.filter((l) => l.action.toLowerCase().includes(qAction));
    }

    if (query.from) {
      const fromTime = new Date(query.from).getTime();
      logs = logs.filter((l) => new Date(l.createdAt).getTime() >= fromTime);
    }

    if (query.to) {
      const toTime = new Date(query.to).getTime();
      logs = logs.filter((l) => new Date(l.createdAt).getTime() <= toTime);
    }

    const total = logs.length;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const startIndex = (page - 1) * pageSize;
    const items = logs.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}

export const adminService = new AdminService();
