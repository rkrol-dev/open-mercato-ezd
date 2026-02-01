"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import type { FilterDef } from '@open-mercato/ui/backend/FilterBar'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { deleteCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { Button } from '@open-mercato/ui/primitives/button'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'
import { IncomingShipmentStatusBadge } from '../../components/IncomingShipmentStatusBadge'

type IncomingShipmentRow = {
  id: string
  rpwNumber?: string | null
  subject: string
  senderDisplayName?: string | null
  receivedAt: string
  status: 'draft' | 'registered'
  registeredAt?: string | null
}

type IncomingShipmentsResponse = {
  items?: IncomingShipmentRow[]
  total?: number
  totalPages?: number
}

const PAGE_SIZE = 20

export default function IncomingShipmentsPage() {
  const t = useT()
  const router = useRouter()

  const filters: FilterDef[] = [
    {
      id: 'status',
      label: t('records.incomingShipments.filter.status', 'Status'),
      type: 'select',
      options: [
        { value: 'draft', label: t('records.incomingShipments.status.draft', 'Draft') },
        { value: 'registered', label: t('records.incomingShipments.status.registered', 'Registered') },
      ],
    },
    {
      id: 'search',
      label: t('records.incomingShipments.filter.search', 'Search'),
      type: 'text',
      placeholder: t('records.incomingShipments.filter.search', 'Search by subject or RPW number'),
    },
  ]

  const columns: ColumnDef<IncomingShipmentRow, any>[] = [
    {
      accessorKey: 'rpwNumber',
      header: t('records.incomingShipments.field.rpwNumber', 'RPW Number'),
      cell: ({ row }) => row.original.rpwNumber || '—',
    },
    {
      accessorKey: 'subject',
      header: t('records.incomingShipments.field.subject', 'Subject'),
      cell: ({ row }) => (
        <Link 
          href={`/backend/records/incoming-shipments/${row.original.id}`}
          className="text-primary hover:underline"
        >
          {row.original.subject}
        </Link>
      ),
    },
    {
      accessorKey: 'senderDisplayName',
      header: t('records.incomingShipments.field.senderDisplayName', 'Sender'),
      cell: ({ row }) => row.original.senderDisplayName || '—',
    },
    {
      accessorKey: 'receivedAt',
      header: t('records.incomingShipments.field.receivedAt', 'Received At'),
      cell: ({ row }) => new Date(row.original.receivedAt).toLocaleDateString(),
    },
    {
      accessorKey: 'status',
      header: t('records.incomingShipments.field.status', 'Status'),
      cell: ({ row }) => <IncomingShipmentStatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: t('common.actions', 'Actions'),
      cell: ({ row }) => (
        <RowActions
          items={[
            {
              label: t('records.incomingShipments.action.edit', 'Edit'),
              href: `/backend/records/incoming-shipments/${row.original.id}`,
            },
            {
              label: t('records.incomingShipments.action.delete', 'Delete'),
              destructive: true,
              onSelect: async () => {
                const confirmed = window.confirm(
                  t('records.incomingShipments.confirm.delete', 'Are you sure?')
                )
                if (!confirmed) return

                try {
                  await deleteCrud(`/api/records/incoming-shipments`, row.original.id)
                  flash(t('records.incomingShipments.success.deleted', 'Deleted successfully'), 'success')
                  router.refresh()
                } catch {
                  flash(t('records.incomingShipments.error.delete', 'Failed to delete'), 'error')
                }
              },
            },
          ]}
        />
      ),
    },
  ]

  const fetchData = async (page: number, pageSize: number, filters: Record<string, unknown>) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))

    if (filters.status) {
      params.set('status', String(filters.status))
    }
    if (filters.search) {
      params.set('search', String(filters.search))
    }

    const response = await apiCall<IncomingShipmentsResponse>(`/api/records/incoming-shipments?${params}`)
    
    if (!response.ok || !response.result) {
      throw new Error('Failed to fetch shipments')
    }

    return {
      items: response.result.items ?? [],
      total: response.result.total ?? 0,
      totalPages: response.result.totalPages ?? 0,
    }
  }

  return (
    <FeatureGuard id="records_incoming_shipments">
      <Page>
        <PageBody>
          <DataTable
            title={t('records.incomingShipments.page.title', 'Incoming Shipments')}
            description={t('records.incomingShipments.page.description', 'Manage incoming correspondence')}
            columns={columns}
            fetchData={fetchData}
            filters={filters}
            pageSize={PAGE_SIZE}
            actions={
              <Button asChild>
                <Link href="/backend/records/incoming-shipments/create">
                  {t('records.incomingShipments.action.create', 'Create Shipment')}
                </Link>
              </Button>
            }
          />
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}
