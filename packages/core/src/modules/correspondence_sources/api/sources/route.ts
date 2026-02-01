/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CorrespondenceSource } from '../../data/entities'
import {
  correspondenceSourceCreateSchema,
  correspondenceSourceUpdateSchema,
  validateSourceConfig,
} from '../../data/validators'
import { escapeLikePattern } from '@open-mercato/shared/lib/db/escapeLikePattern'
import {
  createCorrespondenceSourcesCrudOpenApi,
  createPagedListResponseSchema,
  defaultCreateResponseSchema,
  defaultOkResponseSchema,
} from '../openapi'

const listSchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(50),
    search: z.string().optional(),
    sourceType: z.enum(['edoreczenia-mock', 'epuap', 'email']).optional(),
    isActive: z.coerce.boolean().optional(),
    sortField: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
  })
  .passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['correspondence_sources.manage'] },
  POST: { requireAuth: true, requireFeatures: ['correspondence_sources.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['correspondence_sources.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['correspondence_sources.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CorrespondenceSource,
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
      'name',
      'source_type',
      'config',
      'is_active',
      'last_sync_date',
      'default_receiving_org_unit_id',
      'default_receiving_org_unit_symbol',
      'created_at',
      'updated_at',
    ],
    sortFieldMap: {
      name: 'name',
      sourceType: 'source_type',
      isActive: 'is_active',
      lastSyncDate: 'last_sync_date',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    buildFilters: async (query: any) => {
      const filters: Record<string, any> = {}

      if (query.search) {
        filters.name = { $ilike: `%${escapeLikePattern(query.search)}%` }
      }

      if (query.sourceType) {
        filters.source_type = { $eq: query.sourceType }
      }

      if (query.isActive !== undefined) {
        filters.is_active = { $eq: query.isActive }
      }

      return filters
    },
  },
  actions: {
    create: {
      commandId: 'correspondence_sources.create',
      schema: correspondenceSourceCreateSchema,
      mapInput: async ({ parsed }) => {
        try {
          validateSourceConfig(parsed.sourceType, parsed.config)
        } catch (error: any) {
          throw new Error(`Invalid configuration for source type "${parsed.sourceType}": ${error.message}`)
        }
        return {
          ...parsed,
          isActive: parsed.isActive ?? true,
        }
      },
      response: ({ result }) => ({
        id: result?.id ?? null,
      }),
      status: 201,
    },
    update: {
      commandId: 'correspondence_sources.update',
      schema: correspondenceSourceUpdateSchema,
      mapInput: async ({ parsed }) => {
        if (parsed.sourceType && parsed.config) {
          try {
            validateSourceConfig(parsed.sourceType, parsed.config)
          } catch (error: any) {
            throw new Error(`Invalid configuration for source type "${parsed.sourceType}": ${error.message}`)
          }
        }
        return parsed
      },
      response: () => ({ ok: true }),
      status: 200,
    },
    delete: {
      commandId: 'correspondence_sources.delete',
      response: () => ({ ok: true }),
      status: 200,
    },
  },
})

export const { GET, POST, PUT, DELETE } = crud

const correspondenceSourceSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  sourceType: z.enum(['edoreczenia-mock', 'epuap', 'email']),
  config: z.record(z.any()),
  isActive: z.boolean(),
  lastSyncDate: z.date().nullable(),
  defaultReceivingOrgUnitId: z.string().uuid().nullable(),
  defaultReceivingOrgUnitSymbol: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const openApi = createCorrespondenceSourcesCrudOpenApi({
  resourceName: 'CorrespondenceSource',
  pluralName: 'CorrespondenceSources',
  querySchema: listSchema,
  listResponseSchema: createPagedListResponseSchema(correspondenceSourceSchema),
  create: {
    schema: correspondenceSourceCreateSchema,
    responseSchema: defaultCreateResponseSchema,
    status: 201,
  },
  update: {
    schema: correspondenceSourceUpdateSchema,
    responseSchema: defaultOkResponseSchema,
  },
  del: {
    responseSchema: defaultOkResponseSchema,
  },
})
