import { defineFeatures } from '@open-mercato/shared/modules/permissions'

export const features = defineFeatures('correspondence_sources', [
  {
    id: 'manage',
    permissions: ['view', 'manage'],
  },
  {
    id: 'sync',
    permissions: ['trigger', 'view_logs'],
  },
])
