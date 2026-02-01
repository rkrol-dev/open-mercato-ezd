"use client"

import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import type { FilterDef, FilterValues } from '@open-mercato/ui/backend/FilterBar'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@open-mercato/ui/primitives/dialog'

type SyncLogRow = {
  id: string
  sourceId: string
  sourceName?: string
  startedAt: Date
  completedAt?: Date | null
  status: string
  itemsFetched: number
  itemsCreated: number
  itemsFailed: number
  errorMessage?: string | null
}

type SyncLogsResponse = {
  items?: SyncLogRow[]
  total?: number
  totalPages?: number
}

type SourcesResponse = {
  items?: Array<{ id: string; name: string }>
}

const PAGE_SIZE = 20

export default function SyncLogsPage() {
  const t = useT()
  const [data, setData] = React.useState<SyncLogRow[]>([])
  const [sources, setSources] = React.useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [filterValues, setFilterValues] = React.useState<FilterValues>({})
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [selectedLog, setSelectedLog] = React.useState<SyncLogRow | null>(null)

  React.useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await apiCall<SourcesResponse>('/api/correspondence-sources/sources?pageSize=100')
        if (response.ok && response.result?.items) {
          setSources(response.result.items)
        }
      } catch (err) {
        console.error('Failed to fetch sources:', err)
      }
    }

    fetchSources()
  }, [])

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('pageSize', String(PAGE_SIZE))
        params.set('sortField', 'startedAt')
        params.set('sortDir', 'desc')

        if (filterValues.sourceId) {
          params.set('sourceId', String(filterValues.sourceId))
        }
        if (filterValues.status) {
          params.set('status', String(filterValues.status))
        }

        const response = await apiCall<SyncLogsResponse>(`/api/correspondence-sources/sync-logs?${params}`)
        
        if (!response.ok || !response.result) {
          throw new Error('Failed to fetch sync logs')
        }

        const logs = response.result.items ?? []
        const enrichedLogs = logs.map(log => ({
          ...log,
          sourceName: sources.find(s => s.id === log.sourceId)?.name || log.sourceId,
        }))

        setData(enrichedLogs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filterValues, refreshKey, sources])

  const filters: FilterDef[] = [
    {
      id: 'sourceId',
      label: t('correspondenceSources.syncLogs.filter.sourceId', 'Source'),
      type: 'select',
      options: sources.map(source => ({
        value: source.id,
        label: source.name,
      })),
    },
    {
      id: 'status',
      label: t('correspondenceSources.syncLogs.filter.status', 'Status'),
      type: 'select',
      options: [
        { value: 'in_progress', label: t('correspondenceSources.syncLogs.status.in_progress', 'In Progress') },
        { value: 'completed', label: t('correspondenceSources.syncLogs.status.completed', 'Completed') },
        { value: 'failed', label: t('correspondenceSources.syncLogs.status.failed', 'Failed') },
      ],
    },
  ]

  const columns: ColumnDef<SyncLogRow, any>[] = [
    {
      accessorKey: 'sourceName',
      header: t('correspondenceSources.syncLogs.field.sourceName', 'Source Name'),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.sourceName}</span>
      ),
    },
    {
      accessorKey: 'startedAt',
      header: t('correspondenceSources.syncLogs.field.startedAt', 'Started At'),
      cell: ({ row }) => new Date(row.original.startedAt).toLocaleString(),
    },
    {
      accessorKey: 'completedAt',
      header: t('correspondenceSources.syncLogs.field.completedAt', 'Completed At'),
      cell: ({ row }) => {
        if (!row.original.completedAt) return '—'
        return new Date(row.original.completedAt).toLocaleString()
      },
    },
    {
      accessorKey: 'status',
      header: t('correspondenceSources.syncLogs.field.status', 'Status'),
      cell: ({ row }) => {
        const status = row.original.status
        let variant: 'default' | 'secondary' | 'destructive' = 'default'
        
        if (status === 'completed') variant = 'default'
        else if (status === 'failed') variant = 'destructive'
        else variant = 'secondary'

        return (
          <Badge variant={variant}>
            {t(`correspondenceSources.syncLogs.status.${status}`, status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'itemsFetched',
      header: t('correspondenceSources.syncLogs.field.itemsFetched', 'Items Fetched'),
      cell: ({ row }) => row.original.itemsFetched,
    },
    {
      accessorKey: 'itemsCreated',
      header: t('correspondenceSources.syncLogs.field.itemsCreated', 'Items Created'),
      cell: ({ row }) => (
        <span className="text-green-600 font-medium">{row.original.itemsCreated}</span>
      ),
    },
    {
      accessorKey: 'itemsFailed',
      header: t('correspondenceSources.syncLogs.field.itemsFailed', 'Items Failed'),
      cell: ({ row }) => (
        <span className={row.original.itemsFailed > 0 ? 'text-red-600 font-medium' : ''}>
          {row.original.itemsFailed}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions', 'Actions'),
      cell: ({ row }) => (
        <RowActions
          items={[
            {
              label: t('correspondenceSources.syncLogs.action.viewDetails', 'View Details'),
              onSelect: () => setSelectedLog(row.original),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <FeatureGuard id="correspondence_sources">
      <Page>
        <PageBody>
          <DataTable
            title={t('correspondenceSources.syncLogs.page.title', 'Synchronization Logs')}
            columns={columns}
            data={data}
            isLoading={loading}
            error={error}
            filters={filters}
            filterValues={filterValues}
            onFiltersApply={(values) => setFilterValues(values)}
            onFiltersClear={() => setFilterValues({})}
          />
        </PageBody>
      </Page>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('correspondenceSources.syncLogs.action.viewDetails', 'View Details')}
            </DialogTitle>
            <DialogDescription>
              Sync log details for {selectedLog?.sourceName}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.syncLogs.field.startedAt', 'Started At')}
                  </p>
                  <p className="text-sm">{new Date(selectedLog.startedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.syncLogs.field.completedAt', 'Completed At')}
                  </p>
                  <p className="text-sm">
                    {selectedLog.completedAt ? new Date(selectedLog.completedAt).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.syncLogs.field.status', 'Status')}
                  </p>
                  <p className="text-sm font-semibold">{selectedLog.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.syncLogs.field.itemsFetched', 'Items Fetched')}
                  </p>
                  <p className="text-sm font-semibold">{selectedLog.itemsFetched}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.syncLogs.field.itemsCreated', 'Items Created')}
                  </p>
                  <p className="text-sm font-semibold text-green-600">{selectedLog.itemsCreated}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.syncLogs.field.itemsFailed', 'Items Failed')}
                  </p>
                  <p className="text-sm font-semibold text-red-600">{selectedLog.itemsFailed}</p>
                </div>
              </div>
              {selectedLog.errorMessage && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {t('correspondenceSources.syncLogs.field.errorMessage', 'Error Message')}
                  </p>
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </FeatureGuard>
  )
}

