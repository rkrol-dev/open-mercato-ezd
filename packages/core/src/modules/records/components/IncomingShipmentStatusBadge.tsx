"use client"

import * as React from 'react'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export type ShipmentStatus = 'draft' | 'registered'

export type IncomingShipmentStatusBadgeProps = {
  status: ShipmentStatus
}

export function IncomingShipmentStatusBadge({ status }: IncomingShipmentStatusBadgeProps) {
  const t = useT()
  
  const variant = status === 'registered' ? 'default' : 'secondary'
  const label = t(`records.incomingShipments.status.${status}`, status)
  
  return (
    <Badge variant={variant} className={status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}>
      {label}
    </Badge>
  )
}
