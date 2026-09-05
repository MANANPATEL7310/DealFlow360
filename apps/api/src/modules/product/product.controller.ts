// apps/api/src/modules/product/product.controller.ts
// === M1: Product & Variant controllers ===

import type { Request, Response } from "express";
import { sendCreated, sendNotFound, sendOk } from "../../lib/response.js";
import { productService, variantService } from "./product.service.js";

// ─── Product controllers ──────────────────────────────────────────────────────

export async function listProductsController(_req: Request, res: Response) {
  return sendOk(res, await productService.findMany({}));
}

export async function getProductController(req: Request, res: Response) {
  const product = await productService.findById(req.params.id);
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
    await productService.update(req.params.id, req.body),
    "Product updated.",
  );
}

export async function deleteProductController(req: Request, res: Response) {
  await productService.delete(req.params.id);
  return sendOk(res, { id: req.params.id }, "Product deleted.");
}

// ─── Variant controllers ──────────────────────────────────────────────────────

export async function listVariantsController(req: Request, res: Response) {
  return sendOk(
    res,
    await variantService.findMany({ productId: req.params.id }),
  );
}

export async function createVariantController(req: Request, res: Response) {
  return sendCreated(
    res,
    await variantService.create({ ...req.body, productId: req.params.id }),
    "Variant created.",
  );
}

export async function deleteVariantController(req: Request, res: Response) {
  await variantService.delete(req.params.variantId);
  return sendOk(res, { id: req.params.variantId }, "Variant deleted.");
}
