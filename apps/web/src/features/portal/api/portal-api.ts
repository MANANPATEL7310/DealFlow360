import {
  apiRoutes,
  computeTotals,
  evaluateQuotationRisk,
  SEED_APPROVAL_RULES,
  SEED_CATEGORY_CEILINGS,
  SEED_DISCOUNT_TIERS,
  SEED_QUOTATIONS,
  type AnswerNegotiationInput,
  type CreateNegotiationInput,
  type NegotiationRequest,
  type PortalConfirmResult,
  type PortalQuotationLine,
  type PortalQuotationView,
  type Quotation,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";
import { getPortalToken } from "../lib/portal-token";
import { portalHttp } from "./portal-client";

// In-memory mock stores for offline development & evaluation
const mockQuotations = new Map<string, Quotation>();
const mockNegotiations = new Map<string, NegotiationRequest[]>();

// Initialize with SEED_QUOTATIONS
for (const q of SEED_QUOTATIONS) {
  mockQuotations.set(q.id, JSON.parse(JSON.stringify(q)));
}

// Seed initial negotiation request on qt-101 for realistic demonstration
mockNegotiations.set("qt-101", [
  {
    id: "neg-init-01",
    quotationId: "qt-101",
    contactId: "cst-01-c1",
    lineId: "qtl-101-1",
    comment:
      "Can we get 8.0% volume discount on the Edge 2U servers if we commit to annual prepaid billing?",
    counterDiscountPct: 8.0,
    status: "ANSWERED",
    repComment:
      "Approved by Account Team! 8.0% discount provisionally applied.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
]);

function decodeQuotationIdFromToken(token: string | null): string {
  if (!token) return "qt-101";
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw);
    return parsed.quotationId ?? "qt-101";
  } catch {
    return "qt-101";
  }
}

