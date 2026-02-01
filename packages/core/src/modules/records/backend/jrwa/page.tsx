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
import { Badge } from '@open-mercato/ui/primitives/badge'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'

type JRWAClassRow = {
  id: string
  code: string
  name: string
  description?: string | null
  retentionCategory?: string | null
  version: string
  isActive: boolean
}

type JRWAClassesResponse = {
  items?: JRWAClassRow[]
  total?: number
  totalPages?: number
}

const PAGE_SIZE = 20

export default function JrwaClassesPage() {
  const t = useT()
  const router = useRouter()

  const filters: FilterDef[] = [
    {
      id: 'version',
      label: t('records.jrwa.filter.version', 'Version'),
      type: 'text',
    },
    {
      id: 'isActive',
      label: t('records.jrwa.filter.isActive', 'Active'),
      type: 'select',
      options: [
        { value: 'true', label: t('common.yes', 'Yes') },
        { value: 'false', label: t('common.no', 'No') },
      ],
    },
    {
      id: 'search',
      label: t('records.jrwa.filter.search', 'Search'),
      type: 'text',
      placeholder: t('records.jrwa.filter.search', 'Search by code or name'),
    },
  ]

  const columns: ColumnDef<JRWAClassRow, any>[] = [
    {
      accessorKey: 'code',
      header: t('records.jrwa.field.code', 'Code'),
      cell: ({ row }) => (
        <Link 
          href={`/backend/records/jrwa/${row.original.id}`}
          className="text-primary hover:underline font-mono"
        >
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: 'name',
      header: t('records.jrwa.field.name', 'Name'),
    },
    {
      accessorKey: 'description',
      header: t('records.jrwa.field.description', 'Description'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs block">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'retentionCategory',
      header: t('records.jrwa.field.retentionCategory', 'Retention Category'),
      cell: ({ row }) => row.original.retentionCategory || '—',
    },
    {
      accessorKey: 'version',
      header: t('records.jrwa.field.version', 'Version'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.version}</span>,
    },
    {
      accessorKey: 'isActive',
      header: t('records.jrwa.field.isActive', 'Active'),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? t('common.yes', 'Yes') : t('common.no', 'No')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions', 'Actions'),
      cell: ({ row }) => (
        <RowActions
          items={[
            {
              label: t('records.jrwa.action.edit', 'Edit'),
              href: `/backend/records/jrwa/${row.original.id}`,
            },
            {
              label: t('records.jrwa.action.delete', 'Delete'),
              destructive: true,
              onSelect: async () => {
                const confirmed = window.confirm(
                  t('records.jrwa.confirm.delete', 'Are you sure?')
                )
                if (!confirmed) return

                try {
                  await deleteCrud(`/api/records/jrwa-classes`, row.original.id)
                  flash(t('records.jrwa.success.deleted', 'Deleted successfully'), 'success')
                  router.refresh()
                } catch {
                  flash(t('records.jrwa.error.delete', 'Failed to delete'), 'error')
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

    if (filters.version) {
      params.set('version', String(filters.version))
    }
    if (filters.isActive) {
      params.set('isActive', String(filters.isActive))
    }
    if (filters.search) {
      params.set('search', String(filters.search))
    }

    const response = await apiCall<JRWAClassesResponse>(`/api/records/jrwa-classes?${params}`)
    
    if (!response.ok || !response.result) {
      throw new Error('Failed to fetch JRWA classes')
    }

    return {
      items: response.result.items ?? [],
      total: response.result.total ?? 0,
      totalPages: response.result.totalPages ?? 0,
    }
  }

  return (
    <FeatureGuard id="records_jrwa_classes">
      <Page>
        <PageBody>
          <DataTable
            title={t('records.jrwa.page.title', 'JRWA Classes')}
            description={t('records.jrwa.page.description', 'Manage JRWA classification system')}
            columns={columns}
            fetchData={fetchData}
            filters={filters}
            pageSize={PAGE_SIZE}
            actions={
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/backend/records/jrwa/import">
                    {t('records.jrwa.action.import', 'Import CSV')}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/backend/records/jrwa/create">
                    {t('records.jrwa.action.create', 'Create Class')}
                  </Link>
                </Button>
              </div>
            }
          />
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}
