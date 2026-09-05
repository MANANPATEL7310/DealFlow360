// apps/api/src/modules/product/price-list.service.ts
// === M1: PriceList & PriceListItem CRUD ===

import { createCrudService } from "../../lib/crud-factory.js";

/** Standard CRUD for PriceList */
export const priceListService = createCrudService("priceList");

/** Standard CRUD for PriceListItem */
export const priceListItemService = createCrudService("priceListItem");
