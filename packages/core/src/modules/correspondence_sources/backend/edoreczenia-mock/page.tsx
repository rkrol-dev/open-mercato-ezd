"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function EDoreczeniaMockPage() {
  const t = useT()
  return (
    <Page>
      <PageHeader 
        title={t('correspondenceSources.mock.page.title', 'eDoreczenia Mock UI')} 
        description={t('correspondenceSources.mock.page.description', 'Testing interface for eDoreczenia integration')} 
      />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('correspondenceSources.mock.placeholder', 'Mock interface for testing eDoreczenia will be displayed here.')}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
