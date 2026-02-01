import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { CorrespondenceSyncService } from '../../../../services/CorrespondenceSyncService'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { getAuthFromRequest } from '@open-mercato/shared/lib/auth/server'
import type { EntityManager } from '@mikro-orm/postgresql'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['correspondence_sources.sync'] },
}

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const container = await createRequestContainer()
    const auth = await getAuthFromRequest(request)

    if (!auth?.orgId || !auth?.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const id = params.id

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid source ID' },
        { status: 400 }
      )
    }

    const em = container.resolve<EntityManager>('em')
    const service = new CorrespondenceSyncService(em)

    const result = await service.syncSource(
      id,
      auth.orgId,
      auth.tenantId
    )

    return NextResponse.json(result)
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}

const syncResponseSchema = z.object({
  syncLogId: z.string().uuid(),
  itemsFetched: z.number(),
  itemsCreated: z.number(),
  itemsFailed: z.number(),
  status: z.string(),
})

export const openApi = {
  methods: {
    POST: {
      summary: 'Synchronize correspondence source',
      description: 'Triggers a synchronization of the correspondence source, fetching new items and creating incoming shipments. Returns a sync log with results.',
      tags: ['Correspondence Sources'],
      params: z.object({
        id: z.string().uuid(),
      }),
      responses: [
        {
          status: 200,
          description: 'Synchronization completed successfully',
          schema: syncResponseSchema,
        },
        {
          status: 400,
          description: 'Invalid request or source is not active',
        },
        {
          status: 404,
          description: 'Correspondence source not found',
        },
      ],
    },
  },
}
