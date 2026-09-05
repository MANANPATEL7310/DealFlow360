import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  assertCanDecide,
  listApprovals,
  decideApproval,
  applyProposedAction,
} from "./approvals.service.js";
import { db } from "../../../lib/db.js";
import { writeAudit } from "../../../lib/audit.js";
import { closeRun } from "../../../ai/observability.js";
import { recomputeTotals } from "../../quotation/quotation.service.js";

vi.mock("../../../lib/db.js", () => ({
  db: {
    approvalRequest: {
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    quotationLine: {
      update: vi.fn(),
    },
    creditNote: {
      create: vi.fn(),
    },
    billingSchedule: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../../../lib/audit.js", () => ({
  writeAudit: vi.fn(async () => undefined),
}));

vi.mock("../../../ai/observability.js", () => ({
  closeRun: vi.fn(async () => undefined),
}));

vi.mock("../../quotation/quotation.service.js", () => ({
  recomputeTotals: vi.fn(async () => undefined),
}));

describe("HITL Approval Queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("assertCanDecide role scoping", () => {
    it("allows sales_manager, finance, and admin to decide DISCOUNT", () => {
      expect(() => assertCanDecide("DISCOUNT", "sales_manager")).not.toThrow();
      expect(() => assertCanDecide("DISCOUNT", "finance")).not.toThrow();
      expect(() => assertCanDecide("DISCOUNT", "admin")).not.toThrow();
      expect(() => assertCanDecide("DISCOUNT", "sales_rep")).toThrow(
        /FORBIDDEN/,
      );
    });

    it("allows only finance and admin to decide CREDIT_NOTE", () => {
      expect(() => assertCanDecide("CREDIT_NOTE", "finance")).not.toThrow();
      expect(() => assertCanDecide("CREDIT_NOTE", "admin")).not.toThrow();
      expect(() => assertCanDecide("CREDIT_NOTE", "sales_manager")).toThrow(
        /FORBIDDEN/,
      );
      expect(() => assertCanDecide("CREDIT_NOTE", "sales_rep")).toThrow(
        /FORBIDDEN/,
      );
    });

    it("allows sales_rep, sales_manager, and admin to decide NUDGE and NEGOTIATION", () => {
      expect(() => assertCanDecide("NUDGE", "sales_rep")).not.toThrow();
      expect(() => assertCanDecide("NEGOTIATION", "sales_rep")).not.toThrow();
      expect(() =>
        assertCanDecide("NEGOTIATION", "sales_manager"),
      ).not.toThrow();
      expect(() => assertCanDecide("NEGOTIATION", "finance")).toThrow(
        /FORBIDDEN/,
      );
    });

    it("allows sales_manager and admin to decide FULFILLMENT_OVERRIDE", () => {
      expect(() =>
        assertCanDecide("FULFILLMENT_OVERRIDE", "sales_manager"),
      ).not.toThrow();
      expect(() =>
        assertCanDecide("FULFILLMENT_OVERRIDE", "admin"),
      ).not.toThrow();
      expect(() =>
        assertCanDecide("FULFILLMENT_OVERRIDE", "sales_rep"),
      ).toThrow(/FORBIDDEN/);
    });
  });

  describe("listApprovals", () => {
    it("scopes approval request kinds based on user role", async () => {
      vi.mocked(db.approvalRequest.findMany).mockResolvedValueOnce([]);

      await listApprovals({
        status: "PENDING",
        user: { sub: "rep-1", role: "sales_rep" },
      });

      expect(db.approvalRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
            kind: { in: ["NUDGE", "NEGOTIATION"] },
          }),
        }),
      );
    });
  });

  describe("decideApproval", () => {
    it("rejects an approval request, updates status, and audits", async () => {
      vi.mocked(db.approvalRequest.findUniqueOrThrow).mockResolvedValueOnce({
        id: "ar-1",
        kind: "DISCOUNT",
        status: "PENDING",
        runId: "run-10",
        proposedAction: { lineId: "line-1", discountPct: 20 },
      } as unknown as Awaited<
        ReturnType<typeof db.approvalRequest.findUniqueOrThrow>
      >);

      vi.mocked(db.approvalRequest.update).mockResolvedValueOnce({
        id: "ar-1",
        status: "REJECTED",
      } as unknown as Awaited<ReturnType<typeof db.approvalRequest.update>>);

      const res = await decideApproval(
        "ar-1",
        { decision: "REJECTED", reason: "Discount too steep" },
        { sub: "mgr-1", role: "sales_manager" },
      );

      expect(res).toEqual({ status: "REJECTED", id: "ar-1" });
      expect(db.approvalRequest.update).toHaveBeenCalledWith({
        where: { id: "ar-1" },
        data: expect.objectContaining({
          status: "REJECTED",
          decidedBy: "mgr-1",
        }),
      });
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "AI_APPROVAL_REJECTED",
          actorId: "mgr-1",
          reason: "Discount too steep",
        }),
      );
      expect(closeRun).toHaveBeenCalledWith(
        "run-10",
        "FAILED",
        undefined,
        "Discount too steep",
      );
    });

    it("approves an approval request, executes dispatch, and audits", async () => {
      vi.mocked(db.approvalRequest.findUniqueOrThrow).mockResolvedValueOnce({
        id: "ar-2",
        kind: "DISCOUNT",
        status: "PENDING",
        runId: "run-20",
        proposedAction: {
          quotationId: "q-1",
          adjustments: [{ lineId: "line-1", toDiscountPct: 10 }],
        },
      } as unknown as Awaited<
        ReturnType<typeof db.approvalRequest.findUniqueOrThrow>
      >);

      vi.mocked(db.approvalRequest.update).mockResolvedValueOnce({
        id: "ar-2",
        status: "APPROVED",
      } as unknown as Awaited<ReturnType<typeof db.approvalRequest.update>>);

      const res = await decideApproval(
        "ar-2",
        { decision: "APPROVED" },
        { sub: "fin-1", role: "finance" },
      );

      expect(res.status).toBe("APPROVED");
      expect(db.quotationLine.update).toHaveBeenCalledWith({
        where: { id: "line-1" },
        data: { discountPct: 10 },
      });
      expect(recomputeTotals).toHaveBeenCalledWith("q-1");
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "AI_APPROVAL_APPROVED",
          actorId: "fin-1",
        }),
      );
      expect(closeRun).toHaveBeenCalledWith(
        "run-20",
        "DONE",
        expect.objectContaining({ approved: true }),
      );
    });
  });

  describe("applyProposedAction", () => {
    it("creates a credit note for CREDIT_NOTE approval", async () => {
      vi.mocked(db.creditNote.create).mockResolvedValueOnce({
        id: "cn-1",
        amountMinor: 5000,
      } as unknown as Awaited<ReturnType<typeof db.creditNote.create>>);

      const res = await applyProposedAction(
        "CREDIT_NOTE",
        {
          scheduleId: "sched-1",
          amountMinor: 5000,
          reason: "Satisfaction guarantee",
        },
        { actorId: "fin-1" },
      );

      expect(db.creditNote.create).toHaveBeenCalledWith({
        data: {
          scheduleId: "sched-1",
          amountMinor: 5000,
          reason: "Satisfaction guarantee",
          sourceInvoiceId: null,
        },
      });
      expect(res).toEqual({ creditNoteId: "cn-1", amountMinor: 5000 });
    });
  });
});
