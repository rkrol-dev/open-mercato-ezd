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

type JRWAClassFormValues = {
  code: string
  name: string
  description?: string
  parentId?: string
  retentionYears?: number
  retentionCategory?: string
  archivalPackageVariant?: string
  version: string
  isActive?: boolean
}

export default function JrwaClassDetailPage() {
  const params = useParams()
  const id = params.id as string
  const t = useT()
  const router = useRouter()
  const [data, setData] = React.useState<JRWAClassFormValues | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        const result = await readApiResultOrThrow<JRWAClassFormValues>(
          `/api/records/jrwa-classes?id=${id}`,
          undefined,
          { errorMessage: t('records.jrwa.error.load', 'Failed to load JRWA class') }
        )
        setData(result)
      } catch (error) {
        flash(t('records.jrwa.error.load', 'Failed to load JRWA class'), 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, t])

  const schema = z.object({
    code: z.string().min(1, t('validation.required', 'Required')),
    name: z.string().min(1, t('validation.required', 'Required')),
    description: z.string().optional(),
    parentId: z.string().optional(),
    retentionYears: z.number().optional(),
    retentionCategory: z.string().optional(),
    archivalPackageVariant: z.string().optional(),
    version: z.string().min(1, t('validation.required', 'Required')),
    isActive: z.boolean().optional(),
  })

  const fields: CrudField[] = [
    {
      id: 'code',
      label: t('records.jrwa.field.code', 'Code'),
      type: 'text',
      required: true,
      layout: 'half',
      placeholder: 'e.g., 100-1',
    },
    {
      id: 'name',
      label: t('records.jrwa.field.name', 'Name'),
      type: 'text',
      required: true,
      layout: 'full',
    },
    {
      id: 'description',
      label: t('records.jrwa.field.description', 'Description'),
      type: 'textarea',
      layout: 'full',
    },
    {
      id: 'version',
      label: t('records.jrwa.field.version', 'Version'),
      type: 'text',
      required: true,
      layout: 'half',
      placeholder: 'e.g., 2024',
    },
    {
      id: 'isActive',
      label: t('records.jrwa.field.isActive', 'Active'),
      type: 'checkbox',
      layout: 'half',
    },
    {
      id: 'retentionYears',
      label: t('records.jrwa.field.retentionYears', 'Retention Years'),
      type: 'number',
      layout: 'half',
    },
    {
      id: 'retentionCategory',
      label: t('records.jrwa.field.retentionCategory', 'Retention Category'),
      type: 'select',
      layout: 'half',
      options: [
        { value: 'A', label: t('records.retentionCategory.A', 'Category A (Permanent)') },
        { value: 'B', label: t('records.retentionCategory.B', 'Category B (50 years)') },
        { value: 'BE', label: t('records.retentionCategory.BE', 'Category BE (Evaluation required)') },
      ],
    },
    {
      id: 'archivalPackageVariant',
      label: t('records.jrwa.field.archivalPackageVariant', 'Archival Package Variant'),
      type: 'text',
      layout: 'half',
    },
  ]

  const handleSubmit = async (values: JRWAClassFormValues) => {
    if (!id) return

    try {
      await apiCallOrThrow(`/api/records/jrwa-classes?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      flash(t('records.jrwa.success.updated', 'JRWA class updated successfully'), 'success')
      router.push('/backend/records/jrwa')
    } catch (error) {
      flash(t('records.jrwa.error.update', 'Failed to update JRWA class'), 'error')
      throw error
    }
  }

  if (loading) {
    return (
      <FeatureGuard id="records_jrwa_classes">
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
      <FeatureGuard id="records_jrwa_classes">
        <Page>
          <PageBody>
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t('records.jrwa.error.load', 'Failed to load JRWA class')}
              </p>
            </div>
          </PageBody>
        </Page>
      </FeatureGuard>
    )
  }

  return (
    <FeatureGuard id="records_jrwa_classes">
      <Page>
        <PageBody>
          <CrudForm<JRWAClassFormValues>
            title={t('records.jrwa.edit.title', 'Edit JRWA Class')}
            backHref="/backend/records/jrwa"
            fields={fields}
            initialValues={data}
            schema={schema}
            submitLabel={t('records.jrwa.action.save', 'Save Class')}
            cancelHref="/backend/records/jrwa"
            onSubmit={handleSubmit}
          />
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}

