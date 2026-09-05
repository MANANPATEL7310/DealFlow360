// apps/api/src/modules/auth/auth.schema.ts
// Re-exports from @template/shared — single source of truth for validation contracts
export {
  loginSchema,
  registerSchema,
  roleSchema,
  internalRoles,
  type LoginInput,
  type RegisterInput,
  type InternalRole,
} from "@template/shared";
