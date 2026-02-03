import { defineFeatures } from '@open-mercato/shared/modules/permissions'

export const features = defineFeatures('records', [
  {
    id: 'incoming_shipments',
    permissions: ['view', 'manage', 'register'],
  },
  {
    id: 'jrwa_classes',
    permissions: ['view', 'manage', 'import'],
  },
  {
    id: 'documents',
    permissions: ['view', 'manage'],
  },
])
