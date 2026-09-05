// apps/api/src/modules/billing/billing.controller.ts
import type { Request, Response } from "express";
import { db } from "../../lib/db.js";
import { sendCreated, sendOk } from "../../lib/response.js";
import { changeSubscription, recordPayment } from "./billing.service.js";

export async function getBillingScheduleHandler(req: Request, res: Response) {
  const quotationId = req.params.id as string;
  const schedule = await db.billingSchedule.findUnique({
    where: { quotationId },
    include: {
      invoices: { orderBy: [{ periodStart: "asc" }, { createdAt: "asc" }] },
      creditNotes: { orderBy: { createdAt: "asc" } },
    },
  });

  return sendOk(res, schedule);
}

export async function listBillingSchedulesHandler(req: Request, res: Response) {
  const where =
    req.user!.role === "sales_rep"
      ? { quotation: { salesRepId: req.user!.sub } }
      : {};
  const schedules = await db.billingSchedule.findMany({
    where,
    include: {
      invoices: { orderBy: [{ periodStart: "asc" }, { createdAt: "asc" }] },
      creditNotes: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return sendOk(res, schedules);
}

export async function subscriptionChangeHandler(req: Request, res: Response) {
  const quotationId = req.params.id as string;
  const actorId = req.user!.sub;
  const result = await changeSubscription(quotationId, actorId, req.body);
  return sendOk(res, result, "Subscription change applied successfully.");
}

export async function recordPaymentHandler(req: Request, res: Response) {
  const invoiceId = req.params.invoiceId as string;
  const actorId = req.user!.sub;
  const result = await recordPayment(invoiceId, req.body.amountMinor, actorId);
  return sendCreated(res, result, "Payment recorded successfully.");
}
