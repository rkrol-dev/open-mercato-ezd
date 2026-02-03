import React from 'react'

const folderIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['records.jrwa_classes.view'],
  featureToggle: 'records_jrwa_classes',
  pageTitle: 'JRWA Classes',
  pageTitleKey: 'records.jrwaClasses.page.title',
  pageGroup: 'Records',
  pageGroupKey: 'records.nav.group',
  pageOrder: 110,
  icon: folderIcon,
  breadcrumb: [
    { label: 'JRWA Classes', labelKey: 'records.jrwaClasses.page.title' },
  ],
}
