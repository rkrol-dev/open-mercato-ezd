import React from 'react'

const folderTreeIcon = React.createElement(
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
  React.createElement('path', { d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' }),
  React.createElement('path', { d: 'M2 10h20' })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['records.jrwa_classes.view'],
  pageTitle: 'JRWA Classification',
  pageTitleKey: 'records.jrwa.page.title',
  pageGroup: 'Records',
  pageGroupKey: 'records.nav.group',
  pageOrder: 110,
  icon: folderTreeIcon,
  breadcrumb: [{ label: 'JRWA Classification', labelKey: 'records.jrwa.page.title' }],
}
