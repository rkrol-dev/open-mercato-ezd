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
  
  const variant = status === 'registered' ? 'success' : 'warning'
  const label = t(`records.incomingShipments.status.${status}`, status)
  
  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  )
}
