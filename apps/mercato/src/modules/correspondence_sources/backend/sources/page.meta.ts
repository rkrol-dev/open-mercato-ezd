import React from 'react'

const sourceIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('path', { d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' }),
  React.createElement('polyline', { points: '22,6 12,13 2,6' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['correspondence_sources.manage.view'],
  featureToggle: 'correspondence_sources',
  pageTitle: 'Correspondence Sources',
  pageTitleKey: 'correspondenceSources.sources.page.title',
  pageGroup: 'Integrations',
  pageGroupKey: 'correspondenceSources.nav.group',
  pageOrder: 200,
  icon: sourceIcon,
  breadcrumb: [
    { label: 'Correspondence Sources', labelKey: 'correspondenceSources.sources.page.title' },
  ],
}
