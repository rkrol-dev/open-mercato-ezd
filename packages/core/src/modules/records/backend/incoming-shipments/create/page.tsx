"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudField } from '@open-mercato/ui/backend/CrudForm'
import { apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'

type IncomingShipmentFormValues = {
  subject: string
  receivedAt: string
  deliveryMethod: string
  senderId?: string
  senderDisplayName?: string
  senderAnonymous?: boolean
  remarks?: string
  documentDate?: string
  documentSign?: string
  accessLevel?: string
}

export default function CreateIncomingShipmentPage() {
  const t = useT()
  const router = useRouter()

  const schema = z.object({
    subject: z.string().min(1, t('validation.required', 'Required')),
    receivedAt: z.string().min(1, t('validation.required', 'Required')),
    deliveryMethod: z.string().min(1, t('validation.required', 'Required')),
    senderId: z.string().optional(),
    senderDisplayName: z.string().optional(),
    senderAnonymous: z.boolean().optional(),
    remarks: z.string().optional(),
    documentDate: z.string().optional(),
    documentSign: z.string().optional(),
    accessLevel: z.string().optional(),
  })

  const fields: CrudField[] = [
    {
      id: 'subject',
      label: t('records.incomingShipments.field.subject', 'Subject'),
      type: 'text',
      required: true,
      layout: 'full',
    },
    {
      id: 'receivedAt',
      label: t('records.incomingShipments.field.receivedAt', 'Received At'),
      type: 'datetime-local',
      required: true,
      layout: 'half',
    },
    {
      id: 'deliveryMethod',
      label: t('records.incomingShipments.field.deliveryMethod', 'Delivery Method'),
      type: 'select',
      required: true,
      layout: 'half',
      options: [
        { value: 'mail', label: t('records.deliveryMethod.mail', 'Mail') },
        { value: 'courier', label: t('records.deliveryMethod.courier', 'Courier') },
        { value: 'email', label: t('records.deliveryMethod.email', 'Email') },
        { value: 'hand', label: t('records.deliveryMethod.hand', 'Hand Delivery') },
        { value: 'fax', label: t('records.deliveryMethod.fax', 'Fax') },
        { value: 'other', label: t('records.deliveryMethod.other', 'Other') },
      ],
    },
    {
      id: 'senderDisplayName',
      label: t('records.incomingShipments.field.senderDisplayName', 'Sender Display Name'),
      type: 'text',
      layout: 'full',
    },
    {
      id: 'senderAnonymous',
      label: t('records.incomingShipments.field.senderAnonymous', 'Anonymous Sender'),
      type: 'checkbox',
      layout: 'full',
    },
    {
      id: 'documentDate',
      label: t('records.incomingShipments.field.documentDate', 'Document Date'),
      type: 'date',
      layout: 'half',
    },
    {
      id: 'documentSign',
      label: t('records.incomingShipments.field.documentSign', 'Document Sign'),
      type: 'text',
      layout: 'half',
    },
    {
      id: 'accessLevel',
      label: t('records.incomingShipments.field.accessLevel', 'Access Level'),
      type: 'select',
      layout: 'half',
      options: [
        { value: 'public', label: t('records.accessLevel.public', 'Public') },
        { value: 'internal', label: t('records.accessLevel.internal', 'Internal') },
        { value: 'confidential', label: t('records.accessLevel.confidential', 'Confidential') },
        { value: 'secret', label: t('records.accessLevel.secret', 'Secret') },
      ],
    },
    {
      id: 'remarks',
      label: t('records.incomingShipments.field.remarks', 'Remarks'),
      type: 'textarea',
      layout: 'full',
    },
  ]

  const groups = [
    {
      id: 'shipmentData',
      label: t('records.incomingShipments.section.shipmentData', 'Shipment Data'),
      fields: ['subject', 'receivedAt', 'deliveryMethod'],
    },
    {
      id: 'senderData',
      label: t('records.incomingShipments.section.senderData', 'Sender Data'),
      fields: ['senderDisplayName', 'senderAnonymous'],
    },
    {
      id: 'additionalData',
      label: t('records.incomingShipments.section.additionalData', 'Additional Data'),
      fields: ['documentDate', 'documentSign', 'accessLevel', 'remarks'],
    },
  ]

  const handleSubmit = async (values: IncomingShipmentFormValues) => {
    try {
      const response = await apiCallOrThrow('/api/records/incoming-shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      flash(t('records.incomingShipments.success.created', 'Shipment created successfully'), 'success')
      router.push('/backend/records/incoming-shipments')
    } catch (error) {
      flash(t('records.incomingShipments.error.create', 'Failed to create shipment'), 'error')
      throw error
    }
  }

  return (
    <FeatureGuard id="records_incoming_shipments">
      <Page>
        <PageBody>
          <CrudForm<IncomingShipmentFormValues>
            title={t('records.incomingShipments.create.title', 'Create Incoming Shipment')}
            backHref="/backend/records/incoming-shipments"
            fields={fields}
            groups={groups}
            schema={schema}
            submitLabel={t('records.incomingShipments.action.save', 'Save Shipment')}
            cancelHref="/backend/records/incoming-shipments"
            onSubmit={handleSubmit}
          />
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}
