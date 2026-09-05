import {
  type AddLineInput,
  apiRoutes,
  type ApprovalDecision,
  type ApprovalDecisionInput,
  computeTotals,
  type CreateQuotationInput,
  evaluateQuotationRisk,
  type Quotation,
  type QuotationApprovalStep,
  type QuotationLine,
  type QuotationRiskEvaluation,
  type QuotationStatusEvent,
  SEED_APPROVAL_RULES,
  SEED_CATEGORY_CEILINGS,
  SEED_CUSTOMERS,
  SEED_DISCOUNT_TIERS,
  SEED_PRODUCTS,
  SEED_QUOTATIONS,
  type UpdateLineInput,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

// In-memory mock store for offline dev/eval
let localQuotations: Quotation[] = [...SEED_QUOTATIONS];

export interface QuotationFilterParams {
  status?: string;
  query?: string;
}

export const quotationsApi = {
  // ─── List & Get ────────────────────────────────────────────────────────────
  async getQuotations(params?: QuotationFilterParams): Promise<Quotation[]> {
    try {
      const { data } = await apiClient.get(apiRoutes.quotations.list.path, {
        params,
      });
      return data.data;
    } catch {
      let results = [...localQuotations];

      if (params?.status && params.status !== "ALL") {
        results = results.filter((q) => q.status === params.status);
      }

      if (params?.query && params.query.trim().length > 0) {
        const q = params.query.toLowerCase().trim();
        results = results.filter(
          (quote) =>
            quote.quotationNumber.toLowerCase().includes(q) ||
            quote.customer?.name.toLowerCase().includes(q),
        );
      }

      return results.sort((a, b) => {
        const tA = new Date(a.createdAt ?? 0).getTime();
        const tB = new Date(b.createdAt ?? 0).getTime();
        return tB - tA;
      });
    }
  },

  async getQuotationById(id: string): Promise<Quotation | null> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.quotations.getById.path.replace(":id", id),
      );
      return data.data;
    } catch {
      return localQuotations.find((q) => q.id === id) ?? null;
    }
  },

  // ─── Create Quotation ──────────────────────────────────────────────────────
  async createQuotation(input: CreateQuotationInput): Promise<Quotation> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.quotations.create.path,
        input,
      );
      return data.data;
    } catch {
      const customer = SEED_CUSTOMERS.find((c) => c.id === input.customerId);
      const nextNum = (localQuotations.length + 1).toString().padStart(3, "0");
      const newQuote: Quotation = {
        id: `qt-${Date.now()}`,
        quotationNumber: `QT-2026-${nextNum}`,
        customerId: input.customerId,
        customer,
        salesRepId: "usr-sales-01",
        status: "DRAFT",
        blendedRiskScore: 0.0,
        subtotalMinor: 0,
        discountTotalMinor: 0,
        taxTotalMinor: 0,
        grandTotalMinor: 0,
        marginPct: 0.0,
        lastActivityAt: new Date().toISOString(),
        lines: [],
        statusEvents: [
          {
            id: `qte-${Date.now()}`,
            quotationId: `qt-${Date.now()}`,
            fromStatus: "DRAFT",
            toStatus: "DRAFT",
            actorId: "usr-sales-01",
            reason: "Draft initialized",
            createdAt: new Date().toISOString(),
          },
        ],
        approvals: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localQuotations = [newQuote, ...localQuotations];
      return newQuote;
    }
  },

  // ─── Line Items Management ─────────────────────────────────────────────────
  async addLine(
    quotationId: string,
    input: AddLineInput,
  ): Promise<QuotationLine> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.quotations.addLine.path.replace(":id", quotationId),
        input,
      );
      return data.data;
    } catch {
      const quoteIndex = localQuotations.findIndex((q) => q.id === quotationId);
      const quote = localQuotations[quoteIndex];
      if (quoteIndex < 0 || !quote) {
        throw new Error("Quotation not found");
      }

      const product = SEED_PRODUCTS.find((p) => p.id === input.productId);
      if (!product) throw new Error("Product not found");

      const variant = input.variantId
        ? product.variants.find((v) => v.id === input.variantId) ?? null
        : null;

      const basePrice = product.basePrice + (variant?.extraPrice ?? 0);
      const unitCost = product.unitCost;

      const newLine: QuotationLine = {
        id: `qtl-${Date.now()}`,
        quotationId,
        productId: input.productId,
        product,
        variantId: input.variantId ?? null,
        variant,
        qty: input.qty,
        unitPriceMinor: basePrice,
        unitCostMinor: unitCost,
        discountPct: input.discountPct,
        lineType: input.lineType,
        subscriptionPlanId: input.subscriptionPlanId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedLines = [...quote.lines, newLine];
      const totals = computeTotals(updatedLines);

      // Re-evaluate risk
      const customerTier = quote.customer?.tier ?? "BRONZE";
      const risk = evaluateQuotationRisk(
        updatedLines,
        customerTier,
        SEED_DISCOUNT_TIERS,
        SEED_CATEGORY_CEILINGS,
        SEED_APPROVAL_RULES,
      );

      localQuotations[quoteIndex] = {
        ...quote,
        lines: updatedLines,
        ...totals,
        blendedRiskScore: risk.blendedRiskScore,
        lastActivityAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return newLine;
    }
  },

  async updateLine(
    quotationId: string,
    lineId: string,
    input: UpdateLineInput,
  ): Promise<QuotationLine> {
    try {
      const { data } = await apiClient.patch(
        apiRoutes.quotations.updateLine.path
          .replace(":id", quotationId)
          .replace(":lineId", lineId),
        input,
      );
      return data.data;
    } catch {
      const quoteIndex = localQuotations.findIndex((q) => q.id === quotationId);
      const quote = localQuotations[quoteIndex];
      if (quoteIndex < 0 || !quote) {
        throw new Error("Quotation not found");
      }

      const lineIndex = quote.lines.findIndex((l) => l.id === lineId);
      const existingLine = quote.lines[lineIndex];
      if (lineIndex < 0 || !existingLine) {
        throw new Error("Quotation line not found");
      }

      const updatedLine: QuotationLine = {
        ...existingLine,
        qty: input.qty !== undefined ? input.qty : existingLine.qty,
        discountPct:
          input.discountPct !== undefined
            ? input.discountPct
            : existingLine.discountPct,
        updatedAt: new Date().toISOString(),
      };

      const updatedLines = [...quote.lines];
      updatedLines[lineIndex] = updatedLine;

      const totals = computeTotals(updatedLines);
      const customerTier = quote.customer?.tier ?? "BRONZE";
      const risk = evaluateQuotationRisk(
        updatedLines,
        customerTier,
        SEED_DISCOUNT_TIERS,
        SEED_CATEGORY_CEILINGS,
        SEED_APPROVAL_RULES,
      );

      localQuotations[quoteIndex] = {
        ...quote,
        lines: updatedLines,
        ...totals,
        blendedRiskScore: risk.blendedRiskScore,
        lastActivityAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return updatedLine;
    }
  },

  async deleteLine(quotationId: string, lineId: string): Promise<void> {
    try {
      await apiClient.delete(
        apiRoutes.quotations.removeLine.path
          .replace(":id", quotationId)
          .replace(":lineId", lineId),
      );
    } catch {
      const quoteIndex = localQuotations.findIndex((q) => q.id === quotationId);
      const quote = localQuotations[quoteIndex];
      if (quoteIndex < 0 || !quote) return;

      const updatedLines = quote.lines.filter((l) => l.id !== lineId);
      const totals = computeTotals(updatedLines);
      const customerTier = quote.customer?.tier ?? "BRONZE";
      const risk = evaluateQuotationRisk(
        updatedLines,
        customerTier,
        SEED_DISCOUNT_TIERS,
        SEED_CATEGORY_CEILINGS,
        SEED_APPROVAL_RULES,
      );

      localQuotations[quoteIndex] = {
        ...quote,
        lines: updatedLines,
        ...totals,
        blendedRiskScore: risk.blendedRiskScore,
        lastActivityAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  // ─── Risk & Confirmation ───────────────────────────────────────────────────
  async getQuotationRisk(id: string): Promise<QuotationRiskEvaluation> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.quotations.risk.path.replace(":id", id),
      );
      return data.data;
    } catch {
      const quote = localQuotations.find((q) => q.id === id);
      if (!quote) throw new Error("Quotation not found");

      return evaluateQuotationRisk(
        quote.lines,
        quote.customer?.tier ?? "BRONZE",
        SEED_DISCOUNT_TIERS,
        SEED_CATEGORY_CEILINGS,
        SEED_APPROVAL_RULES,
      );
    }
  },

  async confirmQuotation(id: string): Promise<{
    quotation: Quotation;
    risk: QuotationRiskEvaluation;
    status: string;
    message: string;
  }> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.quotations.confirm.path.replace(":id", id),
      );
      return data.data;
    } catch {
      const quoteIndex = localQuotations.findIndex((q) => q.id === id);
      const quote = localQuotations[quoteIndex];
      if (quoteIndex < 0 || !quote) {
        throw new Error("Quotation not found");
      }

      if (quote.lines.length === 0) {
        throw new Error("Cannot confirm quotation with 0 line items.");
      }

      const risk = evaluateQuotationRisk(
        quote.lines,
        quote.customer?.tier ?? "BRONZE",
        SEED_DISCOUNT_TIERS,
        SEED_CATEGORY_CEILINGS,
        SEED_APPROVAL_RULES,
      );

      const targetStatus = risk.isAutoApproved ? "APPROVED" : "PENDING_APPROVAL";

      const newEvent: QuotationStatusEvent = {
        id: `qte-${Date.now()}`,
        quotationId: id,
        fromStatus: quote.status,
        toStatus: targetStatus,
        actorId: "usr-sales-01",
        reason: risk.isAutoApproved
          ? "Auto-approved — all line discounts within governance ceilings"
          : `Escalated to approval chain: ${risk.requiredLevels.join(" → ")}`,
        createdAt: new Date().toISOString(),
      };

      const newApprovals: QuotationApprovalStep[] = risk.isAutoApproved
        ? []
        : risk.requiredLevels.map((level, idx) => ({
            id: `qta-${Date.now()}-${idx}`,
            quotationId: id,
            level,
            sequence: idx + 1,
            decision: "PENDING",
            createdAt: new Date().toISOString(),
          }));

      const updatedQuote: Quotation = {
        ...quote,
        status: targetStatus,
        blendedRiskScore: risk.blendedRiskScore,
        statusEvents: [...quote.statusEvents, newEvent],
        approvals: newApprovals,
        lastActivityAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localQuotations[quoteIndex] = updatedQuote;

      return {
        quotation: updatedQuote,
        risk,
        status: targetStatus,
        message: risk.isAutoApproved
          ? "Quotation auto-approved within governance policy!"
          : `Quotation escalated to ${risk.requiredLevels.join(" and ")}.`,
      };
    }
  },

  async decideApproval(
    quotationId: string,
    input: ApprovalDecisionInput,
    actor: { id: string; role: string; name?: string },
  ): Promise<{
    quotation: Quotation;
    message: string;
    decision: ApprovalDecision;
  }> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.approvals.decision.path.replace(":id", quotationId),
        input,
      );
      return data.data;
    } catch {
      const quoteIndex = localQuotations.findIndex((q) => q.id === quotationId);
      const quote = localQuotations[quoteIndex];
      if (quoteIndex < 0 || !quote) {
        throw new Error("Quotation not found");
      }

      const pendingStepIndex = quote.approvals.findIndex(
        (s) => s.decision === "PENDING",
      );
      const pendingStep = quote.approvals[pendingStepIndex];
      if (pendingStepIndex < 0 || !pendingStep) {
        throw new Error("No pending approval steps found for this quotation.");
      }

      // Update current step
      const updatedSteps = [...quote.approvals];
      updatedSteps[pendingStepIndex] = {
        ...pendingStep,
        decision: input.decision,
        reason: input.reason,
        approverId: actor.id,
        decidedAt: new Date().toISOString(),
      };

      let targetStatus = quote.status;
      let transitionReason = "";

      if (input.decision === "REJECTED") {
        targetStatus = "REJECTED";
        transitionReason = `Rejected by ${pendingStep.level}: ${input.reason}`;
      } else if (input.decision === "RETURNED") {
        targetStatus = "DRAFT";
        transitionReason = `Returned to sales rep by ${pendingStep.level}: ${input.reason}`;
      } else if (input.decision === "APPROVED") {
        // Check if subsequent pending steps exist
        const hasSubsequentSteps = updatedSteps.some(
          (s) => s.sequence > pendingStep.sequence && s.decision === "PENDING",
        );

        if (hasSubsequentSteps) {
          targetStatus = "PENDING_APPROVAL";
          transitionReason = `Tier ${pendingStep.sequence} approved by ${pendingStep.level}. Escalated to next review authority.`;
        } else {
          targetStatus = "APPROVED";
          transitionReason = `Final policy approval granted by ${pendingStep.level}: ${input.reason}. Ready for customer issuance.`;
        }
      }

      const newEvent: QuotationStatusEvent = {
        id: `qte-${Date.now()}`,
        quotationId,
        fromStatus: quote.status,
        toStatus: targetStatus,
        actorId: actor.id,
        reason: transitionReason,
        createdAt: new Date().toISOString(),
      };

      const updatedQuote: Quotation = {
        ...quote,
        status: targetStatus,
        approvals: updatedSteps,
        statusEvents: [...quote.statusEvents, newEvent],
        lastActivityAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localQuotations[quoteIndex] = updatedQuote;

      return {
        quotation: updatedQuote,
        decision: input.decision,
        message:
          input.decision === "APPROVED"
            ? targetStatus === "APPROVED"
              ? "Quotation fully approved! Ready to send to customer."
              : "Approval recorded. Escalated to next review level."
            : input.decision === "RETURNED"
              ? "Quotation returned to sales rep draft for revisions."
              : "Quotation rejected.",
      };
    }
  },
};
