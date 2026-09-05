// apps/api/src/modules/portal/portal.test.ts
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { env } from "../../config/env.js";
import { assertTransition } from "../quotation/lifecycle.js";
import { scopedSummary } from "./portal.service.js";
import {
  PORTAL_AUD,
  mintPortalToken,
  verifyPortalToken,
} from "./portal.token.js";
import {
  answerNegotiationSchema,
  sendQuotationSchema,
  submitNegotiationSchema,
} from "@template/shared";

describe("M9 — Customer Portal & Live Negotiation", () => {
  describe("Portal Token Security (mint & verify)", () => {
    it("mints a valid portal JWT with audience and expected claims", () => {
      const claims = {
        quotationId: "quote-123",
        contactId: "contact-456",
      };
      const token = mintPortalToken(claims);
      expect(typeof token).toBe("string");

      const decoded = verifyPortalToken(token);
      expect(decoded.quotationId).toBe("quote-123");
      expect(decoded.contactId).toBe("contact-456");
    });

    it("rejects tokens signed with internal JWT_SECRET (cross-token defense)", () => {
      const internalToken = jwt.sign(
        { quotationId: "quote-123", contactId: "contact-456" },
        env.JWT_SECRET,
        { audience: PORTAL_AUD },
      );

      expect(() => verifyPortalToken(internalToken)).toThrow();
    });

    it("rejects tokens with incorrect audience", () => {
      const badAudToken = jwt.sign(
        { quotationId: "quote-123", contactId: "contact-456" },
        env.PORTAL_JWT_SECRET,
        { audience: "dealflow-internal" },
      );

      expect(() => verifyPortalToken(badAudToken)).toThrow();
    });

    it("rejects expired portal tokens", () => {
      const expiredToken = jwt.sign(
        { quotationId: "quote-123", contactId: "contact-456" },
        env.PORTAL_JWT_SECRET,
        { audience: PORTAL_AUD, expiresIn: -10 },
      );

      expect(() => verifyPortalToken(expiredToken)).toThrow();
    });
  });

  describe("Safe Read Projection (scopedSummary)", () => {
    it("strips internal unitCostMinor, marginPct, and sensitive metadata", () => {
      const mockQuotation = {
        id: "q-100",
        status: "UNDER_NEGOTIATION",
        salesRepId: "rep-1",
        marginPct: 42.5, // Sensitive!
        subtotalMinor: 100000,
        discountTotalMinor: 10000,
        taxTotalMinor: 5000,
        grandTotalMinor: 95000,
        customer: {
          name: "Acme Corp",
          currency: "USD",
        },
        lines: [
          {
            id: "line-1",
            qty: 2,
            unitPriceMinor: 50000,
            unitCostMinor: 25000, // Sensitive!
            discountPct: 10,
            lineType: "ONE_OFF",
            product: {
              id: "prod-1",
              name: "Enterprise Laptop",
              unitCost: 25000, // Sensitive!
            },
          },
        ],
        negotiations: [
          {
            id: "neg-1",
            lineId: "line-1",
            comment: "Can you offer 15%?",
            counterDiscountPct: 15,
            status: "OPEN",
            createdAt: new Date(),
          },
        ],
      };

      const summary = scopedSummary(mockQuotation);

      // Customer view attributes
      expect(summary.id).toBe("q-100");
      expect(summary.status).toBe("UNDER_NEGOTIATION");
      expect(summary.customerName).toBe("Acme Corp");
      expect(summary.currency).toBe("USD");
      expect(summary.subtotalMinor).toBe(100000);
      expect(summary.discountTotalMinor).toBe(10000);
      expect(summary.grandTotalMinor).toBe(95000);

      // Verify marginPct is stripped
      expect((summary as Record<string, unknown>).marginPct).toBeUndefined();
      expect((summary as Record<string, unknown>).salesRepId).toBeUndefined();

      // Verify line items do NOT leak unitCostMinor or product internal cost
      expect(summary.lines[0]).toEqual({
        id: "line-1",
        name: "Enterprise Laptop",
        qty: 2,
        unitPriceMinor: 50000,
        discountPct: 10,
        lineType: "ONE_OFF",
      });
      expect(
        (summary.lines[0] as unknown as Record<string, unknown>).unitCostMinor,
      ).toBeUndefined();
      expect(
        (summary.lines[0] as unknown as Record<string, unknown>).product,
      ).toBeUndefined();
    });
  });

  describe("Lifecycle Transitions for M9 Portal Flow", () => {
    it("allows transition from APPROVED to SENT (send to customer)", () => {
      expect(() => assertTransition("APPROVED", "SENT")).not.toThrow();
    });

    it("allows transition from SENT to UNDER_NEGOTIATION (customer opens portal)", () => {
      expect(() => assertTransition("SENT", "UNDER_NEGOTIATION")).not.toThrow();
    });

    it("allows transition from UNDER_NEGOTIATION to CONFIRMED (safe confirmation)", () => {
      expect(() =>
        assertTransition("UNDER_NEGOTIATION", "CONFIRMED"),
      ).not.toThrow();
    });

    it("allows transition from UNDER_NEGOTIATION to PENDING_APPROVAL (governance gate escalation)", () => {
      expect(() =>
        assertTransition("UNDER_NEGOTIATION", "PENDING_APPROVAL"),
      ).not.toThrow();
    });

    it("rejects illegal transitions such as SENT directly to PENDING_APPROVAL", () => {
      expect(() => assertTransition("SENT", "PENDING_APPROVAL")).toThrowError(
        /ILLEGAL_TRANSITION/,
      );
    });
  });

  describe("Validation Schemas Contract", () => {
    it("validates sendQuotationSchema requires a contactId", () => {
      expect(() =>
        sendQuotationSchema.parse({ contactId: "c-1" }),
      ).not.toThrow();
      expect(() => sendQuotationSchema.parse({})).toThrow();
    });

    it("validates submitNegotiationSchema requires either comment or counterDiscountPct", () => {
      expect(() =>
        submitNegotiationSchema.parse({ comment: "Discount please" }),
      ).not.toThrow();
      expect(() =>
        submitNegotiationSchema.parse({ counterDiscountPct: 12 }),
      ).not.toThrow();
      expect(() =>
        submitNegotiationSchema.parse({
          lineId: "l-1",
          counterDiscountPct: 15,
          comment: "Special pricing",
        }),
      ).not.toThrow();
      expect(() => submitNegotiationSchema.parse({})).toThrow();
    });

    it("rejects negative or over 100% discount in submitNegotiationSchema", () => {
      expect(() =>
        submitNegotiationSchema.parse({ counterDiscountPct: -5 }),
      ).toThrow();
      expect(() =>
        submitNegotiationSchema.parse({ counterDiscountPct: 105 }),
      ).toThrow();
    });

    it("validates answerNegotiationSchema only accepts ANSWERED or ACCEPTED", () => {
      expect(() =>
        answerNegotiationSchema.parse({ status: "ANSWERED" }),
      ).not.toThrow();
      expect(() =>
        answerNegotiationSchema.parse({ status: "ACCEPTED" }),
      ).not.toThrow();
      expect(() =>
        answerNegotiationSchema.parse({ status: "REJECTED" }),
      ).toThrow();
    });
  });
});
