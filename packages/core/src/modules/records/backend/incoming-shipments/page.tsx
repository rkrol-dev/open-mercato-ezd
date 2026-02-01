"use client"
import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function IncomingShipmentsPage() {
  const t = useT()
  return (
    <Page>
      <PageHeader 
        title={t('records.incomingShipments.page.title', 'Incoming Shipments')} 
        description={t('records.incomingShipments.page.description', 'Manage incoming correspondence and shipments (Przesyłki wpływające)')} 
      />
      <PageBody>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">
            {t('records.incomingShipments.placeholder', 'Incoming shipments list will be displayed here.')}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
