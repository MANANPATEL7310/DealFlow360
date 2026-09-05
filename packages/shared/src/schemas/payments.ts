import { z } from "zod";

// ── Payment Gateway Schemas & Types ──────────────────────────────────────────

export const CreateCheckoutSessionInputSchema = z.object({
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof CreateCheckoutSessionInputSchema
>;

export const CreateCheckoutSessionResponseSchema = z.object({
  mode: z.enum(["live", "simulation"]),
  sessionId: z.string(),
  checkoutUrl: z.string().optional(),
  amountDueMinor: z.number().int().nonnegative(),
  message: z.string().optional(),
});

export type CreateCheckoutSessionResponse = z.infer<
  typeof CreateCheckoutSessionResponseSchema
>;

export const SimulateCheckoutInputSchema = z.object({
  invoiceId: z.string().min(1),
  amountMinor: z.number().int().positive().optional(),
});

export type SimulateCheckoutInput = z.infer<typeof SimulateCheckoutInputSchema>;

export const SimulateCheckoutResponseSchema = z.object({
  success: z.boolean(),
  invoiceId: z.string(),
  amountSettled: z.number().int().nonnegative(),
  newStatus: z.string(),
});

export type SimulateCheckoutResponse = z.infer<
  typeof SimulateCheckoutResponseSchema
>;
