// packages/shared/src/schemas/billing.ts
// === M8: Hybrid Billing ===
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const billingIntervals = ["MONTHLY", "QUARTERLY", "YEARLY"] as const;
export type BillingInterval = (typeof billingIntervals)[number];
export const billingIntervalSchema = z.enum(billingIntervals);

export const invoiceKinds = ["ONE_TIME", "RECURRING"] as const;
export type InvoiceKind = (typeof invoiceKinds)[number];
export const invoiceKindSchema = z.enum(invoiceKinds);

export const invoiceStatuses = ["DRAFT", "ISSUED", "PAID", "VOID"] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];
export const invoiceStatusSchema = z.enum(invoiceStatuses);

// ─── Payment Schema ───────────────────────────────────────────────────────────

export const paymentSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  amountMinor: z.number().int().positive(), // in cents
  paymentMethod: z.string().default("Corporate Wire"),
  reference: z.string().nullable().optional(),
  status: z.enum(["pending", "recorded", "failed"]).default("recorded"),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Payment = z.infer<typeof paymentSchema>;

export const recordPaymentSchema = z.object({
  amountMinor: z.number().int().positive(), // minor units — must be > 0
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// ─── Subscription Plan ────────────────────────────────────────────────────────

export const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  interval: billingIntervalSchema,
  prorationEnabled: z.boolean().default(true),
  cancellationRule: z
    .enum(["prorated_credit", "none"])
    .default("prorated_credit"),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  interval: billingIntervalSchema,
  prorationEnabled: z.boolean().default(true),
  cancellationRule: z
    .enum(["prorated_credit", "none"])
    .default("prorated_credit"),
});
export type CreateSubscriptionPlanInput = z.infer<
  typeof createSubscriptionPlanSchema
>;

// ─── Subscription Change ──────────────────────────────────────────────────────

export const subscriptionChangeSchema = z.object({
  lineId: z.string().min(1),
  newPeriodAmountMinor: z.number().int().nonnegative(), // 0 = cancel the subscription
  reason: z.string().min(1),
  changeDate: z.coerce.date().optional(), // defaults to now() on the server
});
export type SubscriptionChangeInput = z.infer<typeof subscriptionChangeSchema>;

// ─── Invoices & Credit Notes ──────────────────────────────────────────────────

