"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function CreateCorrespondenceSourcePage() {
  const t = useT()
  return (
    <Page>
      <PageHeader title={t('correspondenceSources.sources.create.title', 'Create Correspondence Source')} />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('correspondenceSources.sources.create.placeholder', 'Create source form will be displayed here.')}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
