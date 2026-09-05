// apps/api/src/modules/product/product.service.ts
// === M1: Product & ProductVariant CRUD ===

import { createCrudService } from "../../lib/crud-factory.js";

/** Standard CRUD for Product: findMany / findById / create / update / delete / count */
export const productService = createCrudService("product");

/** Standard CRUD for ProductVariant */
export const variantService = createCrudService("productVariant");
