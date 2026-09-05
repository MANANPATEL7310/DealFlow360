// apps/api/src/lib/money.ts
/**
 * Money helpers — always work in integer minor units (cents/paise) to avoid
 * floating-point rounding errors. These are the ONLY place currency math lives.
 *
 * Convention throughout DealFlow360:
 *   - DB stores minor units (e.g. basePrice: 120000 = $1,200.00)
 *   - API returns major units for display
 *   - All calculations happen in minor units
 */

/** Convert a major-unit amount to minor units.  12.34 → 1234 */
export const toMinor = (major: number): number => Math.round(major * 100);

/** Convert a minor-unit amount to major units.  1234 → 12.34 */
export const toMajor = (minor: number): number => minor / 100;

/**
 * Apply a percentage discount to a minor-unit amount.
 * 1000 minor @ 10% → 900 minor
 */
export const applyDiscount = (minor: number, pct: number): number =>
  Math.round(minor * (1 - pct / 100));
