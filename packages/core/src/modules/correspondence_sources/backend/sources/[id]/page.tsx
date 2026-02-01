"use client"

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudField } from '@open-mercato/ui/backend/CrudForm'
import { apiCallOrThrow, readApiResultOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'
import { getConfigFields } from '../../../components/SourceConfigForm'
import { SyncButton } from '../../../components/SyncButton'
import { Badge } from '@open-mercato/ui/primitives/badge'

type CorrespondenceSourceFormValues = {
  name: string
  sourceType: 'edoreczenia-mock' | 'epuap' | 'email'
  isActive?: boolean
  config: Record<string, any>
  defaultReceivingOrgUnitId?: string
  defaultReceivingOrgUnitSymbol?: string
  lastSyncDate?: Date | null
}

export default function CorrespondenceSourceDetailPage() {
  const params = useParams()
  const id = params.id as string
  const t = useT()
  const router = useRouter()
  const [data, setData] = React.useState<CorrespondenceSourceFormValues | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        const result = await readApiResultOrThrow<CorrespondenceSourceFormValues>(
          `/api/correspondence-sources/sources?id=${id}`,
          undefined,
          { errorMessage: 'Failed to load source' }
        )
        setData(result)
      } catch (error) {
        flash(t('correspondenceSources.sources.error.load', 'Failed to load source'), 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, t, refreshKey])

  const schema = z.object({
    name: z.string().min(1, 'Required'),
    sourceType: z.enum(['edoreczenia-mock', 'epuap', 'email']),
    isActive: z.boolean().optional(),
    config: z.record(z.any()),
    defaultReceivingOrgUnitId: z.string().optional(),
    defaultReceivingOrgUnitSymbol: z.string().optional(),
  })

  const baseFields: CrudField[] = [
    {
      id: 'name',
      label: t('correspondenceSources.sources.field.name', 'Name'),
      type: 'text',
      required: true,
      layout: 'half',
    },
    {
      id: 'sourceType',
      label: t('correspondenceSources.sources.field.sourceType', 'Source Type'),
      type: 'select',
      required: true,
      layout: 'half',
      options: [
        { value: 'edoreczenia-mock', label: t('correspondenceSources.sources.sourceType.edoreczenia-mock', 'eDoreczenia (Mock)') },
        { value: 'epuap', label: t('correspondenceSources.sources.sourceType.epuap', 'ePUAP') },
        { value: 'email', label: t('correspondenceSources.sources.sourceType.email', 'Email (IMAP)') },
      ],
    },
    {
      id: 'isActive',
      label: t('correspondenceSources.sources.field.isActive', 'Active'),
      type: 'checkbox',
      layout: 'half',
    },
  ]

  const configFields = data ? getConfigFields(data.sourceType, t) : []

  const orgUnitFields: CrudField[] = [
    {
      id: 'defaultReceivingOrgUnitId',
      label: t('correspondenceSources.sources.field.defaultReceivingOrgUnitId', 'Default Receiving Org Unit'),
      type: 'text',
      layout: 'half',
    },
    {
      id: 'defaultReceivingOrgUnitSymbol',
      label: t('correspondenceSources.sources.field.defaultReceivingOrgUnitSymbol', 'Default Org Unit Symbol'),
      type: 'text',
      layout: 'half',
    },
  ]

  const fields = [...baseFields, ...configFields, ...orgUnitFields]

  const handleSubmit = async (values: CorrespondenceSourceFormValues) => {
    if (!id) return

    try {
      await apiCallOrThrow(`/api/correspondence-sources/sources?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      flash(t('correspondenceSources.sources.success.updated', 'Source updated successfully'), 'success')
      router.push('/backend/correspondence-sources/sources')
    } catch (error) {
      flash(t('correspondenceSources.sources.error.update', 'Failed to update source'), 'error')
      throw error
    }
  }

  if (loading) {
    return (
      <FeatureGuard id="correspondence_sources">
        <Page>
          <PageBody>
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          </PageBody>
        </Page>
      </FeatureGuard>
    )
  }

  if (!data) {
    return (
      <FeatureGuard id="correspondence_sources">
        <Page>
          <PageBody>
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t('correspondenceSources.sources.error.load', 'Failed to load source')}
              </p>
            </div>
          </PageBody>
        </Page>
      </FeatureGuard>
    )
  }

  return (
    <FeatureGuard id="correspondence_sources">
      <Page>
        <PageBody>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {t('correspondenceSources.sources.edit.title', 'Edit Correspondence Source')}
                </h1>
                {data.lastSyncDate && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {t('correspondenceSources.sources.field.lastSyncDate', 'Last Sync Date')}:{' '}
                    <Badge variant="outline">
                      {new Date(data.lastSyncDate).toLocaleString()}
                    </Badge>
                  </div>
                )}
              </div>
              <SyncButton 
                sourceId={id}
                sourceName={data.name}
                onSyncComplete={() => setRefreshKey(prev => prev + 1)}
              />
            </div>

            <CrudForm<CorrespondenceSourceFormValues>
              backHref="/backend/correspondence-sources/sources"
              fields={fields}
              initialValues={data}
              schema={schema}
              submitLabel={t('correspondenceSources.sources.action.save', 'Save Source')}
              cancelHref="/backend/correspondence-sources/sources"
              onSubmit={handleSubmit}
            />
          </div>
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}

