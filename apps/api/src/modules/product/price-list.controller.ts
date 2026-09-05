// apps/api/src/modules/product/price-list.controller.ts
// === M1: PriceList & PriceListItem controllers ===

import type { Request, Response } from "express";
import { sendCreated, sendNotFound, sendOk } from "../../lib/response.js";
import {
  priceListService,
  priceListItemService,
} from "./price-list.service.js";

// ─── Price List controllers ───────────────────────────────────────────────────

export async function listPriceListsController(_req: Request, res: Response) {
  return sendOk(res, await priceListService.findMany({}));
}

export async function getPriceListController(req: Request, res: Response) {
  const pl = await priceListService.findById(req.params.id as string);
  return pl ? sendOk(res, pl) : sendNotFound(res, "Price list not found.");
}

export async function createPriceListController(req: Request, res: Response) {
  return sendCreated(
    res,
    await priceListService.create(req.body),
    "Price list created.",
  );
}

export async function updatePriceListController(req: Request, res: Response) {
  return sendOk(
    res,
    await priceListService.update(req.params.id as string, req.body),
    "Price list updated.",
  );
}

export async function deletePriceListController(req: Request, res: Response) {
  await priceListService.delete(req.params.id as string);
  return sendOk(res, { id: req.params.id as string }, "Price list deleted.");
}

// ─── Price List Item controllers ──────────────────────────────────────────────

export async function addPriceListItemController(req: Request, res: Response) {
  return sendCreated(
    res,
    await priceListItemService.create({
      ...req.body,
      priceListId: req.params.id as string,
    }),
    "Item added to price list.",
  );
}

export async function deletePriceListItemController(
  req: Request,
  res: Response,
) {
  await priceListItemService.delete(req.params.itemId as string);
  return sendOk(res, { id: req.params.itemId as string }, "Item removed.");
}
