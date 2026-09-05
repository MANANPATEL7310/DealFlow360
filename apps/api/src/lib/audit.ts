// apps/api/src/lib/audit.ts
import { db } from "./db.js";

/**
 * writeAudit — insert one immutable audit log row.
 *
 * Every mutating operation in DealFlow360 MUST call this:
 *   - Quote create / confirm / approve
 *   - Line mutations
 *   - Fulfillment accept / override / consolidate
 *   - Billing / credit changes
 *   - Portal confirm
 *   - Admin config changes
 *
 * Never call db.auditLog.create() directly — always go through writeAudit()
 * so that the schema for audit entries stays consistent.
 */
export async function writeAudit(entry: {
  actorId?: string;
  actorKind?: "user" | "customer" | "system";
  action: string;
  entity: string;
  entityId: string;
  reason?: string;
  diff?: unknown;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        ...entry,
        diff: entry.diff as never, // stored as JSON in DB
      },
    });
  } catch (err) {
    console.warn(
      "[audit] writeAudit DB skipped or unavailable:",
      err instanceof Error ? err.message : err,
    );
  }
}
