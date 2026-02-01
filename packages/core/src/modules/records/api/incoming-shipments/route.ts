/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RecordsIncomingShipment } from '../../data/entities'
import {
  incomingShipmentCreateSchema,
  incomingShipmentUpdateSchema,
} from '../../data/validators'
import { escapeLikePattern } from '@open-mercato/shared/lib/db/escapeLikePattern'
import {
  createRecordsCrudOpenApi,
  createPagedListResponseSchema,
  defaultCreateResponseSchema,
  defaultOkResponseSchema,
} from '../openapi'

const listSchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(50),
    search: z.string().optional(),
    status: z.enum(['draft', 'registered']).optional(),
    rpwNumber: z.string().optional(),
    rpwNumberContains: z.string().optional(),
    receivedFrom: z.string().optional(),
    receivedTo: z.string().optional(),
    receivingOrgUnitId: z.string().uuid().optional(),
    sortField: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
  })
  .passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['records.incoming_shipments.view'] },
  POST: { requireAuth: true, requireFeatures: ['records.incoming_shipments.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['records.incoming_shipments.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['records.incoming_shipments.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RecordsIncomingShipment,
    idField: 'id',
    orgField: 'organizationId',
    tenantField: 'tenantId',
    softDeleteField: 'deletedAt',
  },
  list: {
    schema: listSchema,
    fields: [
      'id',
      'organization_id',
      'tenant_id',
      'receiving_org_unit_id',
      'receiving_org_unit_symbol',
      'subject',
      'sender_id',
      'sender_display_name',
      'sender_anonymous',
      'delivery_method',
      'status',
      'received_at',
      'rpw_number',
      'rpw_sequence',
      'posted_at',
      'sender_reference',
      'remarks',
      'document_date',
      'document_sign',
      'access_level',
      'created_at',
      'updated_at',
    ],
    sortFieldMap: {
      receivedAt: 'received_at',
      rpwNumber: 'rpw_number',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    buildFilters: async (query: any) => {
      const filters: Record<string, any> = {}

      if (query.search) {
        filters.$or = [
          { subject: { $ilike: `%${escapeLikePattern(query.search)}%` } },
          { rpw_number: { $ilike: `%${escapeLikePattern(query.search)}%` } },
          { sender_display_name: { $ilike: `%${escapeLikePattern(query.search)}%` } },
        ]
      }

      if (query.status) {
        filters.status = { $eq: query.status }
      }

      if (query.rpwNumber) {
        filters.rpw_number = { $eq: query.rpwNumber }
      }

      if (query.rpwNumberContains) {
        filters.rpw_number = { $ilike: `%${escapeLikePattern(query.rpwNumberContains)}%` }
      }

      if (query.receivingOrgUnitId) {
        filters.receiving_org_unit_id = { $eq: query.receivingOrgUnitId }
      }

      const receivedRange: Record<string, Date> = {}
      if (query.receivedFrom) {
        const from = new Date(query.receivedFrom)
        if (!Number.isNaN(from.getTime())) receivedRange.$gte = from
      }
      if (query.receivedTo) {
        const to = new Date(query.receivedTo)
        if (!Number.isNaN(to.getTime())) receivedRange.$lte = to
      }
      if (Object.keys(receivedRange).length) {
        filters.received_at = receivedRange
      }

      return filters
    },
  },
  actions: {
    create: {
      commandId: 'records.incoming_shipments.create',
      schema: incomingShipmentCreateSchema,
      mapInput: async ({ parsed }) => {
        return {
          ...parsed,
          status: 'draft',
        }
      },
      response: ({ result }) => ({
        id: result?.id ?? null,
      }),
      status: 201,
    },
    update: {
      commandId: 'records.incoming_shipments.update',
      schema: incomingShipmentUpdateSchema,
      mapInput: async ({ parsed }) => {
        if (parsed.rpwNumber !== undefined || parsed.rpwSequence !== undefined) {
          throw new Error('Cannot modify RPW number or sequence. These fields are read-only once assigned.')
        }
        return parsed
      },
      response: () => ({ ok: true }),
    },
    delete: {
      commandId: 'records.incoming_shipments.delete',
      schema: z.object({ id: z.string().uuid() }),
      response: () => ({ ok: true }),
    },
  },
})

const { POST, PUT, DELETE } = crud

export { POST, PUT, DELETE }
export const GET = crud.GET

const shipmentListItemSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  receiving_org_unit_id: z.string().uuid().optional(),
  receiving_org_unit_symbol: z.string().optional(),
  subject: z.string().optional(),
  sender_id: z.string().uuid().nullable().optional(),
  sender_display_name: z.string().nullable().optional(),
  sender_anonymous: z.boolean().optional(),
  delivery_method: z.string().optional(),
  status: z.string().optional(),
  received_at: z.string().optional(),
  rpw_number: z.string().nullable().optional(),
  rpw_sequence: z.number().nullable().optional(),
  posted_at: z.string().nullable().optional(),
  sender_reference: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  document_date: z.string().nullable().optional(),
  document_sign: z.string().nullable().optional(),
  access_level: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const openApi = createRecordsCrudOpenApi({
  resourceName: 'IncomingShipment',
  pluralName: 'Incoming Shipments',
  querySchema: listSchema,
  listResponseSchema: createPagedListResponseSchema(shipmentListItemSchema),
  create: {
    schema: incomingShipmentCreateSchema,
    responseSchema: defaultCreateResponseSchema,
    description: 'Creates a new incoming shipment in draft status.',
  },
  update: {
    schema: incomingShipmentUpdateSchema,
    responseSchema: defaultOkResponseSchema,
    description: 'Updates an incoming shipment. RPW number cannot be modified once assigned.',
  },
  del: {
    schema: z.object({ id: z.string().uuid() }),
    responseSchema: defaultOkResponseSchema,
    description: 'Soft deletes an incoming shipment.',
  },
})
