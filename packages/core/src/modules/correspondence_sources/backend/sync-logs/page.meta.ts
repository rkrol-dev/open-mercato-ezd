import React from 'react'

const listIcon = React.createElement(
  'svg',
  {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  React.createElement('line', { x1: 8, y1: 6, x2: 21, y2: 6 }),
  React.createElement('line', { x1: 8, y1: 12, x2: 21, y2: 12 }),
  React.createElement('line', { x1: 8, y1: 18, x2: 21, y2: 18 }),
  React.createElement('line', { x1: 3, y1: 6, x2: 3.01, y2: 6 }),
  React.createElement('line', { x1: 3, y1: 12, x2: 3.01, y2: 12 }),
  React.createElement('line', { x1: 3, y1: 18, x2: 3.01, y2: 18 })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['correspondence_sources.manage'],
  pageTitle: 'Sync Logs',
  pageTitleKey: 'correspondenceSources.syncLogs.page.title',
  pageGroup: 'Records',
  pageGroupKey: 'records.nav.group',
  pageOrder: 130,
  icon: listIcon,
  breadcrumb: [{ label: 'Sync Logs', labelKey: 'correspondenceSources.syncLogs.page.title' }],
}
