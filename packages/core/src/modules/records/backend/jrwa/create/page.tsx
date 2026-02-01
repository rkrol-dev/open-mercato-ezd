"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function CreateJrwaClassPage() {
  const t = useT()
  return (
    <Page>
      <PageHeader title={t('records.jrwa.create.title', 'Create JRWA Class')} />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('records.jrwa.create.placeholder', 'Create JRWA class form will be displayed here.')}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
