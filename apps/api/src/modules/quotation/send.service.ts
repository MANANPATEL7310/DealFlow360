// apps/api/src/modules/quotation/send.service.ts
import { env } from "../../config/env.js";
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { mintPortalToken } from "../portal/portal.token.js";
import { transition } from "./lifecycle.js";

export async function sendToCustomer(
  quotationId: string,
  actorId: string,
  contactId: string,
) {
  const q = await db.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: {
        include: {
          contacts: true,
        },
      },
    },
  });

  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }
  if (q.status !== "APPROVED") {
    throw Object.assign(
      new Error(
        "Quotation must be in APPROVED status before sending to customer.",
      ),
      { http: 409, code: "NOT_APPROVED" },
    );
  }
  if (!q.customer.contacts.some((c) => c.id === contactId)) {
    throw Object.assign(
      new Error(
        "Selected contact does not belong to the quotation's customer.",
      ),
      { http: 422, code: "CONTACT_NOT_ON_CUSTOMER" },
    );
  }

  await transition(q, "SENT", actorId, `Sent to customer contact ${contactId}`);

  const token = mintPortalToken({ quotationId, contactId });
  const url = `${env.WEB_ORIGIN}/portal?token=${token}`;

  await writeAudit({
    actorId,
    actorKind: "user",
    action: "quotation.sent_to_customer",
    entity: "Quotation",
    entityId: quotationId,
    diff: { contactId, url },
  });

  return { token, url };
}

export async function listNegotiations(quotationId: string) {
  const q = await db.quotation.findUnique({ where: { id: quotationId } });
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }

  return db.negotiationRequest.findMany({
    where: { quotationId },
    include: {
      contact: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function answerNegotiation(
  quotationId: string,
  negId: string,
  actorId: string,
  status: "ANSWERED" | "ACCEPTED",
) {
  const neg = await db.negotiationRequest.findUnique({
    where: { id: negId },
  });

  if (!neg || neg.quotationId !== quotationId) {
    throw Object.assign(
      new Error("Negotiation request not found for this quotation."),
      { http: 404, code: "NEGOTIATION_NOT_FOUND" },
    );
  }

  const updated = await db.negotiationRequest.update({
    where: { id: negId },
    data: { status },
  });

  await writeAudit({
    actorId,
    actorKind: "user",
    action: `negotiation.${status.toLowerCase()}`,
    entity: "NegotiationRequest",
    entityId: negId,
    diff: { quotationId, status },
  });

  return updated;
}
