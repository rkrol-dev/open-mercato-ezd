"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { useParams } from 'next/navigation'

export default function JrwaClassDetailPage() {
  const t = useT()
  const params = useParams()
  return (
    <Page>
      <PageHeader title={t('records.jrwa.detail.title', 'JRWA Class Details')} />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('records.jrwa.detail.placeholder', 'JRWA class details for ID: {{id}}', { id: params.id })}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
