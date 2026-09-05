// apps/api/src/modules/quotation/approval.service.ts
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { transition } from "./lifecycle.js";

const LEVEL_ROLE: Record<string, string> = {
  SALES_MANAGER: "sales_manager",
  FINANCE: "finance",
};

export async function decideApproval(
  quotationId: string,
  actor: { id: string; role: string },
  input: { decision: "APPROVED" | "REJECTED" | "RETURNED"; reason: string },
) {
  const q = await db.quotation.findUnique({ where: { id: quotationId } });
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }
  if (q.status !== "PENDING_APPROVAL") {
    throw Object.assign(new Error("NOT_PENDING"), { http: 409 });
  }

  const steps = await db.approvalStep.findMany({
    where: { quotationId },
    orderBy: { sequence: "asc" },
  });
  const current = steps.find((s) => s.decision === "PENDING");
  if (!current) {
    throw Object.assign(new Error("NO_PENDING_STEP"), { http: 409 });
  }

  // Reviewer may only act on the current step whose level maps to their role (or admin)
  if (LEVEL_ROLE[current.level] !== actor.role && actor.role !== "admin") {
    throw Object.assign(new Error("WRONG_APPROVER"), { http: 403 });
  }

  const stamp = {
    approverId: actor.id,
    reason: input.reason,
    decidedAt: new Date(),
  };

  await db.approvalStep.update({
    where: { id: current.id },
    data: { decision: input.decision, ...stamp },
  });

  await writeAudit({
    actorId: actor.id,
    actorKind: "user",
    action: `approval.${input.decision.toLowerCase()}`,
    entity: "ApprovalStep",
    entityId: current.id,
    reason: input.reason,
  });

  if (input.decision === "REJECTED") {
    await transition(q, "REJECTED", actor.id, input.reason);
    return { status: "REJECTED" };
  }

  if (input.decision === "RETURNED") {
    await transition(q, "DRAFT", actor.id, input.reason);
    return { status: "DRAFT" };
  }

  // APPROVED: check if a later step is still pending, else the quote is fully approved
  const laterPending = steps.some(
    (s) => s.sequence > current.sequence && s.decision === "PENDING",
  );
  if (!laterPending) {
    await transition(q, "APPROVED", actor.id, "All approvals granted");
    return { status: "APPROVED" };
  }

  const nextStep = steps.find(
    (s) => s.sequence > current.sequence && s.decision === "PENDING",
  );
  return {
    status: "PENDING_APPROVAL",
    nextLevel: nextStep?.level,
  };
}
