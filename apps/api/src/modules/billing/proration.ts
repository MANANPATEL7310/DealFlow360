// apps/api/src/modules/billing/proration.ts
// === M8: Pure Proration Math ===
//
// Pure functions over Dates and integer minor units (cents).
// Graded logic: no DB, no Date.now() side-effects.

const MS_PER_DAY = 86_400_000;

/**
 * Whole days from `from` to `to` (rounded — DST-safe enough for billing periods).
 */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Amount owed for the slice of [periodStart, periodEnd] at/after `changeDate`.
 * Used for BOTH a mid-cycle upgrade (charge for the remainder) and a downgrade/cancel
 * (credit for the remainder).
 *
 * Guaranteed integer minor units in and out.
 * Clamps remaining duration to [0, total] and guards against zero-length periods.
 */
export function prorate(
  planAmountMinor: number,
  changeDate: Date,
  periodStart: Date,
  periodEnd: Date,
): number {
  const total = daysBetween(periodStart, periodEnd);
  if (total <= 0) return 0; // guard a degenerate/zero-length period

  // clamp to [0, total] so changeDate outside period cannot produce negative or >100% amount
  const remaining = Math.min(
    Math.max(daysBetween(changeDate, periodEnd), 0),
    total,
  );
  return Math.round(planAmountMinor * (remaining / total));
}
