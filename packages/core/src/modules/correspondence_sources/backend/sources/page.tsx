"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function CorrespondenceSourcesPage() {
  const t = useT()
  return (
    <Page>
      <PageHeader 
        title={t('correspondenceSources.sources.page.title', 'Correspondence Sources')} 
        description={t('correspondenceSources.sources.page.description', 'Manage eDoreczenia and other correspondence integration sources')} 
      />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('correspondenceSources.sources.placeholder', 'Correspondence sources list will be displayed here.')}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
