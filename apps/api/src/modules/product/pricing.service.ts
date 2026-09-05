// apps/api/src/modules/product/pricing.service.ts
// === M1: Price resolution — pure logic + DB orchestration ===
//
// selectUnitPrice  — PURE, no DB. Testable in isolation (see pricing.service.test.ts).
// resolveUnitPrice — DB orchestration layer. Delegates the price decision to selectUnitPrice.
//
// Priority rule: tier+currency list  >  default (tier=null) list  >  product.basePrice
//                                                                  + variantExtra on top

import { db } from "../../lib/db.js";

// ─── Pure selector (unit-testable, no I/O) ────────────────────────────────────

export type SelectUnitPriceOpts = {
  /** Price from the customer's tier+currency price list, if any record exists. */
  tierListPrice: number | null;
  /** Price from the default (tier=null) list for that currency, if any. */
  defaultListPrice: number | null;
  /** Product.basePrice — the absolute fallback (minor units). */
  basePrice: number;
  /** ProductVariant.extraPrice — 0 when no variant is selected. */
  variantExtra: number;
};

/**
 * Resolves the unit price (minor units) given the available price sources.
 *
 * Tier list beats default list beats basePrice. Variant extra is always added on top.
 *
 * @example
 * selectUnitPrice({ tierListPrice: 9000, defaultListPrice: 10000, basePrice: 12000, variantExtra: 0 })
 * // => 9000
 *
 * selectUnitPrice({ tierListPrice: null, defaultListPrice: null, basePrice: 12000, variantExtra: 1500 })
 * // => 13500
 */
export function selectUnitPrice(opts: SelectUnitPriceOpts): number {
  const base = opts.tierListPrice ?? opts.defaultListPrice ?? opts.basePrice;
  return base + opts.variantExtra;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

/** Looks up the price from a specific price list matching currency + tier. */
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
        customerTier: tier as never, // null = default list; cast satisfies Prisma enum filter
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return item?.price ?? null;
}

// ─── DB orchestration (requires Prisma client) ────────────────────────────────

export type ResolveUnitPriceOpts = {
  productId: string;
  variantId?: string;
  customerTier: string; // "BRONZE" | "SILVER" | "GOLD"
  currency: string; // e.g. "USD"
};

/**
 * Looks up the correct unit price for a product given a customer's tier and currency.
 * Throws a 404-tagged error if the product does not exist.
 */
export async function resolveUnitPrice(
  opts: ResolveUnitPriceOpts,
): Promise<number> {
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
    const variant = await db.productVariant.findUnique({
      where: { id: opts.variantId },
    });
    variantExtra = variant?.extraPrice ?? 0;
  }

  return selectUnitPrice({
    tierListPrice,
    defaultListPrice,
    basePrice: product.basePrice,
    variantExtra,
  });
}