export const invoiceSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  kind: invoiceKindSchema,
  lineId: z.string().nullable().optional(), // QuotationLine reference for RECURRING; null for aggregated ONE_TIME
  periodStart: z.string().nullable().optional(),
  periodEnd: z.string().nullable().optional(),
  amountMinor: z.number().int().nonnegative(),
  status: invoiceStatusSchema.default("DRAFT"),
  payments: z.array(paymentSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const creditNoteSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  reason: z.string(),
  amountMinor: z.number().int().positive(),
  sourceInvoiceId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type CreditNote = z.infer<typeof creditNoteSchema>;

export const billingScheduleSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  invoices: z.array(invoiceSchema).default([]),
  creditNotes: z.array(creditNoteSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type BillingSchedule = z.infer<typeof billingScheduleSchema>;

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const SEED_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "sub-plan-01",
    name: "Enterprise Platform Monthly",
    interval: "MONTHLY",
    prorationEnabled: true,
    cancellationRule: "prorated_credit",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "sub-plan-02",
    name: "Enterprise Platform Annual",
    interval: "YEARLY",
    prorationEnabled: true,
    cancellationRule: "prorated_credit",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
];

export const SEED_BILLING_SCHEDULES: BillingSchedule[] = [
  {
    id: "sch-101",
    quotationId: "qt-101",
    createdAt: "2026-09-04T12:00:00.000Z",
    updatedAt: "2026-09-05T09:00:00.000Z",
    invoices: [
      {
        id: "inv-101-ot",
        scheduleId: "sch-101",
        kind: "ONE_TIME",
        lineId: null,
        periodStart: null,
        periodEnd: null,
        amountMinor: 4560000, // $45,600.00
        status: "ISSUED",
        payments: [
          {
            id: "pay-101-ot-1",
            invoiceId: "inv-101-ot",
            amountMinor: 2000000, // $20,000.00 deposit
            paymentMethod: "Wire Transfer",
            reference: "WIRE-7738291",
            status: "recorded",
            createdAt: "2026-09-04T16:00:00.000Z",
          },
        ],
        createdAt: "2026-09-04T12:00:00.000Z",
        updatedAt: "2026-09-04T16:00:00.000Z",
      },
      {
        id: "inv-101-sub-m1",
        scheduleId: "sch-101",
        kind: "RECURRING",
        lineId: "qtl-101-sub",
        periodStart: "2026-09-01T00:00:00.000Z",
        periodEnd: "2026-09-30T23:59:59.000Z",
        amountMinor: 60000, // $600.00
        status: "PAID",
        payments: [
          {
            id: "pay-101-sub-1",
            invoiceId: "inv-101-sub-m1",
            amountMinor: 60000, // $600.00
            paymentMethod: "Corporate Card",
            reference: "CHRG-994821",
            status: "recorded",
            createdAt: "2026-09-01T10:00:00.000Z",
          },
        ],
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T10:00:00.000Z",
      },
      {
        id: "inv-101-sub-m2",
        scheduleId: "sch-101",
        kind: "RECURRING",
        lineId: "qtl-101-sub",
        periodStart: "2026-10-01T00:00:00.000Z",
        periodEnd: "2026-10-31T23:59:59.000Z",
        amountMinor: 60000, // $600.00
        status: "ISSUED",
        payments: [],
        createdAt: "2026-09-04T12:00:00.000Z",
        updatedAt: "2026-09-04T12:00:00.000Z",
      },
      {
        id: "inv-101-sub-m3",
        scheduleId: "sch-101",
        kind: "RECURRING",
        lineId: "qtl-101-sub",
        periodStart: "2026-11-01T00:00:00.000Z",
        periodEnd: "2026-11-30T23:59:59.000Z",
        amountMinor: 60000, // $600.00
        status: "DRAFT",
        payments: [],
        createdAt: "2026-09-04T12:00:00.000Z",
      },
      {
        id: "inv-101-sub-m4",
        scheduleId: "sch-101",
        kind: "RECURRING",
        lineId: "qtl-101-sub",
        periodStart: "2026-12-01T00:00:00.000Z",
        periodEnd: "2026-12-31T23:59:59.000Z",
        amountMinor: 60000, // $600.00
        status: "DRAFT",
        payments: [],
        createdAt: "2026-09-04T12:00:00.000Z",
      },
      {
        id: "inv-101-sub-m5",
        scheduleId: "sch-101",
        kind: "RECURRING",
        lineId: "qtl-101-sub",
        periodStart: "2027-01-01T00:00:00.000Z",
        periodEnd: "2027-01-31T23:59:59.000Z",
        amountMinor: 60000, // $600.00
        status: "DRAFT",
        payments: [],
        createdAt: "2026-09-04T12:00:00.000Z",
      },
      {
        id: "inv-101-sub-m6",
        scheduleId: "sch-101",
        kind: "RECURRING",
        lineId: "qtl-101-sub",
        periodStart: "2027-02-01T00:00:00.000Z",
        periodEnd: "2027-02-28T23:59:59.000Z",
        amountMinor: 60000, // $600.00
        status: "DRAFT",
        payments: [],
        createdAt: "2026-09-04T12:00:00.000Z",
      },
    ],
    creditNotes: [
      {
        id: "cn-101-01",
        scheduleId: "sch-101",
        reason: "Early pilot onboarding goodwill adjustment (5 days waived)",
        amountMinor: 10000, // $100.00 credit
        sourceInvoiceId: "inv-101-sub-m1",
        createdAt: "2026-09-02T14:30:00.000Z",
      },
    ],
  },
  {
    id: "sch-102",
    quotationId: "qt-102",
    createdAt: "2026-09-04T14:30:00.000Z",
    updatedAt: "2026-09-04T14:30:00.000Z",
    invoices: [
      {
        id: "inv-102-ot",
        scheduleId: "sch-102",
        kind: "ONE_TIME",
        lineId: null,
        periodStart: null,
        periodEnd: null,
        amountMinor: 3365280, // $33,652.80
        status: "ISSUED",
        payments: [],
        createdAt: "2026-09-04T14:30:00.000Z",
      },
    ],
    creditNotes: [],
  },
];
