import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { JrwaImportService } from '../../../services/JrwaImportService'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { getAuthFromRequest } from '@open-mercato/shared/lib/auth/server'
import { jrwaImportRequestSchema } from '../../../data/validators'
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
    const validated = jrwaImportRequestSchema.parse({
      organizationId: auth.orgId,
      tenantId: auth.tenantId,
      ...body,
    })

    const em = container.resolve('em')
    const service = new JrwaImportService(em)

    const result = await service.importClasses(
      validated.organizationId,
      validated.tenantId,
      validated.version,
      validated.csvData
    )

    return NextResponse.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
    })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Internal server error'
    const details = error.details || undefined
    return NextResponse.json({ error: message, details }, { status })
  }
}

const importResponseSchema = z.object({
  success: z.boolean(),
  imported: z.number(),
  skipped: z.number(),
})

export const openApi: OpenApiRouteDoc = {
  methods: {
    POST: {
      summary: 'Import JRWA classes from CSV',
      description: 'Imports JRWA classification classes from CSV data. The import is atomic - all records are imported or none are. CSV format: code, name, description, parentCode, retentionYears, retentionCategory, archivalPackageVariant.',
      operationId: 'importJrwaClasses',
      tags: ['Records'],
      requestBody: {
        contentType: 'application/json',
        schema: jrwaImportRequestSchema,
      },
      responses: [
        {
          status: 200,
          description: 'CSV successfully imported',
          schema: importResponseSchema,
        },
        {
          status: 400,
          description: 'Invalid CSV format or validation errors',
          schema: z.object({
            error: z.string(),
            details: z.array(z.string()).optional(),
          }),
        },
      ],
    },
  },
}
