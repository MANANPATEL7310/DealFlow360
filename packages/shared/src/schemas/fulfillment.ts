import { z } from "zod";

export const overrideFulfillmentSchema = z.object({
  splits: z
    .array(
      z.object({
        warehouseId: z.string().min(1),
        productId: z.string().min(1),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
});

export type OverrideFulfillmentInput = z.infer<
  typeof overrideFulfillmentSchema
>;
