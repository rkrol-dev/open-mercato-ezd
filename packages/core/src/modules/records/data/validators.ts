import { z } from 'zod'

const uuid = () => z.string().uuid()

const scopedSchema = z.object({
  organizationId: uuid(),
  tenantId: uuid(),
})

// Incoming Shipment Schemas
export const incomingShipmentCreateSchema = scopedSchema.extend({
  receivingOrgUnitId: uuid(),
  receivingOrgUnitSymbol: z.string().trim().min(1).max(50),
  subject: z.string().trim().min(1).max(500),
  senderId: uuid().optional().nullable(),
  senderDisplayName: z.string().trim().max(200).optional().nullable(),
  senderAnonymous: z.boolean().optional(),
  deliveryMethod: z.string().trim().min(1).max(100),
  receivedAt: z.coerce.date(),
  postedAt: z.coerce.date().optional().nullable(),
  senderReference: z.string().trim().max(200).optional().nullable(),
  remarks: z.string().trim().max(2000).optional().nullable(),
  documentDate: z.coerce.date().optional().nullable(),
  documentSign: z.string().trim().max(200).optional().nullable(),
  accessLevel: z.enum(['public', 'partial', 'restricted']).optional().nullable(),
})

export const incomingShipmentUpdateSchema = z
  .object({
    id: uuid(),
  })
  .merge(
    scopedSchema.extend({
      receivingOrgUnitId: uuid().optional(),
      receivingOrgUnitSymbol: z.string().trim().min(1).max(50).optional(),
      subject: z.string().trim().min(1).max(500).optional(),
      senderId: uuid().optional().nullable(),
      senderDisplayName: z.string().trim().max(200).optional().nullable(),
      senderAnonymous: z.boolean().optional(),
      deliveryMethod: z.string().trim().min(1).max(100).optional(),
      receivedAt: z.coerce.date().optional(),
      postedAt: z.coerce.date().optional().nullable(),
      senderReference: z.string().trim().max(200).optional().nullable(),
      remarks: z.string().trim().max(2000).optional().nullable(),
      documentDate: z.coerce.date().optional().nullable(),
      documentSign: z.string().trim().max(200).optional().nullable(),
      accessLevel: z.enum(['public', 'partial', 'restricted']).optional().nullable(),
    }).partial()
  )

export const incomingShipmentRegisterSchema = z.object({
  id: uuid(),
  organizationId: uuid(),
  tenantId: uuid(),
})

// JRWA Class Schemas
export const jrwaClassCreateSchema = scopedSchema.extend({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(500),
  description: z.string().trim().max(2000).optional().nullable(),
  parentId: uuid().optional().nullable(),
  retentionYears: z.coerce.number().int().min(0).optional().nullable(),
  retentionCategory: z.enum(['A', 'B', 'BE', 'Bc']).optional().nullable(),
  archivalPackageVariant: z.string().trim().max(100).optional().nullable(),
  version: z.coerce.number().int().min(1),
  isActive: z.boolean().optional(),
})

export const jrwaClassUpdateSchema = z
  .object({
    id: uuid(),
  })
  .merge(
    scopedSchema.extend({
      code: z.string().trim().min(1).max(50).optional(),
      name: z.string().trim().min(1).max(500).optional(),
      description: z.string().trim().max(2000).optional().nullable(),
      parentId: uuid().optional().nullable(),
      retentionYears: z.coerce.number().int().min(0).optional().nullable(),
      retentionCategory: z.enum(['A', 'B', 'BE', 'Bc']).optional().nullable(),
      archivalPackageVariant: z.string().trim().max(100).optional().nullable(),
      version: z.coerce.number().int().min(1).optional(),
      isActive: z.boolean().optional(),
    }).partial()
  )

// CSV Import Schemas
export const jrwaImportCsvRowSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  parentCode: z.string().trim().optional(),
  retentionYears: z.string().optional(),
  retentionCategory: z.string().optional(),
  archivalPackageVariant: z.string().trim().optional(),
})

export const jrwaImportRequestSchema = scopedSchema.extend({
  version: z.coerce.number().int().min(1),
  csvData: z.string().min(1),
})

export const jrwaValidateCsvRequestSchema = z.object({
  csvData: z.string().min(1),
})

// Document Schemas (Phase 2)
export const documentCreateSchema = scopedSchema.extend({
  title: z.string().trim().min(1).max(500),
  kind: z.string().trim().max(100).optional().nullable(),
  accessLevel: z.enum(['public', 'partial', 'restricted']).optional().nullable(),
  incomingShipmentId: uuid().optional().nullable(),
  attachmentIds: z.array(uuid()).optional(),
  disposalStatus: z.string().trim().max(100).optional().nullable(),
})

export const documentUpdateSchema = z
  .object({
    id: uuid(),
  })
  .merge(
    scopedSchema.extend({
      title: z.string().trim().min(1).max(500).optional(),
      kind: z.string().trim().max(100).optional().nullable(),
      accessLevel: z.enum(['public', 'partial', 'restricted']).optional().nullable(),
      incomingShipmentId: uuid().optional().nullable(),
      attachmentIds: z.array(uuid()).optional(),
      disposalStatus: z.string().trim().max(100).optional().nullable(),
    }).partial()
  )
