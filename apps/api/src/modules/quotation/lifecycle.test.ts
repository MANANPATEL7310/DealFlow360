// apps/api/src/modules/quotation/lifecycle.test.ts
import type { QuotationStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { ALLOWED, assertTransition } from "./lifecycle.js";

describe("M5: Quotation Lifecycle State Machine", () => {
  it("allows every edge declared in ALLOWED", () => {
    for (const [from, tos] of Object.entries(ALLOWED)) {
      for (const to of tos) {
        expect(() =>
          assertTransition(from as QuotationStatus, to as QuotationStatus),
        ).not.toThrow();
      }
    }
  });

  it("rejects an undeclared edge with a 409", () => {
    expect.assertions(2);
    try {
      assertTransition("DRAFT", "PAID");
    } catch (e) {
      const err = e as Error & { http?: number };
      expect(err.message).toBe("ILLEGAL_TRANSITION");
      expect(err.http).toBe(409);
    }
  });

  it("treats PAID and REJECTED as terminal states", () => {
    expect(ALLOWED.PAID).toEqual([]);
    expect(ALLOWED.REJECTED).toEqual([]);
  });

  it("permits the negotiated re-confirm paths (PENDING_APPROVAL, CONFIRMED, APPROVED)", () => {
    expect(ALLOWED.UNDER_NEGOTIATION).toEqual(
      expect.arrayContaining(["PENDING_APPROVAL", "APPROVED", "CONFIRMED"]),
    );
  });
});
