import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { IncomingShipmentService } from '../../../../services/IncomingShipmentService'
import type { RequestContext } from '@open-mercato/shared/lib/api/context'
import { incomingShipmentRegisterSchema } from '../../../../data/validators'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['records.incoming_shipments.register'] },
}

export async function POST(request: NextRequest, context: RequestContext) {
  try {
    const container = context.container
    const auth = context.auth

    if (!auth?.organizationId || !auth?.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const params = await context.params
    const id = params?.id

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid shipment ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = incomingShipmentRegisterSchema.parse({
      id,
      organizationId: auth.organizationId,
      tenantId: auth.tenantId,
      ...body,
    })

    const em = container.resolve('em')
    const service = new IncomingShipmentService(em)

    const shipment = await service.registerShipment(
      validated.id,
      validated.organizationId,
      validated.tenantId
    )

    return NextResponse.json({
      id: shipment.id,
      rpwNumber: shipment.rpwNumber,
      rpwSequence: shipment.rpwSequence,
      status: shipment.status,
    })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}

const registerResponseSchema = z.object({
  id: z.string().uuid(),
  rpwNumber: z.string(),
  rpwSequence: z.number(),
  status: z.string(),
})

export const openApi: OpenApiRouteDoc = {
  POST: {
    summary: 'Register incoming shipment',
    description: 'Registers an incoming shipment by assigning an RPW number and changing status to registered. Only draft shipments can be registered.',
    operationId: 'registerIncomingShipment',
    tags: ['Records'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Incoming shipment ID',
      },
    ],
    requestBody: {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {},
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Shipment successfully registered with RPW number',
        content: {
          'application/json': {
            schema: registerResponseSchema,
          },
        },
      },
      '400': {
        description: 'Invalid request or shipment cannot be registered (not in draft status)',
      },
      '404': {
        description: 'Incoming shipment not found',
      },
    },
  },
}
