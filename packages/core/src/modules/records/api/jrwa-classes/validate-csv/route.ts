import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { JrwaImportService } from '../../../services/JrwaImportService'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { getAuthFromRequest } from '@open-mercato/shared/lib/auth/server'
import { jrwaValidateCsvRequestSchema } from '../../../data/validators'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['records.jrwa_classes.import'] },
}

export async function POST(request: NextRequest) {
  try {
    const container = await createRequestContainer()
    const auth = await getAuthFromRequest(request)

    if (!auth?.orgId || !auth?.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = jrwaValidateCsvRequestSchema.parse(body)

    const em = container.resolve('em')
    const service = new JrwaImportService(em)

    const result = service.parseAndValidateCsv(validated.csvData)

    return NextResponse.json(result)
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}

const validationResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).optional(),
  rowCount: z.number().optional(),
  warnings: z.array(z.string()).optional(),
})

export const openApi: OpenApiRouteDoc = {
  methods: {
    POST: {
      summary: 'Validate JRWA CSV',
      description: 'Validates CSV data for JRWA class import without actually importing. Returns validation result with errors and warnings.',
      operationId: 'validateJrwaCsv',
      tags: ['Records'],
      requestBody: {
        contentType: 'application/json',
        schema: jrwaValidateCsvRequestSchema,
      },
      responses: [
        {
          status: 200,
          description: 'Validation result',
          schema: validationResponseSchema,
        },
        {
          status: 400,
          description: 'Invalid request',
        },
      ],
    },
  },
}
