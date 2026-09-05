// apps/api/src/modules/customer/customer.schema.ts
// === M2: Customer Management ===
// Thin re-export from @template/shared — keeps the module self-contained
// without duplicating validation logic.

export {
  createCustomerSchema,
  updateCustomerSchema,
  createContactSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type CreateContactInput,
  customerTierSchema,
  type CustomerTier,
} from "@template/shared";
