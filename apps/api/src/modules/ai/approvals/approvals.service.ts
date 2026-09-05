import type { ApprovalRequestStatus } from "@prisma/client";
import { db } from "../../../lib/db.js";
import { writeAudit } from "../../../lib/audit.js";
import { closeRun } from "../../../ai/observability.js";
import { recomputeTotals } from "../../quotation/quotation.service.js";
import { overridePlan } from "../../fulfillment/fulfillment.service.js";
import { nudgeOrEscalate } from "../../deal-health/deal-health.service.js";
import { answerNegotiation } from "../../quotation/send.service.js";

export function assertCanDecide(kind: string, role: string) {
  const normalizedRole = (role || "").toLowerCase();

  switch (kind) {
    case "DISCOUNT":
      if (!["sales_manager", "finance", "admin"].includes(normalizedRole)) {
        throw Object.assign(
          new Error(
            "FORBIDDEN: Sales Manager or Finance required for DISCOUNT approvals",
          ),
          { http: 403, statusCode: 403 },
        );
      }
      break;

    case "CREDIT_NOTE":
      if (!["finance", "admin"].includes(normalizedRole)) {
        throw Object.assign(
          new Error("FORBIDDEN: Finance required for CREDIT_NOTE approvals"),
          { http: 403, statusCode: 403 },
        );
      }
      break;

    case "NUDGE":
    case "NEGOTIATION":
      if (!["sales_rep", "sales_manager", "admin"].includes(normalizedRole)) {
        throw Object.assign(
          new Error(
            `FORBIDDEN: Sales Rep or Manager required for ${kind} approvals`,
          ),
          { http: 403, statusCode: 403 },
        );
      }
      break;

    case "FULFILLMENT_OVERRIDE":
      if (!["sales_manager", "admin"].includes(normalizedRole)) {
        throw Object.assign(
          new Error(
            "FORBIDDEN: Sales Manager required for FULFILLMENT_OVERRIDE approvals",
          ),
          { http: 403, statusCode: 403 },
        );
      }
      break;

    default:
      if (!["admin"].includes(normalizedRole)) {
        throw Object.assign(
          new Error(`FORBIDDEN: Admin required for ${kind} approvals`),
          { http: 403, statusCode: 403 },
        );
      }
  }
}

export async function listApprovals(opts: {
  status?: string;
  kind?: string;
  agent?: string;
  quotationId?: string;
  user: { sub: string; role: string };
}) {
  const where: {
    status?: ApprovalRequestStatus;
    kind?: string | { in: string[] };
    agent?: string;
    quotationId?: string;
  } = {};

  if (opts.status) {
    where.status = opts.status as ApprovalRequestStatus;
  }
  if (opts.kind) {
    where.kind = opts.kind;
  }
  if (opts.agent) {
    where.agent = opts.agent;
  }
  if (opts.quotationId) {
    where.quotationId = opts.quotationId;
  }

  // Role scoping:
  // sales_rep -> NUDGE, NEGOTIATION
  // finance -> CREDIT_NOTE, DISCOUNT
  // sales_manager -> DISCOUNT, FULFILLMENT_OVERRIDE, NUDGE, NEGOTIATION
  // admin -> all
  const role = (opts.user.role || "").toLowerCase();
  if (role === "sales_rep") {
    where.kind = { in: ["NUDGE", "NEGOTIATION"] };
  } else if (role === "finance") {
    where.kind = { in: ["CREDIT_NOTE", "DISCOUNT"] };
  } else if (role === "sales_manager") {
    where.kind = {
      in: ["DISCOUNT", "FULFILLMENT_OVERRIDE", "NUDGE", "NEGOTIATION"],
    };
  }

  return db.approvalRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      run: {
        select: {
          id: true,
          agent: true,
          status: true,
          model: true,
          promptVersion: true,
        },
      },
    },
  });
}

