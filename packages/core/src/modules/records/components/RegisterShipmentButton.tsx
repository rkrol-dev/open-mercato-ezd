"use client"

import * as React from 'react'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export type RegisterShipmentButtonProps = {
  shipmentId: string
  status: string
  onSuccess?: () => void | Promise<void>
}

export function RegisterShipmentButton({ shipmentId, status, onSuccess }: RegisterShipmentButtonProps) {
  const t = useT()
  const [isLoading, setIsLoading] = React.useState(false)
  
  if (status !== 'draft') {
    return null
  }
  
  const handleRegister = async () => {
    const confirmed = window.confirm(t('records.incomingShipments.confirm.register', 'Are you sure?'))
    if (!confirmed) return
    
    setIsLoading(true)
    try {
      await apiCallOrThrow(`/api/records/incoming-shipments/${shipmentId}/register`, {
        method: 'POST',
      })
      
      flash(t('records.incomingShipments.success.registered', 'Shipment registered successfully'), 'success')
      
      if (onSuccess) {
        await onSuccess()
      }
    } catch (error) {
      flash(t('records.incomingShipments.error.register', 'Failed to register shipment'), 'error')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button 
      onClick={handleRegister} 
      disabled={isLoading}
      variant="default"
    >
      {isLoading 
        ? t('common.loading', 'Loading...') 
        : t('records.incomingShipments.action.register', 'Register Shipment')
      }
    </Button>
  )
}
