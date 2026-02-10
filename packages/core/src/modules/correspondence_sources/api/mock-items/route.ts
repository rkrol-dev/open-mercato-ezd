import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['correspondence_sources.manage'] },
  POST: { requireAuth: true, requireFeatures: ['correspondence_sources.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['correspondence_sources.manage'] },
}

const mockItemSchema = z.object({
  subject: z.string().min(1),
  senderName: z.string().min(1),
  senderEmail: z.string().email(),
  postedDate: z.string(),
})

// In-memory storage (would be database in production)
const mockItems: Array<{
  id: string
  subject: string
  senderName: string
  senderEmail: string
  postedDate: string
  createdAt: Date
}> = []

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      items: mockItems.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      total: mockItems.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch mock items' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = mockItemSchema.parse(body)

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...validated,
      createdAt: new Date(),
    }

    mockItems.push(newItem)

    return NextResponse.json({
      item: {
        ...newItem,
        createdAt: newItem.createdAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create mock item' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      // Delete single item
      const index = mockItems.findIndex(item => item.id === id)
      if (index === -1) {
        return NextResponse.json(
          { error: 'Mock item not found' },
          { status: 404 }
        )
      }
      mockItems.splice(index, 1)
    } else {
      // Clear all items
      mockItems.length = 0
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete mock items' },
      { status: 500 }
    )
  }
}

// Export for mock adapter to consume
export function consumeMockItems(): Array<{
  id: string
  subject: string
  senderName: string
  senderEmail: string
  postedDate: string
}> {
  const items = [...mockItems]
  // Clear consumed items
  mockItems.length = 0
  return items.map(item => ({
    id: item.id,
    subject: item.subject,
    senderName: item.senderName,
    senderEmail: item.senderEmail,
    postedDate: item.postedDate,
  }))
}

export const openApi = {
  get: {
    summary: 'List mock correspondence items',
    operationId: 'listMockCorrespondenceItems',
    tags: ['Correspondence Sources - Mock'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      subject: { type: 'string' },
                      senderName: { type: 'string' },
                      senderEmail: { type: 'string' },
                      postedDate: { type: 'string' },
                      createdAt: { type: 'string' },
                    },
                  },
                },
                total: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
  post: {
    summary: 'Create mock correspondence item',
    operationId: 'createMockCorrespondenceItem',
    tags: ['Correspondence Sources - Mock'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['subject', 'senderName', 'senderEmail', 'postedDate'],
            properties: {
              subject: { type: 'string' },
              senderName: { type: 'string' },
              senderEmail: { type: 'string', format: 'email' },
              postedDate: { type: 'string', format: 'date' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                item: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    subject: { type: 'string' },
                    senderName: { type: 'string' },
                    senderEmail: { type: 'string' },
                    postedDate: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  delete: {
    summary: 'Delete mock correspondence item(s)',
    operationId: 'deleteMockCorrespondenceItems',
    tags: ['Correspondence Sources - Mock'],
    parameters: [
      {
        name: 'id',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Item ID to delete. If not provided, all items will be cleared.',
      },
    ],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
}
