"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function SyncLogsPage() {
  const t = useT()
  return (
    <Page>
      <PageHeader 
        title={t('correspondenceSources.syncLogs.page.title', 'Sync Logs')} 
        description={t('correspondenceSources.syncLogs.page.description', 'View correspondence synchronization history')} 
      />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('correspondenceSources.syncLogs.placeholder', 'Synchronization logs will be displayed here.')}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