export async function decideApproval(
  id: string,
  body: {
    decision: "APPROVED" | "REJECTED";
    reason?: string;
    editedAction?: unknown;
  },
  user: { sub: string; role: string },
) {
  const ar = await db.approvalRequest.findUniqueOrThrow({ where: { id } });

  if (ar.status !== "PENDING") {
    throw Object.assign(
      new Error(`Approval request already decided with status ${ar.status}`),
      { http: 409, statusCode: 409 },
    );
  }

  assertCanDecide(ar.kind, user.role);

  if (body.decision === "REJECTED") {
    const updated = await db.approvalRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        decidedBy: user.sub,
        decidedAt: new Date(),
      },
    });

    await writeAudit({
      actorId: user.sub,
      actorKind: "user",
      action: "AI_APPROVAL_REJECTED",
      entity: "ApprovalRequest",
      entityId: id,
      reason: body.reason,
      diff: { kind: ar.kind, originalAction: ar.proposedAction },
    });

    if (ar.runId) {
      await closeRun(
        ar.runId,
        "FAILED",
        undefined,
        body.reason ?? "Rejected by human approver",
      );
    }

    return { status: "REJECTED", id: updated.id };
  }

  // APPROVED
  const action = (body.editedAction ?? ar.proposedAction) as Record<
    string,
    unknown
  >;
  const dispatchResult = await applyProposedAction(ar.kind, action, {
    actorId: user.sub,
  });

  const updated = await db.approvalRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      decidedBy: user.sub,
      decidedAt: new Date(),
    },
  });

  await writeAudit({
    actorId: user.sub,
    actorKind: "user",
    action: "AI_APPROVAL_APPROVED",
    entity: "ApprovalRequest",
    entityId: id,
    reason: body.reason,
    diff: { kind: ar.kind, actionApplied: action, dispatchResult },
  });

  if (ar.runId) {
    await closeRun(ar.runId, "DONE", { approved: true, dispatchResult });
  }

  return { status: "APPROVED", id: updated.id, dispatchResult };
}

export async function applyProposedAction(
  kind: string,
  action: Record<string, unknown>,
  ctx: { actorId: string },
) {
  switch (kind) {
    case "DISCOUNT": {
      const quotationId = action?.quotationId as string | undefined;
      if (!quotationId) {
        throw new Error("Missing quotationId in DISCOUNT proposedAction");
      }
      const adjustments = (action.adjustments || action.lines || []) as Array<{
        lineId?: string;
        toDiscountPct?: number;
        discountPct?: number;
      }>;
      for (const adj of adjustments) {
        const lineId = adj.lineId;
        const discountPct = adj.toDiscountPct ?? adj.discountPct;
        if (lineId && discountPct !== undefined) {
          await db.quotationLine.update({
            where: { id: lineId },
            data: { discountPct },
          });
        }
      }
      await recomputeTotals(quotationId);
      return { quotationId, updatedLines: adjustments.length };
    }

    case "FULFILLMENT_OVERRIDE": {
      const quotationId = action?.quotationId as string | undefined;
      if (!quotationId) {
        throw new Error(
          "Missing quotationId in FULFILLMENT_OVERRIDE proposedAction",
        );
      }
      const rawSplits = (action?.splits ?? []) as Array<{
        lineId?: string;
        productId?: string;
        warehouseId: string;
        qty: number;
      }>;
      const splits: Array<{
        warehouseId: string;
        productId: string;
        qty: number;
      }> = [];
      for (const s of rawSplits) {
        let productId = s.productId;
        if (!productId && s.lineId) {
          const line = await db.quotationLine.findUnique({
            where: { id: s.lineId },
          });
          productId = line?.productId;
        }
        if (!productId) {
          throw new Error("Missing productId for fulfillment split");
        }
        splits.push({
          warehouseId: s.warehouseId,
          productId,
          qty: s.qty,
        });
      }
      const result = await overridePlan(quotationId, ctx.actorId, {
        splits,
      });
      return { quotationId, plan: result };
    }

    case "CREDIT_NOTE": {
      let scheduleId = action?.scheduleId as string | undefined;
      const quotationId = action?.quotationId as string | undefined;
      if (!scheduleId && quotationId) {
        const schedule = await db.billingSchedule.findUnique({
          where: { quotationId },
        });
        scheduleId = schedule?.id;
      }
      if (!scheduleId) {
        throw new Error(
          "Missing scheduleId or quotationId for CREDIT_NOTE proposedAction",
        );
      }

      const creditNote = await db.creditNote.create({
        data: {
          scheduleId,
          amountMinor: (action.amountMinor as number) ?? 0,
          reason: (action.reason as string) ?? "AI suggested credit note",
          sourceInvoiceId: (action.sourceInvoiceId as string) ?? null,
        },
      });
      return {
        creditNoteId: creditNote.id,
        amountMinor: creditNote.amountMinor,
      };
    }

    case "NUDGE": {
      const alertId = action?.alertId as string | undefined;
      if (alertId) {
        const res = await nudgeOrEscalate(alertId, ctx.actorId, {
          message: action.message as string | undefined,
        });
        return { alertId, result: res };
      }
      return { message: (action?.message as string) ?? "Nudge recorded" };
    }

    case "NEGOTIATION": {
      const requestId = action?.requestId as string | undefined;
      const quotationId = action?.quotationId as string | undefined;
      if (requestId && quotationId) {
        const status = action.status === "ACCEPTED" ? "ACCEPTED" : "ANSWERED";
        const res = await answerNegotiation(
          quotationId,
          requestId,
          ctx.actorId,
          status,
        );
        return { requestId, negotiation: res };
      }
      return { message: "Negotiation draft approved and recorded" };
    }

    default:
      throw new Error(`Unsupported approval kind: ${kind}`);
  }
}
