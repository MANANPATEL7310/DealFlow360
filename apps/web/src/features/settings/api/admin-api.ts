import {
  apiRoutes,
  type AuditLog,
  type AuditLogQuery,
  CANONICAL_SETTINGS,
  INITIAL_AUDIT_LOGS,
  type SystemSetting,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";
import { useAuthStore } from "@/stores/auth-store";

// Local in-memory simulation store
const fallbackSettings: SystemSetting[] = CANONICAL_SETTINGS.map((def) => ({
  id: `set-${def.key.replace(/\./g, "-")}`,
  key: def.key,
  value: def.defaultValue,
  category: def.category,
  label: def.label,
  description: def.description,
  scope: "global",
  updatedAt: new Date().toISOString(),
}));

const fallbackAuditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

export const adminApi = {
  async listSettings(): Promise<SystemSetting[]> {
    try {
      const res = await apiClient.get(apiRoutes.admin.settings.path);
      if (res.data?.data) {
        return res.data.data as SystemSetting[];
      }
      return [...fallbackSettings];
    } catch {
      return [...fallbackSettings];
    }
  },

  async updateSetting(key: string, value: unknown): Promise<SystemSetting> {
    try {
      const path = apiRoutes.admin.updateSetting.path.replace(
        ":key",
        encodeURIComponent(key),
      );
      const res = await apiClient.put(path, { value });
      if (res.data?.data) {
        return res.data.data as SystemSetting;
      }
      return updateFallbackSetting(key, value);
    } catch {
      return updateFallbackSetting(key, value);
    }
  },

  async listAuditLogs(filters: AuditLogQuery = {}): Promise<{
    items: AuditLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const res = await apiClient.get(apiRoutes.admin.auditLogs.path, {
        params: filters,
      });
      if (res.data?.data) {
        return res.data.data;
      }
      return queryFallbackAuditLogs(filters);
    } catch {
      return queryFallbackAuditLogs(filters);
    }
  },
};

function updateFallbackSetting(key: string, value: unknown): SystemSetting {
  const index = fallbackSettings.findIndex((s) => s.key === key);
  const user = useAuthStore.getState().user;
  const oldValue = index !== -1 ? fallbackSettings[index]?.value : undefined;

  const updated: SystemSetting = {
    id:
      index !== -1
        ? fallbackSettings[index]!.id
        : `set-${key.replace(/\./g, "-")}`,
    key,
    value,
    category: index !== -1 ? fallbackSettings[index]!.category : "general",
    label: index !== -1 ? fallbackSettings[index]!.label : key,
    description:
      index !== -1 ? fallbackSettings[index]!.description : "Runtime parameter",
    scope: "global",
    updatedAt: new Date().toISOString(),
  };

  if (index !== -1) {
    fallbackSettings[index] = updated;
  } else {
    fallbackSettings.push(updated);
  }

  // Record audit trail entry in fallback store
  fallbackAuditLogs.unshift({
    id: `aud-${Date.now()}`,
    actorId: user?.id ?? "usr-admin-01",
    actorName: user?.name ?? "System Administrator",
    actorKind: "user",
    action: "settings.updated",
    entity: "SystemSetting",
    entityId: key,
    reason: `Updated runtime parameter ${updated.label}`,
    diff: {
      key,
      before: oldValue,
      after: value,
    },
    createdAt: new Date().toISOString(),
  });

  return updated;
}

function queryFallbackAuditLogs(query: AuditLogQuery) {
  let logs = [...fallbackAuditLogs];

  if (query.entity) {
    const q = query.entity.toLowerCase();
    logs = logs.filter((l) => l.entity.toLowerCase().includes(q));
  }

  if (query.action) {
    const q = query.action.toLowerCase();
    logs = logs.filter((l) => l.action.toLowerCase().includes(q));
  }

  if (query.actorId) {
    logs = logs.filter((l) => l.actorId === query.actorId);
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
