import { z } from "zod";

export const updateSettingSchema = z.object({
  value: z.unknown(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

export const auditLogQuerySchema = z.object({
  entity: z.string().optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
