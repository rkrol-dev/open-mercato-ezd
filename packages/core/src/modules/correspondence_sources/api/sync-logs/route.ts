/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CorrespondenceSyncLog } from '../../data/entities'
import {
  createCorrespondenceSourcesCrudOpenApi,
  createPagedListResponseSchema,
} from '../openapi'

const listSchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(50),
    sourceId: z.string().uuid().optional(),
    status: z.enum(['in_progress', 'completed', 'failed']).optional(),
    startedFrom: z.string().optional(),
    startedTo: z.string().optional(),
    sortField: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
  })
  .passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['correspondence_sources.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CorrespondenceSyncLog,
    idField: 'id',
    orgField: 'organizationId',
    tenantField: 'tenantId',
  },
  list: {
    schema: listSchema,
    fields: [
      'id',
      'organization_id',
      'tenant_id',
      'source_id',
      'started_at',
      'completed_at',
      'status',
      'items_fetched',
      'items_created',
      'items_failed',
      'error_message',
      'created_at',
    ],
    sortFieldMap: {
      startedAt: 'started_at',
      completedAt: 'completed_at',
      status: 'status',
      createdAt: 'created_at',
    },
    buildFilters: async (query: any) => {
      const filters: Record<string, any> = {}

      if (query.sourceId) {
        filters.source_id = { $eq: query.sourceId }
      }

      if (query.status) {
        filters.status = { $eq: query.status }
      }

      const startedRange: Record<string, Date> = {}
      if (query.startedFrom) {
        const from = new Date(query.startedFrom)
        if (!Number.isNaN(from.getTime())) startedRange.$gte = from
      }
      if (query.startedTo) {
        const to = new Date(query.startedTo)
        if (!Number.isNaN(to.getTime())) startedRange.$lte = to
      }
      if (Object.keys(startedRange).length) {
        filters.started_at = startedRange
      }

      return filters
    },
  },
  actions: {},
})

export const { GET } = crud

const syncLogSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  sourceId: z.string().uuid(),
  startedAt: z.date(),
  completedAt: z.date().nullable(),
  status: z.string(),
  itemsFetched: z.number(),
  itemsCreated: z.number(),
  itemsFailed: z.number(),
  errorMessage: z.string().nullable(),
  createdAt: z.date(),
})

export const openApi = createCorrespondenceSourcesCrudOpenApi({
  resourceName: 'CorrespondenceSyncLog',
  pluralName: 'CorrespondenceSyncLogs',
  querySchema: listSchema,
  listResponseSchema: createPagedListResponseSchema(syncLogSchema),
})
