"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function JrwaClassesPage() {
  const t = useT()
  return (
    <Page>
      <PageHeader 
        title={t('records.jrwa.page.title', 'JRWA Classification')} 
        description={t('records.jrwa.page.description', 'Manage Jednolity Rzeczowy Wykaz Akt (JRWA) archival classification')} 
      />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('records.jrwa.placeholder', 'JRWA classification tree will be displayed here.')}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
