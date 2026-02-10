/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RecordsJrwaClass } from '../../data/entities'
import { jrwaClassCreateSchema, jrwaClassUpdateSchema } from '../../data/validators'
import { escapeLikePattern } from '@open-mercato/shared/lib/db/escapeLikePattern'
import { parseBooleanToken } from '@open-mercato/shared/lib/boolean'
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
    version: z.coerce.number().int().min(1).optional(),
    isActive: z.string().optional(),
    code: z.string().optional(),
    codeStartsWith: z.string().optional(),
    parentId: z.string().uuid().optional(),
    retentionCategory: z.enum(['A', 'B', 'BE', 'Bc']).optional(),
    sortField: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
  })
  .passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['records.jrwa_classes.view'] },
  POST: { requireAuth: true, requireFeatures: ['records.jrwa_classes.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['records.jrwa_classes.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['records.jrwa_classes.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RecordsJrwaClass,
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
      'code',
      'name',
      'description',
      'parent_id',
      'retention_years',
      'retention_category',
      'archival_package_variant',
      'version',
      'is_active',
      'created_at',
      'updated_at',
    ],
    sortFieldMap: {
      code: 'code',
      name: 'name',
      version: 'version',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    buildFilters: async (query: any) => {
      const filters: Record<string, any> = {}

      if (query.search) {
        filters.$or = [
          { code: { $ilike: `%${escapeLikePattern(query.search)}%` } },
          { name: { $ilike: `%${escapeLikePattern(query.search)}%` } },
        ]
      }

      if (query.version !== undefined) {
        filters.version = { $eq: query.version }
      }

      const isActive = parseBooleanToken(query.isActive)
      if (isActive !== null) {
        filters.is_active = { $eq: isActive }
      }

      if (query.code) {
        filters.code = { $eq: query.code }
      }

      if (query.codeStartsWith) {
        filters.code = { $ilike: `${escapeLikePattern(query.codeStartsWith)}%` }
      }

      if (query.parentId !== undefined) {
        if (query.parentId === 'null' || query.parentId === '') {
          filters.parent_id = { $eq: null }
        } else {
          filters.parent_id = { $eq: query.parentId }
        }
      }

      if (query.retentionCategory) {
        filters.retention_category = { $eq: query.retentionCategory }
      }

      return filters
    },
  },
  actions: {
    create: {
      commandId: 'records.jrwa_classes.create',
      schema: jrwaClassCreateSchema,
      response: ({ result }) => ({
        id: result?.id ?? null,
      }),
      status: 201,
    },
    update: {
      commandId: 'records.jrwa_classes.update',
      schema: jrwaClassUpdateSchema,
      response: () => ({ ok: true }),
    },
    delete: {
      commandId: 'records.jrwa_classes.delete',
      schema: z.object({ id: z.string().uuid() }),
      response: () => ({ ok: true }),
    },
  },
})

const { POST, PUT, DELETE } = crud

export { POST, PUT, DELETE }
export const GET = crud.GET

const jrwaClassListItemSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  retention_years: z.number().nullable().optional(),
  retention_category: z.string().nullable().optional(),
  archival_package_variant: z.string().nullable().optional(),
  version: z.number().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const openApi = createRecordsCrudOpenApi({
  resourceName: 'JrwaClass',
  pluralName: 'JRWA Classes',
  querySchema: listSchema,
  listResponseSchema: createPagedListResponseSchema(jrwaClassListItemSchema),
  create: {
    schema: jrwaClassCreateSchema,
    responseSchema: defaultCreateResponseSchema,
    description: 'Creates a new JRWA classification class.',
  },
  update: {
    schema: jrwaClassUpdateSchema,
    responseSchema: defaultOkResponseSchema,
    description: 'Updates a JRWA classification class.',
  },
  del: {
    schema: z.object({ id: z.string().uuid() }),
    responseSchema: defaultOkResponseSchema,
    description: 'Soft deletes a JRWA classification class.',
  },
})
