import {
  evaluateQuotationRisk,
  computeTotals,
  SEED_QUOTATIONS,
  SEED_DISCOUNT_TIERS,
  SEED_CATEGORY_CEILINGS,
  SEED_APPROVAL_RULES,
  type CreateNegotiationInput,
  type NegotiationRequest,
  type PortalConfirmResult,
  type PortalQuotationLine,
  type PortalQuotationView,
  type Quotation,
} from "@template/shared";

// In-memory persistent state for portal operations (synced with seed quotations)
const quotationsStore: Map<string, Quotation> = new Map();
const negotiationsStore: Map<string, NegotiationRequest[]> = new Map();

// Initialize with SEED_QUOTATIONS
for (const q of SEED_QUOTATIONS) {
  quotationsStore.set(q.id, { ...q });
}

export const portalService = {
  getQuotation(quotationId: string): PortalQuotationView {
    const quote = quotationsStore.get(quotationId);
    if (!quote) {
      throw new Error("Quotation not found or invalid magic link.");
    }

    const negotiations = negotiationsStore.get(quotationId) ?? [];

    // Sanitize lines: strip unitCostMinor and lineMargin
    const lines: PortalQuotationLine[] = quote.lines.map((line) => {
      const lineGross = line.qty * line.unitPriceMinor;
      const lineTotal = Math.round(lineGross * (1 - line.discountPct / 100));

      return {
        id: line.id,
        productId: line.productId,
        productName: line.product?.name ?? "Enterprise Product",
        variantName: line.variant ? `${line.variant.attribute}: ${line.variant.value}` : null,
        qty: line.qty,
        unitPriceMinor: line.unitPriceMinor,
        discountPct: line.discountPct,
        lineTotalMinor: lineTotal,
        lineType: line.lineType,
      };
    });

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: quote.id,
      code: quote.quotationNumber,
      customerName: quote.customer?.name ?? "Client Account",
      customerTier: (quote.customer?.tier as "BRONZE" | "SILVER" | "GOLD") ?? "SILVER",
      contactName: "David Sterling",
      salesRepName: "Alex Miller",
      subtotalMinor: quote.subtotalMinor,
      discountTotalMinor: quote.discountTotalMinor,
      taxTotalMinor: quote.taxTotalMinor,
      grandTotalMinor: quote.grandTotalMinor,
      status: quote.status,
      lines,
      negotiations,
      expiresAt,
    };
  },

  markOpened(quotationId: string): { status: string } {
    const quote = quotationsStore.get(quotationId);
    if (!quote) {
      throw new Error("Quotation not found.");
    }

    if (quote.status === "SENT") {
      quote.status = "UNDER_NEGOTIATION";
      quotationsStore.set(quotationId, quote);
    }

    return { status: quote.status };
  },

  createNegotiation(
    quotationId: string,
    contactId: string,
    input: CreateNegotiationInput,
  ): NegotiationRequest {
    const quote = quotationsStore.get(quotationId);
    if (!quote) {
      throw new Error("Quotation not found.");
    }

    if (input.lineId) {
      const lineExists = quote.lines.some((l) => l.id === input.lineId);
      if (!lineExists) {
        throw new Error("Target line item not found on this quotation.");
      }
    }

    const newRequest: NegotiationRequest = {
      id: `neg-${Date.now()}`,
      quotationId,
      contactId,
      lineId: input.lineId ?? null,
      comment: input.comment?.trim() ?? null,
      counterDiscountPct: input.counterDiscountPct ?? null,
      status: "OPEN",
      repComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentList = negotiationsStore.get(quotationId) ?? [];
    currentList.push(newRequest);
    negotiationsStore.set(quotationId, currentList);

    // Keep quotation status aligned
    if (quote.status === "SENT") {
      quote.status = "UNDER_NEGOTIATION";
      quotationsStore.set(quotationId, quote);
    }

    return newRequest;
  },

  confirmQuotation(quotationId: string): PortalConfirmResult {
    const quote = quotationsStore.get(quotationId);
    if (!quote) {
      throw new Error("Quotation not found.");
    }

    const negotiations = negotiationsStore.get(quotationId) ?? [];
    const acceptedCounters = negotiations.filter((n) => n.status === "ACCEPTED");

    // Apply any accepted counter discounts to quotation lines
    const updatedLines = quote.lines.map((line) => {
      const lineCounter = acceptedCounters.find((c) => c.lineId === line.id);
      const orderCounter = acceptedCounters.find((c) => !c.lineId);

      let effectiveDiscount = line.discountPct;
      if (lineCounter?.counterDiscountPct !== undefined && lineCounter.counterDiscountPct !== null) {
        effectiveDiscount = lineCounter.counterDiscountPct;
      } else if (orderCounter?.counterDiscountPct !== undefined && orderCounter.counterDiscountPct !== null) {
        effectiveDiscount = orderCounter.counterDiscountPct;
      }

      return {
        ...line,
        discountPct: effectiveDiscount,
      };
    });

    // Recalculate totals
    const totals = computeTotals(updatedLines);

    // Run PS §10 Blended Risk Engine
    const customerTier = (quote.customer?.tier as "BRONZE" | "SILVER" | "GOLD") ?? "SILVER";
    const riskEvaluation = evaluateQuotationRisk(
      updatedLines,
      customerTier,
      SEED_DISCOUNT_TIERS,
      SEED_CATEGORY_CEILINGS,
      SEED_APPROVAL_RULES,
    );

    quote.lines = updatedLines;
    quote.subtotalMinor = totals.subtotalMinor;
    quote.discountTotalMinor = totals.discountTotalMinor;
    quote.taxTotalMinor = totals.taxTotalMinor;
    quote.grandTotalMinor = totals.grandTotalMinor;
    quote.marginPct = totals.marginPct;
    quote.blendedRiskScore = riskEvaluation.blendedRiskScore;

    // The Governance Gate:
    // If approval is required (not auto-approved), bounce to PENDING_APPROVAL
    if (!riskEvaluation.isAutoApproved || riskEvaluation.requiredLevels.length > 0) {
      quote.status = "PENDING_APPROVAL";
      quotationsStore.set(quotationId, quote);

      return {
        status: "PENDING_APPROVAL",
        message:
          "Your accepted proposal terms exceed standard tier discount baselines and have been submitted to Sales Leadership for expedited authorization.",
        requiresApproval: true,
        requiredLevels: riskEvaluation.requiredLevels,
      };
    }

    // Within standard governance ceiling: Confirm directly
    quote.status = "CONFIRMED";
    quotationsStore.set(quotationId, quote);

    return {
      status: "CONFIRMED",
      message: "Quotation officially confirmed and booked. Invoicing and order fulfillment have been initialized.",
      requiresApproval: false,
      requiredLevels: [],
    };
  },

  // ─── Internal Sales Rep Actions ───────────────────────────────────────────
  getNegotiations(quotationId: string): NegotiationRequest[] {
    return negotiationsStore.get(quotationId) ?? [];
  },

  answerNegotiation(
    quotationId: string,
    negotiationId: string,
    status: "ACCEPTED" | "ANSWERED",
    repComment?: string,
  ): NegotiationRequest {
    const list = negotiationsStore.get(quotationId) ?? [];
    const item = list.find((n) => n.id === negotiationId);

    if (!item) {
      throw new Error("Negotiation request not found.");
    }

    item.status = status;
    item.repComment = repComment?.trim() ?? null;
    item.updatedAt = new Date().toISOString();

    negotiationsStore.set(quotationId, list);
    return item;
  },

  sendQuotation(quotationId: string): { token: string; magicLink: string; quotation: Quotation } {
    const quote = quotationsStore.get(quotationId);
    if (!quote) {
      throw new Error("Quotation not found.");
    }

    quote.status = "SENT";
    quotationsStore.set(quotationId, quote);

    // Mint portal token for the customer's primary contact
    const contactId = quote.customer?.contacts?.[0]?.id ?? "cst-contact-01";
    const token = Buffer.from(
      JSON.stringify({ quotationId, contactId, exp: Date.now() + 14 * 86400000 }),
    ).toString("base64url");

    return {
      token,
      magicLink: `/portal?token=${token}`,
      quotation: quote,
    };
  },
};
