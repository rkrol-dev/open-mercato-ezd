"use client"

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudField } from '@open-mercato/ui/backend/CrudForm'
import { apiCallOrThrow, readApiResultOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'
import { RegisterShipmentButton } from '../../../components/RegisterShipmentButton'

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

type IncomingShipmentData = IncomingShipmentFormValues & {
  id: string
  rpwNumber?: string | null
  status: 'draft' | 'registered'
  registeredAt?: string | null
}

export default function IncomingShipmentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const t = useT()
  const router = useRouter()
  const [data, setData] = React.useState<IncomingShipmentData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        const result = await readApiResultOrThrow<IncomingShipmentData>(
          `/api/records/incoming-shipments?id=${id}`,
          undefined,
          { errorMessage: t('records.incomingShipments.error.load', 'Failed to load shipment') }
        )
        setData(result)
      } catch (error) {
        flash(t('records.incomingShipments.error.load', 'Failed to load shipment'), 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, t, refreshKey])

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

  const fields: CrudField[] = React.useMemo(() => {
    const baseFields: CrudField[] = [
      {
        id: 'rpwNumber',
        label: t('records.incomingShipments.field.rpwNumber', 'RPW Number'),
        type: 'text',
        disabled: true,
        layout: 'half',
      },
      {
        id: 'status',
        label: t('records.incomingShipments.field.status', 'Status'),
        type: 'text',
        disabled: true,
        layout: 'half',
      },
    ]
    
    if (data?.registeredAt) {
      baseFields.push({
        id: 'registeredAt',
        label: t('records.incomingShipments.field.registeredAt', 'Registered At'),
        type: 'text',
        disabled: true,
        layout: 'half',
      })
    }

    return [
      ...baseFields,
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
  }, [t, data])

  const groups = [
    {
      id: 'shipmentData',
      label: t('records.incomingShipments.section.shipmentData', 'Shipment Data'),
      fields: data?.rpwNumber 
        ? ['rpwNumber', 'status', ...(data.registeredAt ? ['registeredAt'] : []), 'subject', 'receivedAt', 'deliveryMethod']
        : ['status', 'subject', 'receivedAt', 'deliveryMethod'],
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
    if (!id) return

    try {
      await apiCallOrThrow(`/api/records/incoming-shipments?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      flash(t('records.incomingShipments.success.updated', 'Shipment updated successfully'), 'success')
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      flash(t('records.incomingShipments.error.update', 'Failed to update shipment'), 'error')
      throw error
    }
  }

  const handleRegisterSuccess = async () => {
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <FeatureGuard id="records_incoming_shipments">
        <Page>
          <PageBody>
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          </PageBody>
        </Page>
      </FeatureGuard>
    )
  }

  if (!data) {
    return (
      <FeatureGuard id="records_incoming_shipments">
        <Page>
          <PageBody>
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t('records.incomingShipments.error.load', 'Failed to load shipment')}
              </p>
            </div>
          </PageBody>
        </Page>
      </FeatureGuard>
    )
  }

  const initialValues = {
    ...data,
    rpwNumber: data.rpwNumber || t('common.notAssigned', 'Not assigned'),
    status: t(`records.incomingShipments.status.${data.status}`, data.status),
    registeredAt: data.registeredAt ? new Date(data.registeredAt).toLocaleString() : undefined,
  }

  return (
    <FeatureGuard id="records_incoming_shipments">
      <Page>
        <PageBody>
          <CrudForm<IncomingShipmentFormValues>
            title={t('records.incomingShipments.edit.title', 'Edit Incoming Shipment')}
            backHref="/backend/records/incoming-shipments"
            fields={fields}
            groups={groups}
            initialValues={initialValues}
            schema={schema}
            submitLabel={t('records.incomingShipments.action.save', 'Save Shipment')}
            cancelHref="/backend/records/incoming-shipments"
            onSubmit={handleSubmit}
            extraActions={
              data && (
                <RegisterShipmentButton
                  shipmentId={data.id}
                  status={data.status}
                  onSuccess={handleRegisterSuccess}
                />
              )
            }
          />
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}
