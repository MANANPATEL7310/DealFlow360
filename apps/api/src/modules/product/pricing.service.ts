// apps/api/src/modules/product/pricing.service.ts
import { db } from "../../lib/db.js";

/**
 * PURE priority rule for pricing:
 * Tier-specific price list > Default (tier=null) price list > product.basePrice
 * Plus any variantExtra.
 */
export function selectUnitPrice(opts: {
  tierListPrice: number | null;
  defaultListPrice: number | null;
  basePrice: number;
  variantExtra: number;
}): number {
  const base = opts.tierListPrice ?? opts.defaultListPrice ?? opts.basePrice;
  return base + opts.variantExtra;
}

async function listPrice(
  productId: string,
  currency: string,
  tier: string | null,
): Promise<number | null> {
  const item = await db.priceListItem.findFirst({
    where: {
      productId,
      priceList: {
        currency,
        customerTier: tier ? (tier as never) : null,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return item?.price ?? null;
}

/**
 * Resolves the unit price for a given product, customer tier, and currency.
 * Snapshot taken at line creation.
 */
export async function resolveUnitPrice(opts: {
  productId: string;
  variantId?: string;
  customerTier: string;
  currency: string;
}): Promise<number> {
  const product = await db.product.findUnique({
    where: { id: opts.productId },
  });
  if (!product) {
    throw Object.assign(new Error("PRODUCT_NOT_FOUND"), { http: 404 });
  }

  const [tierListPrice, defaultListPrice] = await Promise.all([
    listPrice(opts.productId, opts.currency, opts.customerTier),
    listPrice(opts.productId, opts.currency, null),
  ]);

  let variantExtra = 0;
  if (opts.variantId) {
    const v = await db.productVariant.findUnique({
      where: { id: opts.variantId },
    });
    variantExtra = v?.extraPrice ?? 0;
  }

  return selectUnitPrice({
    tierListPrice,
    defaultListPrice,
    basePrice: product.basePrice,
    variantExtra,
  });
}
