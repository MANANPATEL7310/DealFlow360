// apps/api/src/modules/product/product.controller.ts
// === M1: Product & Variant controllers ===

import type { Request, Response } from "express";
import { sendCreated, sendNotFound, sendOk } from "../../lib/response.js";
import { productService, variantService } from "./product.service.js";
import { db } from "../../lib/db.js";

// ─── Product controllers ──────────────────────────────────────────────────────

export async function listProductsController(req: Request, res: Response) {
  const query =
    typeof req.query.query === "string" ? req.query.query.trim() : "";
  const category =
    typeof req.query.category === "string" && req.query.category !== "ALL"
      ? req.query.category
      : undefined;
  const promotedOnly = req.query.promotedOnly === "true";
  return sendOk(
    res,
    await db.product.findMany({
      where: {
        ...(category
          ? { category: category as "HARDWARE" | "SERVICES" | "SUBSCRIPTIONS" }
          : {}),
        ...(promotedOnly ? { isPromoted: true } : {}),
        ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
      },
      include: { variants: true },
      orderBy: { updatedAt: "desc" },
    }),
  );
}

export async function getProductController(req: Request, res: Response) {
  const product = await db.product.findUnique({
    where: { id: req.params.id as string },
    include: { variants: true },
  });
  return product
    ? sendOk(res, product)
    : sendNotFound(res, "Product not found.");
}

export async function createProductController(req: Request, res: Response) {
  return sendCreated(
    res,
    await productService.create(req.body),
    "Product created.",
  );
}

export async function updateProductController(req: Request, res: Response) {
  return sendOk(
    res,
    await productService.update(req.params.id as string, req.body),
    "Product updated.",
  );
}

export async function deleteProductController(req: Request, res: Response) {
  await productService.delete(req.params.id as string);
  return sendOk(res, { id: req.params.id as string }, "Product deleted.");
}

// ─── Variant controllers ──────────────────────────────────────────────────────

export async function listVariantsController(req: Request, res: Response) {
  return sendOk(
    res,
    await variantService.findMany({ productId: req.params.id as string }),
  );
}

export async function createVariantController(req: Request, res: Response) {
  return sendCreated(
    res,
    await variantService.create({
      ...req.body,
      productId: req.params.id as string,
    }),
    "Variant created.",
  );
}

export async function deleteVariantController(req: Request, res: Response) {
  await variantService.delete(req.params.variantId as string);
  return sendOk(
    res,
    { id: req.params.variantId as string },
    "Variant deleted.",
  );
}
