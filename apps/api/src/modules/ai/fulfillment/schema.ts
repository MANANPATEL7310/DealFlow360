import { z } from "zod";
import { overrideFulfillmentSchema } from "../../fulfillment/fulfillment.schema.js";

export const FulfillmentOutput = z.object({
  proposedSplits: overrideFulfillmentSchema.shape.splits,
  backorders: z.array(
    z.object({
      productId: z.string(),
      qty: z.number().int().positive(),
    }),
  ),
  rationale: z.string().min(1),
  estShipmentCost: z.number().int().nonnegative(),
  estShipmentCount: z.number().int().nonnegative(),
});

export type FulfillmentOutput = z.infer<typeof FulfillmentOutput>;
