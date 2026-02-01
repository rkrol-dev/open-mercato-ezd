import React from 'react'

const shipmentIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
  React.createElement('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
  React.createElement('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['records.incoming_shipments.view'],
  featureToggle: 'records_incoming_shipments',
  pageTitle: 'Incoming Shipments',
  pageTitleKey: 'records.incomingShipments.page.title',
  pageGroup: 'Records',
  pageGroupKey: 'records.nav.group',
  pageOrder: 100,
  icon: shipmentIcon,
  breadcrumb: [
    { label: 'Incoming Shipments', labelKey: 'records.incomingShipments.page.title' },
  ],
}
