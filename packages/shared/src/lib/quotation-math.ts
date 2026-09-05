import type {
  ApprovalChainRule,
  ApprovalLevel,
  CategoryDiscountCeiling,
  DiscountTierCeiling,
} from "../schemas/governance";
import type { CustomerTier } from "../schemas/product";
import type {
  LineRiskBreakdown,
  QuotationLine,
  QuotationRiskEvaluation,
} from "../schemas/quotation";

export interface ComputedTotalsResult {
  subtotalMinor: number;
  discountTotalMinor: number;
  taxTotalMinor: number;
  grandTotalMinor: number;
  marginPct: number;
}

/**
 * Single authority for computing monetary values across lines.
 * Strictly uses integer minor units (cents) to avoid floating-point drift.
 */
export function computeTotals(
  lines: Array<{
    qty: number;
    unitPriceMinor: number;
    unitCostMinor: number;
    discountPct: number;
    product?: { taxRatePct?: number };
  }>,
): ComputedTotalsResult {
  let subtotalMinor = 0;
  let discountTotalMinor = 0;
  let taxTotalMinor = 0;
  let netTotalMinor = 0;
  let costTotalMinor = 0;

  for (const line of lines) {
    const gross = line.qty * line.unitPriceMinor;
    const discount = Math.round(gross * (line.discountPct / 100));
    const net = gross - discount;
    const taxRate = line.product?.taxRatePct ?? 8.0; // standard 8% tax fallback
    const tax = Math.round(net * (taxRate / 100));
    const cost = line.qty * line.unitCostMinor;

    subtotalMinor += gross;
    discountTotalMinor += discount;
    taxTotalMinor += tax;
    netTotalMinor += net;
    costTotalMinor += cost;
  }

  const marginPct =
    netTotalMinor === 0
      ? 0
      : Math.round(((netTotalMinor - costTotalMinor) / netTotalMinor) * 10000) /
        100;

  return {
    subtotalMinor,
    discountTotalMinor,
    taxTotalMinor,
    grandTotalMinor: subtotalMinor - discountTotalMinor + taxTotalMinor,
    marginPct,
  };
}

/**
 * Evaluates line items against customer tier ceilings and product category caps.
 * Computes per-line compliance and overall deal blended risk score.
 */
export function evaluateQuotationRisk(
  lines: QuotationLine[],
  customerTier: CustomerTier,
  tiers: DiscountTierCeiling[],
  ceilings: CategoryDiscountCeiling[],
  rules: ApprovalChainRule[],
): QuotationRiskEvaluation {
  const tierConfig = tiers.find((t) => t.customerTier === customerTier);
  const tierCapPct = tierConfig?.maxDiscountPct ?? 10.0;

  const categoryMultiplier: Record<string, number> = {
    HARDWARE: 1.2,
    SERVICES: 0.9,
    SUBSCRIPTIONS: 1.0,
  };
  const tierTolerance: Record<CustomerTier, number> = {
    GOLD: 0.8,
    SILVER: 1.0,
    BRONZE: 1.2,
  };

  const lineBreakdowns: LineRiskBreakdown[] = lines.map((l) => {
    const cat = l.product?.category ?? "HARDWARE";
    const catCeiling = ceilings.find((c) => c.category === cat);
    const categoryCapPct = catCeiling?.maxDiscountPct ?? 15.0;

    const effectiveCeilingPct = Math.min(tierCapPct, categoryCapPct);
    const excessDiscountPct = Math.max(
      0,
      Number((l.discountPct - effectiveCeilingPct).toFixed(2)),
    );

    const mult =
      (categoryMultiplier[cat] ?? 1.0) * (tierTolerance[customerTier] ?? 1.0);
    const lineRiskScore =
      excessDiscountPct === 0
        ? 0
        : Number((excessDiscountPct * mult).toFixed(2));

    return {
      lineId: l.id,
      productTitle: l.product?.name ?? "Product",
      category: cat,
      qty: l.qty,
      unitPriceMinor: l.unitPriceMinor,
      appliedDiscountPct: l.discountPct,
      tierCapPct,
      categoryCapPct,
      effectiveCeilingPct,
      excessDiscountPct,
      lineRiskScore,
      isCompliant: excessDiscountPct === 0,
    };
  });

  // Calculate weighted blended risk score based on pre-discount line value
  let totalGross = 0;
  let weightedRisk = 0;

  for (const lb of lineBreakdowns) {
    const lineGross = lb.qty * lb.unitPriceMinor;
    totalGross += lineGross;
    weightedRisk += lineGross * lb.lineRiskScore;
  }

  const blendedRiskScore =
    totalGross === 0 ? 0 : Number((weightedRisk / totalGross).toFixed(2));

  // Match against approval chain rules
  if (blendedRiskScore === 0) {
    return {
      blendedRiskScore: 0,
      lines: lineBreakdowns,
      isAutoApproved: true,
      requiredLevels: [],
      matchedRuleName: "Auto-Approved (Within Ceilings)",
    };
  }

  const sortedRules = [...rules].sort((a, b) => a.minScore - b.minScore);
  const matchedRule = sortedRules.find((r) => {
    const passesMin = blendedRiskScore >= r.minScore;
    const passesMax =
      r.maxScore === null ||
      r.maxScore === undefined ||
      blendedRiskScore < r.maxScore;
    return passesMin && passesMax;
  });

  const requiredLevels: ApprovalLevel[] =
    matchedRule?.requiredLevels ?? ["SALES_MANAGER"];

  return {
    blendedRiskScore,
    lines: lineBreakdowns,
    isAutoApproved: false,
    requiredLevels,
    matchedRuleName: matchedRule?.name ?? "Standard Escalation Band",
  };
}
