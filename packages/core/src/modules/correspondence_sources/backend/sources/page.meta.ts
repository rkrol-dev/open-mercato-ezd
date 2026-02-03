import React from 'react'

const cloudDownloadIcon = React.createElement(
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
  React.createElement('path', { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' }),
  React.createElement('path', { d: 'M12 12v9' }),
  React.createElement('path', { d: 'm8 17 4 4 4-4' })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['correspondence_sources.manage'],
  pageTitle: 'Correspondence Sources',
  pageTitleKey: 'correspondenceSources.sources.page.title',
  pageGroup: 'Records',
  pageGroupKey: 'records.nav.group',
  pageOrder: 120,
  icon: cloudDownloadIcon,
  breadcrumb: [{ label: 'Correspondence Sources', labelKey: 'correspondenceSources.sources.page.title' }],
}
