import { z } from "zod";
import { customerSchema, SEED_CUSTOMERS } from "./customer";
import { type ApprovalLevel, approvalLevelSchema } from "./governance";
import {
  type Product,
  productSchema,
  type ProductVariant,
  productVariantSchema,
  SEED_PRODUCTS,
} from "./product";

export const quotationStatuses = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "UNDER_NEGOTIATION",
  "CONFIRMED",
  "FULFILLMENT",
  "BILLING",
  "PAID",
  "REJECTED",
] as const;
export type QuotationStatus = (typeof quotationStatuses)[number];
export const quotationStatusSchema = z.enum(quotationStatuses);

export const lineTypes = ["ONE_TIME", "RECURRING"] as const;
export type LineType = (typeof lineTypes)[number];
export const lineTypeSchema = z.enum(lineTypes);

export const approvalDecisions = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RETURNED",
] as const;
export type ApprovalDecision = (typeof approvalDecisions)[number];
export const approvalDecisionSchema = z.enum(approvalDecisions);

// ─── Quotation Line ──────────────────────────────────────────────────────────
export const quotationLineSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  productId: z.string(),
  product: productSchema.optional(),
  variantId: z.string().nullable().optional(),
  variant: productVariantSchema.nullable().optional(),
  qty: z.number().int().positive().default(1),
  unitPriceMinor: z.number().int().nonnegative(), // resolved price in cents
  unitCostMinor: z.number().int().nonnegative(), // cost snapshot in cents
  discountPct: z.number().min(0).max(100).default(0),
  lineType: lineTypeSchema.default("ONE_TIME"),
  subscriptionPlanId: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type QuotationLine = z.infer<typeof quotationLineSchema>;

// ─── Status Event ────────────────────────────────────────────────────────────
export const quotationStatusEventSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  fromStatus: quotationStatusSchema,
  toStatus: quotationStatusSchema,
  actorId: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});
export type QuotationStatusEvent = z.infer<typeof quotationStatusEventSchema>;

// ─── Approval Step ───────────────────────────────────────────────────────────
export const quotationApprovalStepSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  level: approvalLevelSchema,
  sequence: z.number().int().positive(),
  decision: approvalDecisionSchema.default("PENDING"),
  approverId: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  decidedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});
export type QuotationApprovalStep = z.infer<typeof quotationApprovalStepSchema>;

// ─── Quotation ───────────────────────────────────────────────────────────────
export const quotationSchema = z.object({
  id: z.string(),
  quotationNumber: z.string(),
  customerId: z.string(),
  customer: customerSchema.optional(),
  salesRepId: z.string(),
  status: quotationStatusSchema.default("DRAFT"),
  blendedRiskScore: z.number().default(0),
  subtotalMinor: z.number().int().default(0), // in cents
  discountTotalMinor: z.number().int().default(0), // in cents
  taxTotalMinor: z.number().int().default(0), // in cents
  grandTotalMinor: z.number().int().default(0), // in cents
  marginPct: z.number().default(0),
  lastActivityAt: z.string().optional(),
  lines: z.array(quotationLineSchema).default([]),
  statusEvents: z.array(quotationStatusEventSchema).default([]),
  approvals: z.array(quotationApprovalStepSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Quotation = z.infer<typeof quotationSchema>;

// ─── Inputs ──────────────────────────────────────────────────────────────────
export const createQuotationSchema = z.object({
  customerId: z.string().min(1, "Customer selection is required"),
});
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export const addLineSchema = z.object({
  productId: z.string().min(1, "Product selection is required"),
  variantId: z.string().optional(),
  qty: z.number().int().positive("Quantity must be at least 1").default(1),
  discountPct: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .default(0),
  lineType: lineTypeSchema.default("ONE_TIME"),
  subscriptionPlanId: z.string().optional(),
});
export type AddLineInput = z.infer<typeof addLineSchema>;

export const updateLineSchema = z.object({
  qty: z.number().int().positive().optional(),
  discountPct: z.number().min(0).max(100).optional(),
});
export type UpdateLineInput = z.infer<typeof updateLineSchema>;

export const approvalDecisionInputSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "RETURNED"]),
  reason: z
    .string()
    .min(3, "A justification reason of at least 3 characters is required"),
});
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionInputSchema>;

// ─── Risk Breakdown Types ────────────────────────────────────────────────────
export interface LineRiskBreakdown {
  lineId: string;
  productTitle: string;
  category: string;
  qty: number;
  unitPriceMinor: number;
  appliedDiscountPct: number;
  tierCapPct: number;
  categoryCapPct: number;
  effectiveCeilingPct: number;
  excessDiscountPct: number;
  lineRiskScore: number;
  isCompliant: boolean;
}

