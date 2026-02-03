import * as React from 'react'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { useT } from '@open-mercato/shared/lib/i18n/context'

interface SourceStatusBadgeProps {
  isActive: boolean
}

export function SourceStatusBadge({ isActive }: SourceStatusBadgeProps) {
  const t = useT()
  
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {isActive 
        ? t('correspondenceSources.sources.status.active', 'Active')
        : t('correspondenceSources.sources.status.inactive', 'Inactive')
      }
    </Badge>
  )
}
