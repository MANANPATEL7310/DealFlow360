// apps/api/src/test/helpers.ts
import type { QuotationStatus } from "@prisma/client";
import { db } from "../lib/db.js";

export let FINANCE: { id: string; role: "finance" };

let cachedFinance: { id: string; role: "finance" } | null = null;
let cachedRep: { id: string } | null = null;
let cachedCustomer: { id: string } | null = null;

export async function getFinanceUser() {
  if (cachedFinance) return cachedFinance;
  let user = await db.user.findFirst({ where: { role: "finance" } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: `finance-${Date.now()}@dealflow360.dev`,
        name: "Finance User",
        password: "password123",
        role: "finance",
      },
    });
  }
  FINANCE = { id: user.id, role: "finance" };
  cachedFinance = FINANCE;
  return FINANCE;
}

export type SeedHybridQuoteOpts = {
  status?: QuotationStatus;
  oneTime?: Array<{
    unitPriceMinor: number;
    qty: number;
    discountPct?: number;
    taxRatePct?: number;
  }>;
  recurring?: Array<{
    unitPriceMinor: number;
    qty: number;
    discountPct?: number;
    taxRatePct?: number;
    interval?: "MONTHLY" | "QUARTERLY" | "YEARLY";
    cancellationRule?: "prorated_credit" | "none";
  }>;
};

export async function seedHybridQuote(opts: SeedHybridQuoteOpts) {
  await getFinanceUser();

  if (!cachedRep) {
    let rep = await db.user.findFirst({ where: { role: "sales_rep" } });
    if (!rep) {
      rep = await db.user.create({
        data: {
          email: `rep-${Date.now()}@dealflow360.dev`,
          name: "Sales Rep",
          password: "password123",
          role: "sales_rep",
        },
      });
    }
    cachedRep = { id: rep.id };
  }

  if (!cachedCustomer) {
    let customer = await db.customer.findFirst();
    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: "Test Customer",
          tier: "GOLD",
          currency: "USD",
        },
      });
    }
    cachedCustomer = { id: customer.id };
  }

  const quote = await db.quotation.create({
    data: {
      customerId: cachedCustomer.id,
      salesRepId: cachedRep.id,
      status: opts.status ?? "CONFIRMED",
      subtotalMinor: 0,
      discountTotalMinor: 0,
      taxTotalMinor: 0,
      grandTotalMinor: 0,
    },
  });

  // Create one-time lines
  if (opts.oneTime) {
    let i = 0;
    for (const item of opts.oneTime) {
      i++;
      const product = await db.product.create({
        data: {
          name: `One-Time Product ${Date.now()}-${i}`,
          category: "HARDWARE",
          unit: "unit",
          basePrice: item.unitPriceMinor,
          unitCost: Math.round(item.unitPriceMinor * 0.7),
          taxRatePct: item.taxRatePct ?? 0,
        },
      });

      await db.quotationLine.create({
        data: {
          quotationId: quote.id,
          productId: product.id,
          lineType: "ONE_TIME",
          qty: item.qty,
          unitPriceMinor: item.unitPriceMinor,
          unitCostMinor: product.unitCost,
          discountPct: item.discountPct ?? 0,
        },
      });
    }
  }

  // Create recurring lines
  if (opts.recurring) {
    let i = 0;
    for (const item of opts.recurring) {
      i++;
      const plan = await db.subscriptionPlan.create({
        data: {
          name: `Plan ${Date.now()}-${i}`,
          interval: item.interval ?? "MONTHLY",
          cancellationRule: item.cancellationRule ?? "prorated_credit",
          prorationEnabled: true,
        },
      });

      const product = await db.product.create({
        data: {
          name: `Recurring Product ${Date.now()}-${i}`,
          category: "SUBSCRIPTIONS",
          unit: "licence",
          basePrice: item.unitPriceMinor,
          unitCost: Math.round(item.unitPriceMinor * 0.5),
          taxRatePct: item.taxRatePct ?? 0,
        },
      });

      await db.quotationLine.create({
        data: {
          quotationId: quote.id,
          productId: product.id,
          subscriptionPlanId: plan.id,
          lineType: "RECURRING",
          qty: item.qty,
          unitPriceMinor: item.unitPriceMinor,
          unitCostMinor: product.unitCost,
          discountPct: item.discountPct ?? 0,
        },
      });
    }
  }

  return db.quotation.findUniqueOrThrow({
    where: { id: quote.id },
    include: {
      lines: {
        include: { product: true, subscriptionPlan: true },
      },
    },
  });
}
