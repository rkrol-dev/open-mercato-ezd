"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function CreateIncomingShipmentPage() {
  const t = useT()
  return (
    <Page>
      <PageHeader title={t('records.incomingShipments.create.title', 'Create Incoming Shipment')} />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('records.incomingShipments.create.placeholder', 'Create shipment form will be displayed here.')}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
