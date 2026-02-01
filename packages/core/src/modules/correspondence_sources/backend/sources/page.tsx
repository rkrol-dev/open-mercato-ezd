"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import type { FilterDef, FilterValues } from '@open-mercato/ui/backend/FilterBar'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { deleteCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { Button } from '@open-mercato/ui/primitives/button'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'
import { SourceStatusBadge } from '../../../components/SourceStatusBadge'
import { SyncButton } from '../../../components/SyncButton'

type CorrespondenceSourceRow = {
  id: string
  name: string
  sourceType: 'edoreczenia-mock' | 'epuap' | 'email'
  isActive: boolean
  lastSyncDate?: Date | null
}

type CorrespondenceSourcesResponse = {
  items?: CorrespondenceSourceRow[]
  total?: number
  totalPages?: number
}

const PAGE_SIZE = 20

export default function CorrespondenceSourcesPage() {
  const t = useT()
  const router = useRouter()
  const [data, setData] = React.useState<CorrespondenceSourceRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [filterValues, setFilterValues] = React.useState<FilterValues>({})
  const [searchValue, setSearchValue] = React.useState('')
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('pageSize', String(PAGE_SIZE))

        if (filterValues.sourceType) {
          params.set('sourceType', String(filterValues.sourceType))
        }
        if (filterValues.isActive !== undefined) {
          params.set('isActive', String(filterValues.isActive))
        }
        if (searchValue) {
          params.set('search', searchValue)
        }

        const response = await apiCall<CorrespondenceSourcesResponse>(`/api/correspondence-sources/sources?${params}`)
        
        if (!response.ok || !response.result) {
          throw new Error('Failed to fetch correspondence sources')
        }

        setData(response.result.items ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filterValues, searchValue, refreshKey])

  const filters: FilterDef[] = [
    {
      id: 'sourceType',
      label: t('correspondenceSources.sources.filter.sourceType', 'Source Type'),
      type: 'select',
      options: [
        { value: 'edoreczenia-mock', label: t('correspondenceSources.sources.sourceType.edoreczenia-mock', 'eDoreczenia (Mock)') },
        { value: 'epuap', label: t('correspondenceSources.sources.sourceType.epuap', 'ePUAP') },
        { value: 'email', label: t('correspondenceSources.sources.sourceType.email', 'Email (IMAP)') },
      ],
    },
    {
      id: 'isActive',
      label: t('correspondenceSources.sources.filter.isActive', 'Status'),
      type: 'select',
      options: [
        { value: 'true', label: t('correspondenceSources.sources.status.active', 'Active') },
        { value: 'false', label: t('correspondenceSources.sources.status.inactive', 'Inactive') },
      ],
    },
  ]

  const columns: ColumnDef<CorrespondenceSourceRow, any>[] = [
    {
      accessorKey: 'name',
      header: t('correspondenceSources.sources.field.name', 'Name'),
      cell: ({ row }) => (
        <Link 
          href={`/backend/correspondence-sources/sources/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'sourceType',
      header: t('correspondenceSources.sources.field.sourceType', 'Source Type'),
      cell: ({ row }) => {
        const sourceType = row.original.sourceType
        return t(`correspondenceSources.sources.sourceType.${sourceType}`, sourceType)
      },
    },
    {
      accessorKey: 'isActive',
      header: t('correspondenceSources.sources.field.isActive', 'Active'),
      cell: ({ row }) => <SourceStatusBadge isActive={row.original.isActive} />,
    },
    {
      accessorKey: 'lastSyncDate',
      header: t('correspondenceSources.sources.field.lastSyncDate', 'Last Sync Date'),
      cell: ({ row }) => {
        if (!row.original.lastSyncDate) return '—'
        return new Date(row.original.lastSyncDate).toLocaleString()
      },
    },
    {
      id: 'actions',
      header: t('common.actions', 'Actions'),
      cell: ({ row }) => (
        <div className="flex gap-2">
          <SyncButton 
            sourceId={row.original.id}
            sourceName={row.original.name}
            onSyncComplete={() => setRefreshKey(prev => prev + 1)}
            variant="outline"
            size="sm"
          />
          <RowActions
            items={[
              {
                label: t('correspondenceSources.sources.action.edit', 'Edit'),
                href: `/backend/correspondence-sources/sources/${row.original.id}`,
              },
              {
                label: t('correspondenceSources.sources.action.delete', 'Delete'),
                destructive: true,
                onSelect: async () => {
                  const confirmed = window.confirm(
                    t('correspondenceSources.sources.confirm.delete', 'Are you sure?')
                  )
                  if (!confirmed) return

                  try {
                    await deleteCrud(`/api/correspondence-sources/sources`, row.original.id)
                    flash(t('correspondenceSources.sources.success.deleted', 'Deleted successfully'), 'success')
                    setRefreshKey(prev => prev + 1)
                  } catch {
                    flash(t('correspondenceSources.sources.error.delete', 'Failed to delete'), 'error')
                  }
                },
              },
            ]}
          />
        </div>
      ),
    },
  ]

  return (
    <FeatureGuard id="correspondence_sources">
      <Page>
        <PageBody>
          <DataTable
            title={t('correspondenceSources.sources.page.title', 'Correspondence Sources')}
            columns={columns}
            data={data}
            isLoading={loading}
            error={error}
            filters={filters}
            filterValues={filterValues}
            onFiltersApply={(values) => setFilterValues(values)}
            onFiltersClear={() => setFilterValues({})}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder={t('correspondenceSources.sources.filter.search', 'Search by name')}
            actions={
              <Button asChild>
                <Link href="/backend/correspondence-sources/sources/create">
                  {t('correspondenceSources.sources.action.create', 'Create Source')}
                </Link>
              </Button>
            }
          />
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}
