// apps/api/src/modules/quotation/confirmed.hook.ts
import type { Prisma } from "@prisma/client";
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";

/**
 * Hook executed whenever a quotation transitions to CONFIRMED.
 * Extensible for downstream modules (M7: Warehouse Fulfillment, M8: Hybrid Billing Schedule).
 */
export async function onConfirmed(
  quotationId: string,
  prisma: Prisma.TransactionClient | typeof db = db,
): Promise<void> {
  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      lastActivityAt: new Date(),
    },
  });

  await writeAudit({
    actorKind: "system",
    action: "quotation.confirmed_hook_executed",
    entity: "Quotation",
    entityId: quotationId,
    reason: "Quotation confirmed lifecycle hook triggered",
  });
}
