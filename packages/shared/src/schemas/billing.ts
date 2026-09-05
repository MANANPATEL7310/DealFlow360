// packages/shared/src/schemas/billing.ts
// === M8: Hybrid Billing ===
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const billingIntervalSchema = z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]);
export const invoiceKindSchema = z.enum(["ONE_TIME", "RECURRING"]);
export const invoiceStatusSchema = z.enum(["DRAFT", "ISSUED", "PAID", "VOID"]);

// ─── Subscription Change ──────────────────────────────────────────────────────

export const subscriptionChangeSchema = z.object({
  lineId: z.string().min(1),
  newPeriodAmountMinor: z.number().int().nonnegative(), // 0 = cancel the subscription
  reason: z.string().min(1),
  changeDate: z.coerce.date().optional(), // defaults to now() on the server
});

// ─── Record Payment ───────────────────────────────────────────────────────────

export const recordPaymentSchema = z.object({
  amountMinor: z.number().int().positive(), // minor units — must be > 0
});

// ─── Subscription Plan (admin creation) ──────────────────────────────────────

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  interval: billingIntervalSchema,
  prorationEnabled: z.boolean().default(true),
  cancellationRule: z
    .enum(["prorated_credit", "none"])
    .default("prorated_credit"),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type BillingInterval = z.infer<typeof billingIntervalSchema>;
export type InvoiceKind = z.infer<typeof invoiceKindSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type SubscriptionChangeInput = z.infer<typeof subscriptionChangeSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateSubscriptionPlanInput = z.infer<
  typeof createSubscriptionPlanSchema
>;
