"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudField } from '@open-mercato/ui/backend/CrudForm'
import { apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'
import { getConfigFields } from '../../../components/SourceConfigForm'

type CorrespondenceSourceFormValues = {
  name: string
  sourceType: 'edoreczenia-mock' | 'epuap' | 'email'
  isActive?: boolean
  config: Record<string, any>
  defaultReceivingOrgUnitId?: string
  defaultReceivingOrgUnitSymbol?: string
}

export default function CreateCorrespondenceSourcePage() {
  const t = useT()
  const router = useRouter()
  const [sourceType, setSourceType] = React.useState<'edoreczenia-mock' | 'epuap' | 'email'>('edoreczenia-mock')

  const schema = z.object({
    name: z.string().min(1, 'Required'),
    sourceType: z.enum(['edoreczenia-mock', 'epuap', 'email']),
    isActive: z.boolean().optional(),
    config: z.record(z.string(), z.any()),
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

  const configFields = getConfigFields(sourceType, t)

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
    try {
      await apiCallOrThrow('/api/correspondence-sources/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          isActive: values.isActive ?? true,
        }),
      })

      flash(t('correspondenceSources.sources.success.created', 'Source created successfully'), 'success')
      router.push('/backend/correspondence-sources/sources')
    } catch (error) {
      flash(t('correspondenceSources.sources.error.create', 'Failed to create source'), 'error')
      throw error
    }
  }

  return (
    <FeatureGuard id="correspondence_sources">
      <Page>
        <PageBody>
          <CrudForm<CorrespondenceSourceFormValues>
            title={t('correspondenceSources.sources.create.title', 'Create Correspondence Source')}
            backHref="/backend/correspondence-sources/sources"
            fields={fields}
            schema={schema}
            submitLabel={t('correspondenceSources.sources.action.save', 'Save Source')}
            cancelHref="/backend/correspondence-sources/sources"
            onSubmit={handleSubmit}
            initialValues={{
              name: '',
              sourceType: 'edoreczenia-mock',
              isActive: true,
              config: {},
            }}
          />
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}

