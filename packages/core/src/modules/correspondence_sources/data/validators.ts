import { z } from 'zod'

/**
 * Correspondence Source Validators
 */

export const CorrespondenceSourceCreateSchema = z.object({
  name: z.string().min(1).max(200),
  sourceType: z.enum(['edoreczenia-mock', 'epuap', 'email']),
  config: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
  defaultReceivingOrgUnitId: z.string().uuid().optional(),
})

export const CorrespondenceSourceUpdateSchema = CorrespondenceSourceCreateSchema.partial()

export const CorrespondenceSourceFilterSchema = z.object({
  sourceType: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(30),
})

/**
 * Sync Log Validators
 */

export const SyncLogFilterSchema = z.object({
  sourceId: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
  syncStartedAtFrom: z.coerce.date().optional(),
  syncStartedAtTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(30),
})

export const TriggerSyncSchema = z.object({
  sourceId: z.string().uuid(),
})

export type CorrespondenceSourceCreate = z.infer<typeof CorrespondenceSourceCreateSchema>
export type CorrespondenceSourceUpdate = z.infer<typeof CorrespondenceSourceUpdateSchema>
export type CorrespondenceSourceFilter = z.infer<typeof CorrespondenceSourceFilterSchema>
export type SyncLogFilter = z.infer<typeof SyncLogFilterSchema>
export type TriggerSync = z.infer<typeof TriggerSyncSchema>
