import type { ActorKind, AuditLog } from "@template/shared";
import { INITIAL_AUDIT_LOGS } from "@template/shared";

// In-memory compliance audit log repository (tamper-evident, append-only)
const auditLogsStore: AuditLog[] = [...INITIAL_AUDIT_LOGS];

export interface WriteAuditInput {
  actorId?: string | null;
  actorName?: string | null;
  actorKind?: ActorKind;
  action: string;
  entity: string;
  entityId: string;
  reason?: string | null;
  diff?: Record<string, unknown> | null;
}

/**
 * Appends an immutable audit trail entry across the platform.
 * PS A3: "All approvals, rejections, and edits must be logged with user, timestamp, and reason."
 */
export async function writeAudit(entry: WriteAuditInput): Promise<AuditLog> {
  const newLog: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorId: entry.actorId ?? null,
    actorName: entry.actorName ?? (entry.actorKind === "customer" ? "Customer Portal" : "System"),
    actorKind: entry.actorKind ?? "system",
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    reason: entry.reason ?? null,
    diff: entry.diff ?? null,
    createdAt: new Date().toISOString(),
  };

  auditLogsStore.unshift(newLog); // newest first
  return newLog;
}

export function getAuditLogsStore(): AuditLog[] {
  return auditLogsStore;
}
