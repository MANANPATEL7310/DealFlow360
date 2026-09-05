// apps/api/src/modules/product/product.schema.ts
// === M1: Local re-export from @template/shared ===
// Keep all validation logic in packages/shared so the frontend can import it too.

export {
  productCategorySchema,
  customerTierSchema,
  createProductSchema,
  updateProductSchema,
  createProductVariantSchema,
  updateProductVariantSchema,
  createPriceListSchema,
  updatePriceListSchema,
  addPriceListItemSchema,
} from "@template/shared";

export type {
  ProductCategory,
  CustomerTier,
  CreateProductInput,
  UpdateProductInput,
  CreateProductVariantInput,
  CreatePriceListInput,
  AddPriceListItemInput,
} from "@template/shared";
