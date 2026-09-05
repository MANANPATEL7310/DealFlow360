// apps/api/src/lib/margin.ts
/**
 * Margin helpers — exact weighted margin calculation per PS §7.
 * All inputs are in minor units (integer). Results are percentages (0–100).
 *
 * Used by: M5 (quotation totals), M6 (upsell margin delta), M8 (billing).
 * Never calculate margin inline — always use these.
 */

/**
 * Per-line margin percentage.
 * lineMargin% = (netPrice - unitCost) / netPrice × 100
 */
export function lineMarginPct(
  netUnitMinor: number,
  unitCostMinor: number,
): number {
  if (netUnitMinor <= 0) return 0;
  return ((netUnitMinor - unitCostMinor) / netUnitMinor) * 100;
}

/**
 * Basket-level (order) margin percentage — weighted by net revenue.
 * orderMargin% = (totalNet - totalCost) / totalNet × 100
 */
export function orderMarginPct(
  lines: { netMinor: number; costMinor: number }[],
): number {
  const net = lines.reduce((s, l) => s + l.netMinor, 0);
  const cost = lines.reduce((s, l) => s + l.costMinor, 0);
  return net <= 0 ? 0 : ((net - cost) / net) * 100;
}
