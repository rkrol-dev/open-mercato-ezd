"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { useParams } from 'next/navigation'

export default function CorrespondenceSourceDetailPage() {
  const t = useT()
  const params = useParams()
  return (
    <Page>
      <PageHeader title={t('correspondenceSources.sources.detail.title', 'Source Details')} />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('correspondenceSources.sources.detail.placeholder', 'Source details for ID: {{id}}', { id: params.id })}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