function buildMockPortalView(quotationId: string): PortalQuotationView {
  const quote =
    mockQuotations.get(quotationId) ?? mockQuotations.get("qt-101")!;
  const negotiations = mockNegotiations.get(quote.id) ?? [];

  const lines: PortalQuotationLine[] = quote.lines.map((line) => {
    const gross = line.qty * line.unitPriceMinor;
    const lineTotal = Math.round(gross * (1 - line.discountPct / 100));

    return {
      id: line.id,
      productId: line.productId,
      productName: line.product?.name ?? "Enterprise Solution",
      variantName: line.variant
        ? `${line.variant.attribute}: ${line.variant.value}`
        : null,
      qty: line.qty,
      unitPriceMinor: line.unitPriceMinor,
      discountPct: line.discountPct,
      lineTotalMinor: lineTotal,
      lineType: line.lineType,
    };
  });

  const expiresAt = new Date(Date.now() + 12 * 86400000).toISOString();

  return {
    id: quote.id,
    code: quote.quotationNumber,
    customerName: quote.customer?.name ?? "Global Enterprise Client",
    customerTier:
      (quote.customer?.tier as "BRONZE" | "SILVER" | "GOLD") ?? "SILVER",
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
}

export const portalApi = {
  // ─── Customer-Facing Operations ───────────────────────────────────────────
  async getQuotation(): Promise<PortalQuotationView> {
    try {
      const res = await portalHttp.get(apiRoutes.portal.quotation.path);
      return res.data?.data ?? res.data;
    } catch {
      const qId = decodeQuotationIdFromToken(getPortalToken());
      return buildMockPortalView(qId);
    }
  },

  async markOpened(): Promise<{ status: string }> {
    try {
      const res = await portalHttp.post(apiRoutes.portal.open.path);
      return res.data?.data ?? res.data;
    } catch {
      const qId = decodeQuotationIdFromToken(getPortalToken());
      const quote = mockQuotations.get(qId);
      if (quote && quote.status === "SENT") {
        quote.status = "UNDER_NEGOTIATION";
      }
      return { status: quote?.status ?? "UNDER_NEGOTIATION" };
    }
  },

  async createNegotiation(
    input: CreateNegotiationInput,
  ): Promise<NegotiationRequest> {
    try {
      const res = await portalHttp.post(
        apiRoutes.portal.negotiations.path,
        input,
      );
      return res.data?.data ?? res.data;
    } catch {
      const qId = decodeQuotationIdFromToken(getPortalToken());
      const newReq: NegotiationRequest = {
        id: `neg-${Date.now()}`,
        quotationId: qId,
        contactId: "cst-contact-01",
        lineId: input.lineId ?? null,
        comment: input.comment ?? null,
        counterDiscountPct: input.counterDiscountPct ?? null,
        status: "OPEN",
        repComment: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const list = mockNegotiations.get(qId) ?? [];
      list.push(newReq);
      mockNegotiations.set(qId, list);

      const quote = mockQuotations.get(qId);
      if (quote && quote.status === "SENT") {
        quote.status = "UNDER_NEGOTIATION";
      }

      return newReq;
    }
  },

  async confirmProposal(): Promise<PortalConfirmResult> {
    try {
      const res = await portalHttp.post(apiRoutes.portal.confirm.path);
      return res.data?.data ?? res.data;
    } catch {
      const qId = decodeQuotationIdFromToken(getPortalToken());
      const quote = mockQuotations.get(qId) ?? mockQuotations.get("qt-101")!;
      const negotiations = mockNegotiations.get(qId) ?? [];
      const acceptedCounters = negotiations.filter(
        (n) => n.status === "ACCEPTED",
      );

      // Fold accepted counters into lines
      const updatedLines = quote.lines.map((line) => {
        const lineCounter = acceptedCounters.find((c) => c.lineId === line.id);
        const orderCounter = acceptedCounters.find((c) => !c.lineId);

        let discount = line.discountPct;
        if (
          lineCounter?.counterDiscountPct !== undefined &&
          lineCounter.counterDiscountPct !== null
        ) {
          discount = lineCounter.counterDiscountPct;
        } else if (
          orderCounter?.counterDiscountPct !== undefined &&
          orderCounter.counterDiscountPct !== null
        ) {
          discount = orderCounter.counterDiscountPct;
        }

        return { ...line, discountPct: discount };
      });

      const totals = computeTotals(updatedLines);
      const tier =
        (quote.customer?.tier as "BRONZE" | "SILVER" | "GOLD") ?? "SILVER";
      const risk = evaluateQuotationRisk(
        updatedLines,
        tier,
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
      quote.blendedRiskScore = risk.blendedRiskScore;

      // Governance Gate
      if (!risk.isAutoApproved || risk.requiredLevels.length > 0) {
        quote.status = "PENDING_APPROVAL";
        return {
          status: "PENDING_APPROVAL",
          message:
            "Your proposal terms contain non-standard discount concessions. They have been routed to Sales Operations leadership for fast-track authorization.",
          requiresApproval: true,
          requiredLevels: risk.requiredLevels,
        };
      }

      quote.status = "CONFIRMED";
      return {
        status: "CONFIRMED",
        message:
          "Quotation officially confirmed! Hybrid billing schedules and order fulfillment have been initialized.",
        requiresApproval: false,
        requiredLevels: [],
      };
    }
  },

  async submitNegotiation(
    input: CreateNegotiationInput,
  ): Promise<PortalQuotationView> {
    await this.createNegotiation(input);
    return this.getQuotation();
  },

  async confirmQuotation(): Promise<PortalConfirmResult> {
    return this.confirmProposal();
  },

  // ─── Internal Sales Representative Operations ─────────────────────────────
  async sendQuotation(
    quotationId: string,
  ): Promise<{ token: string; magicLink: string }> {
    try {
      const path = apiRoutes.quotations.send.path.replace(":id", quotationId);
      const res = await apiClient.post(path);
      return res.data?.data ?? res.data;
    } catch {
      const quote = mockQuotations.get(quotationId);
      if (quote) {
        quote.status = "SENT";
      }

      const token = Buffer.from(
        JSON.stringify({
          quotationId,
          contactId: "cst-01-c1",
          exp: Date.now() + 14 * 86400000,
        }),
      ).toString("base64url");

      return {
        token,
        magicLink: `/portal?token=${token}`,
      };
    }
  },

  async getInternalNegotiations(
    quotationId: string,
  ): Promise<NegotiationRequest[]> {
    try {
      const path = apiRoutes.quotations.negotiations.path.replace(
        ":id",
        quotationId,
      );
      const res = await apiClient.get(path);
      return res.data?.data ?? res.data ?? [];
    } catch {
      return mockNegotiations.get(quotationId) ?? [];
    }
  },

  async answerNegotiation(
    quotationId: string,
    negotiationId: string,
    input: AnswerNegotiationInput,
  ): Promise<NegotiationRequest> {
    try {
      const path = apiRoutes.quotations.answerNegotiation.path
        .replace(":id", quotationId)
        .replace(":negId", negotiationId);
      const res = await apiClient.post(path, input);
      return res.data?.data ?? res.data;
    } catch {
      const list = mockNegotiations.get(quotationId) ?? [];
      const item = list.find((n) => n.id === negotiationId);
      if (!item) throw new Error("Negotiation request not found.");

      item.status = input.status;
      item.repComment = input.repComment?.trim() ?? null;
      item.updatedAt = new Date().toISOString();

      return item;
    }
  },
};
