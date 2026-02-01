import { z } from 'zod'

const uuid = () => z.string().uuid()

const scopedSchema = z.object({
  organizationId: uuid(),
  tenantId: uuid(),
})

// Correspondence Source Schemas
export const correspondenceSourceCreateSchema = scopedSchema.extend({
  name: z.string().trim().min(1).max(200),
  sourceType: z.enum(['edoreczenia-mock', 'epuap', 'email']),
  config: z.record(z.any()),
  isActive: z.boolean().optional(),
  defaultReceivingOrgUnitId: uuid().optional().nullable(),
  defaultReceivingOrgUnitSymbol: z.string().trim().max(50).optional().nullable(),
})

export const correspondenceSourceUpdateSchema = z
  .object({
    id: uuid(),
  })
  .merge(
    scopedSchema.extend({
      name: z.string().trim().min(1).max(200).optional(),
      sourceType: z.enum(['edoreczenia-mock', 'epuap', 'email']).optional(),
      config: z.record(z.any()).optional(),
      isActive: z.boolean().optional(),
      defaultReceivingOrgUnitId: uuid().optional().nullable(),
      defaultReceivingOrgUnitSymbol: z.string().trim().max(50).optional().nullable(),
    }).partial()
  )

export const correspondenceSyncRequestSchema = z.object({
  sourceId: uuid(),
  organizationId: uuid(),
  tenantId: uuid(),
})

// Config-specific validators
export const edorezeniaMockConfigSchema = z.object({
  mockEndpoint: z.string().url().optional(),
  autoFetchEnabled: z.boolean().optional(),
  fetchIntervalMinutes: z.coerce.number().int().min(1).optional(),
})

export const epuapConfigSchema = z.object({
  endpointUrl: z.string().url(),
  clientId: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1),
  certificatePath: z.string().trim().optional(),
})

export const emailConfigSchema = z.object({
  imapHost: z.string().trim().min(1),
  imapPort: z.coerce.number().int().min(1).max(65535),
  imapUsername: z.string().trim().min(1),
  imapPassword: z.string().trim().min(1),
  imapSecure: z.boolean().optional(),
  folderName: z.string().trim().optional(),
})

// Validate config based on source type
export const validateSourceConfig = (sourceType: string, config: Record<string, any>) => {
  switch (sourceType) {
    case 'edoreczenia-mock':
      return edorezeniaMockConfigSchema.parse(config)
    case 'epuap':
      return epuapConfigSchema.parse(config)
    case 'email':
      return emailConfigSchema.parse(config)
    default:
      throw new Error(`Unknown source type: ${sourceType}`)
  }
}
