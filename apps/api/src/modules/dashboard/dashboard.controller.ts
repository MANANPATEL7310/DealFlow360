import type { Request, Response } from "express";
import { db } from "../../lib/db.js";
import { sendOk } from "../../lib/response.js";

function scopeFor(role: string, userId: string) {
  return role === "sales_rep" ? { salesRepId: userId } : {};
}

export async function dashboardSummaryController(req: Request, res: Response) {
  const where = scopeFor(req.user!.role, req.user!.sub);
  const quotations = await db.quotation.findMany({
    where,
    select: { status: true, grandTotalMinor: true, marginPct: true },
  });
  const backorders = await db.backorder.count({
    where: { plan: { quotation: where } },
  });
  const stages = {
    draft: 0,
    pendingApproval: 0,
    approved: 0,
    sent: 0,
    underNegotiation: 0,
    confirmed: 0,
  };
  for (const quotation of quotations) {
    if (quotation.status === "DRAFT") stages.draft += 1;
    if (quotation.status === "PENDING_APPROVAL") stages.pendingApproval += 1;
    if (quotation.status === "APPROVED") stages.approved += 1;
    if (quotation.status === "SENT") stages.sent += 1;
    if (quotation.status === "UNDER_NEGOTIATION") stages.underNegotiation += 1;
    if (
      ["CONFIRMED", "FULFILLMENT", "BILLING", "PAID"].includes(quotation.status)
    )
      stages.confirmed += 1;
  }
  const totalPipelineMinor = quotations.reduce(
    (total, quotation) => total + quotation.grandTotalMinor,
    0,
  );
  const averageMarginPct = quotations.length
    ? Number(
        (
          quotations.reduce(
            (total, quotation) => total + quotation.marginPct,
            0,
          ) / quotations.length
        ).toFixed(2),
      )
    : 0;
  const confirmedRevenueMinor = quotations
    .filter((quotation) =>
      ["CONFIRMED", "FULFILLMENT", "BILLING", "PAID"].includes(
        quotation.status,
      ),
    )
    .reduce((total, quotation) => total + quotation.grandTotalMinor, 0);
  return sendOk(res, {
    kpis: {
      totalPipelineMinor,
      averageMarginPct,
      pendingApprovalsCount: stages.pendingApproval,
      activeBackordersCount: backorders,
      confirmedRevenueMinor,
    },
    stages,
  });
}

export async function recentQuotationsController(req: Request, res: Response) {
  const requestedLimit = Number(req.query.limit ?? 6);
  const take = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 50)
    : 6;
  const quotations = await db.quotation.findMany({
    where: scopeFor(req.user!.role, req.user!.sub),
    take,
    orderBy: { updatedAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, tier: true } },
      owner: { select: { name: true } },
    },
  });
  return sendOk(
    res,
    quotations.map((quotation) => ({
      id: quotation.id,
      code: quotation.id,
      customerId: quotation.customerId,
      customerName: quotation.customer.name,
      customerTier: quotation.customer.tier,
      salesRepName: quotation.owner.name,
      subtotalMinor: quotation.subtotalMinor,
      netTotalMinor: quotation.grandTotalMinor,
      marginPct: quotation.marginPct,
      blendedRiskScore: quotation.blendedRiskScore,
      status: quotation.status,
      createdAt: quotation.createdAt.toISOString(),
    })),
  );
}
