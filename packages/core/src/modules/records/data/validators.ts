import { z } from 'zod'

/**
 * Incoming Shipment Validators
 */

export const IncomingShipmentCreateSchema = z.object({
  receivingOrgUnitId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  senderId: z.string().uuid().optional(),
  senderDisplayName: z.string().min(1).max(200).optional(),
  senderAnonymous: z.boolean().default(false),
  deliveryMethod: z.enum(['edoreczenia-mock', 'epuap', 'email', 'postal']),
  receivedAt: z.coerce.date(),
  postedAt: z.coerce.date().optional(),
  senderReference: z.string().max(100).optional(),
  remarks: z.string().max(1000).optional(),
  documentDate: z.coerce.date().optional(),
  documentSign: z.string().max(100).optional(),
  accessLevel: z.enum(['public', 'partial', 'restricted']).optional(),
  jrwaClassId: z.string().uuid().optional(),
})

export const IncomingShipmentUpdateSchema = IncomingShipmentCreateSchema.partial()
  .extend({
    // RPW fields are immutable after registration
    rpwNumber: z.never().optional(),
    rpwSequence: z.never().optional(),
    status: z.never().optional(),
  })

export const IncomingShipmentFilterSchema = z.object({
  status: z.enum(['draft', 'registered']).optional(),
  receivingOrgUnitId: z.string().uuid().optional(),
  senderId: z.string().uuid().optional(),
  deliveryMethod: z.string().optional(),
  receivedAtFrom: z.coerce.date().optional(),
  receivedAtTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(30),
})

/**
 * JRWA Class Validators
 */

export const JrwaClassCreateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  parentId: z.string().uuid().optional(),
  retentionYears: z.number().int().min(0).max(1000).optional(),
  retentionCategory: z.string().max(10).optional(),
  archivalPackageVariant: z.string().max(50).optional(),
  version: z.number().int().min(1).default(1),
})

export const JrwaClassUpdateSchema = JrwaClassCreateSchema.partial()

export const JrwaClassFilterSchema = z.object({
  version: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
  parentId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(100),
})

export const JrwaImportRowSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  parentCode: z.string().optional(),
  retentionYears: z.string().optional(),
  retentionCategory: z.string().optional(),
  archivalPackageVariant: z.string().optional(),
})

export const JrwaImportSchema = z.object({
  version: z.number().int().min(1),
  rows: z.array(JrwaImportRowSchema).min(1).max(10000),
  replaceExisting: z.boolean().default(false),
})

/**
 * Document Validators (Phase 2)
 */

export const RecordsDocumentCreateSchema = z.object({
  title: z.string().min(1).max(500),
  kind: z.string().max(100).optional(),
  accessLevel: z.enum(['public', 'partial', 'restricted']).optional(),
  incomingShipmentId: z.string().uuid().optional(),
  attachmentIds: z.array(z.string().uuid()).default([]),
})

export const RecordsDocumentUpdateSchema = RecordsDocumentCreateSchema.partial()

export type IncomingShipmentCreate = z.infer<typeof IncomingShipmentCreateSchema>
export type IncomingShipmentUpdate = z.infer<typeof IncomingShipmentUpdateSchema>
export type IncomingShipmentFilter = z.infer<typeof IncomingShipmentFilterSchema>
export type JrwaClassCreate = z.infer<typeof JrwaClassCreateSchema>
export type JrwaClassUpdate = z.infer<typeof JrwaClassUpdateSchema>
export type JrwaClassFilter = z.infer<typeof JrwaClassFilterSchema>
export type JrwaImportRow = z.infer<typeof JrwaImportRowSchema>
export type JrwaImport = z.infer<typeof JrwaImportSchema>
export type RecordsDocumentCreate = z.infer<typeof RecordsDocumentCreateSchema>
export type RecordsDocumentUpdate = z.infer<typeof RecordsDocumentUpdateSchema>
