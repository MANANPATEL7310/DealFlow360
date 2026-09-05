// apps/api/src/modules/quotation/lifecycle.ts
import type { Prisma, QuotationStatus } from "@prisma/client";
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";

/**
 * The server-side allowed transition state machine.
 * Terminal states: PAID, REJECTED (empty arrays).
 */
export const ALLOWED: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ["PENDING_APPROVAL", "APPROVED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "DRAFT"],
  APPROVED: ["SENT"],
  SENT: ["UNDER_NEGOTIATION", "CONFIRMED"],
  UNDER_NEGOTIATION: ["PENDING_APPROVAL", "CONFIRMED", "APPROVED"],
  CONFIRMED: ["FULFILLMENT"],
  FULFILLMENT: ["BILLING"],
  BILLING: ["PAID"],
  PAID: [],
  REJECTED: [],
};

export function assertTransition(from: QuotationStatus, to: QuotationStatus) {
  if (!ALLOWED[from]?.includes(to)) {
    throw Object.assign(new Error("ILLEGAL_TRANSITION"), {
      http: 409,
      code: "ILLEGAL_TRANSITION",
    });
  }
}

type QuotationRecord = { id: string; status: QuotationStatus };

/**
 * Records a status event and audit log row. Does not change quotation status directly.
 */
export async function recordEvent(
  q: QuotationRecord,
  from: QuotationStatus,
  to: QuotationStatus,
  actorId?: string | null,
  reason?: string,
  actorKind: "user" | "customer" | "system" = actorId ? "user" : "system",
  prisma: Prisma.TransactionClient | typeof db = db,
) {
  await prisma.quotationStatusEvent.create({
    data: {
      quotationId: q.id,
      fromStatus: from,
      toStatus: to,
      actorId: actorId ?? null,
      reason: reason ?? null,
    },
  });

  await writeAudit({
    actorId: actorId ?? undefined,
    actorKind,
    action: `quotation.${to.toLowerCase()}`,
    entity: "Quotation",
    entityId: q.id,
    reason,
  });
}

/**
 * Guarded transition: asserts validity, updates status, sets lastActivityAt,
 * and records the event and audit log.
 */
export async function transition(
  q: QuotationRecord,
  to: QuotationStatus,
  actorId?: string | null,
  reason?: string,
  blendedRiskScore?: number,
  actorKind: "user" | "customer" | "system" = actorId ? "user" : "system",
  prisma: Prisma.TransactionClient | typeof db = db,
) {
  assertTransition(q.status, to);

  await prisma.quotation.update({
    where: { id: q.id },
    data: {
      status: to,
      lastActivityAt: new Date(),
      ...(blendedRiskScore !== undefined ? { blendedRiskScore } : {}),
    },
  });

  await recordEvent(q, q.status, to, actorId, reason, actorKind, prisma);
}