export interface QuotationRiskEvaluation {
  blendedRiskScore: number;
  lines: LineRiskBreakdown[];
  isAutoApproved: boolean;
  requiredLevels: ApprovalLevel[];
  matchedRuleName: string;
}

// ─── Helpers for Seed Hydration ──────────────────────────────────────────────
const p01 = SEED_PRODUCTS[0] as Product; // Edge Server Rack
const p02 = SEED_PRODUCTS[1] as Product; // AI Inference Accelerator
const p03 = SEED_PRODUCTS[2] as Product; // Enterprise Architecture Review
const p04 = SEED_PRODUCTS[3] as Product; // Cloud Platform Enterprise

const c01 = SEED_CUSTOMERS[0]; // Global FinTech (Gold)
const c02 = SEED_CUSTOMERS[1]; // NextGen BioHealth (Silver)
const c03 = SEED_CUSTOMERS[2]; // HyperScale Logistics (Gold)
const c04 = SEED_CUSTOMERS[3]; // Vertex AI Labs (Bronze)

export const SEED_QUOTATIONS: Quotation[] = [
  {
    id: "qt-101",
    quotationNumber: "QT-2026-001",
    customerId: "cst-01",
    customer: c01,
    salesRepId: "usr-sales-01",
    status: "DRAFT",
    blendedRiskScore: 0.0,
    subtotalMinor: 4800000, // $48,000.00
    discountTotalMinor: 240000, // $2,400.00 (5% discount)
    taxTotalMinor: 364800, // 8% tax on $45,600 = $3,648.00
    grandTotalMinor: 4924800, // $49,248.00
    marginPct: 41.25,
    lastActivityAt: "2026-09-04T12:00:00.000Z",
    lines: [
      {
        id: "qtl-101-1",
        quotationId: "qt-101",
        productId: p01.id,
        product: p01,
        variantId: p01.variants[0]?.id ?? null,
        variant: p01.variants[0] as ProductVariant,
        qty: 2,
        unitPriceMinor: 1400000, // $14,000.00
        unitCostMinor: 800000, // $8,000.00
        discountPct: 5.0,
        lineType: "ONE_TIME",
        createdAt: "2026-09-04T11:00:00.000Z",
        updatedAt: "2026-09-04T11:00:00.000Z",
      },
      {
        id: "qtl-101-2",
        quotationId: "qt-101",
        productId: p03.id,
        product: p03,
        variantId: null,
        variant: null,
        qty: 1,
        unitPriceMinor: 2000000, // $20,000.00
        unitCostMinor: 1000000, // $10,000.00
        discountPct: 5.0,
        lineType: "ONE_TIME",
        createdAt: "2026-09-04T11:05:00.000Z",
        updatedAt: "2026-09-04T11:05:00.000Z",
      },
    ],
    statusEvents: [
      {
        id: "qte-101-1",
        quotationId: "qt-101",
        fromStatus: "DRAFT",
        toStatus: "DRAFT",
        actorId: "usr-sales-01",
        reason: "Initial quotation draft created",
        createdAt: "2026-09-04T11:00:00.000Z",
      },
    ],
    approvals: [],
    createdAt: "2026-09-04T11:00:00.000Z",
    updatedAt: "2026-09-04T12:00:00.000Z",
  },
  {
    id: "qt-102",
    quotationNumber: "QT-2026-002",
    customerId: "cst-02",
    customer: c02,
    salesRepId: "usr-sales-01",
    status: "PENDING_APPROVAL",
    blendedRiskScore: 3.84,
    subtotalMinor: 3800000, // $38,000.00
    discountTotalMinor: 684000, // $6,840.00 (18% discount - over Silver 10% ceiling)
    taxTotalMinor: 249280, // 8% tax
    grandTotalMinor: 3365280, // $33,652.80
    marginPct: 24.8,
    lastActivityAt: "2026-09-04T14:30:00.000Z",
    lines: [
      {
        id: "qtl-102-1",
        quotationId: "qt-102",
        productId: p02.id,
        product: p02,
        variantId: p02.variants[0]?.id ?? null,
        variant: p02.variants[0] as ProductVariant,
        qty: 10,
        unitPriceMinor: 380000, // $3,800.00
        unitCostMinor: 220000, // $2,200.00
        discountPct: 18.0, // Exceeds Silver 10% ceiling
        lineType: "ONE_TIME",
        createdAt: "2026-09-04T14:00:00.000Z",
        updatedAt: "2026-09-04T14:00:00.000Z",
      },
    ],
    statusEvents: [
      {
        id: "qte-102-1",
        quotationId: "qt-102",
        fromStatus: "DRAFT",
        toStatus: "PENDING_APPROVAL",
        actorId: "usr-sales-01",
        reason: "Escalated for approval: 18% discount exceeds Silver 10% cap",
        createdAt: "2026-09-04T14:30:00.000Z",
      },
    ],
    approvals: [
      {
        id: "qta-102-1",
        quotationId: "qt-102",
        level: "SALES_MANAGER",
        sequence: 1,
        decision: "PENDING",
        createdAt: "2026-09-04T14:30:00.000Z",
      },
      {
        id: "qta-102-2",
        quotationId: "qt-102",
        level: "FINANCE",
        sequence: 2,
        decision: "PENDING",
        createdAt: "2026-09-04T14:30:00.000Z",
      },
    ],
    createdAt: "2026-09-04T14:00:00.000Z",
    updatedAt: "2026-09-04T14:30:00.000Z",
  },
  {
    id: "qt-103",
    quotationNumber: "QT-2026-003",
    customerId: "cst-03",
    customer: c03,
    salesRepId: "usr-sales-01",
    status: "APPROVED",
    blendedRiskScore: 0.0,
    subtotalMinor: 5880000, // $58,800.00
    discountTotalMinor: 588000, // 10% discount on Gold (under 15% cap)
    taxTotalMinor: 423360,
    grandTotalMinor: 5715360,
    marginPct: 48.5,
    lastActivityAt: "2026-09-03T16:00:00.000Z",
    lines: [
      {
        id: "qtl-103-1",
        quotationId: "qt-103",
        productId: p04.id,
        product: p04,
        variantId: null,
        variant: null,
        qty: 12,
        unitPriceMinor: 490000, // $4,900.00/mo
        unitCostMinor: 150000,
        discountPct: 10.0,
        lineType: "RECURRING",
        createdAt: "2026-09-03T15:00:00.000Z",
        updatedAt: "2026-09-03T15:00:00.000Z",
      },
    ],
    statusEvents: [
      {
        id: "qte-103-1",
        quotationId: "qt-103",
        fromStatus: "DRAFT",
        toStatus: "APPROVED",
        actorId: "usr-sales-01",
        reason: "Auto-approved: within Gold tier 15% policy limit",
        createdAt: "2026-09-03T16:00:00.000Z",
      },
    ],
    approvals: [],
    createdAt: "2026-09-03T15:00:00.000Z",
    updatedAt: "2026-09-03T16:00:00.000Z",
  },
  {
    id: "qt-104",
    quotationNumber: "QT-2026-004",
    customerId: "cst-04",
    customer: c04,
    salesRepId: "usr-sales-01",
    status: "CONFIRMED",
    blendedRiskScore: 0.0,
    subtotalMinor: 1200000, // $12,000.00
    discountTotalMinor: 0,
    taxTotalMinor: 96000,
    grandTotalMinor: 1296000,
    marginPct: 38.0,
    lastActivityAt: "2026-09-02T10:00:00.000Z",
    lines: [
      {
        id: "qtl-104-1",
        quotationId: "qt-104",
        productId: p01.id,
        product: p01,
        variantId: null,
        variant: null,
        qty: 1,
        unitPriceMinor: 1200000,
        unitCostMinor: 700000,
        discountPct: 0.0,
        lineType: "ONE_TIME",
        createdAt: "2026-09-02T09:00:00.000Z",
        updatedAt: "2026-09-02T09:00:00.000Z",
      },
    ],
    statusEvents: [
      {
        id: "qte-104-1",
        quotationId: "qt-104",
        fromStatus: "DRAFT",
        toStatus: "APPROVED",
        actorId: "usr-sales-01",
        reason: "Auto-approved with 0% discount",
        createdAt: "2026-09-02T09:30:00.000Z",
      },
      {
        id: "qte-104-2",
        quotationId: "qt-104",
        fromStatus: "APPROVED",
        toStatus: "CONFIRMED",
        actorId: "usr-sales-01",
        reason: "Customer signed agreement",
        createdAt: "2026-09-02T10:00:00.000Z",
      },
    ],
    approvals: [],
    createdAt: "2026-09-02T09:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
  },
];
