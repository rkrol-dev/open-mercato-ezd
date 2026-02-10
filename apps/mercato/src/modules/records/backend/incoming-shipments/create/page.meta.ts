export const metadata = {
  requireAuth: true,
  requireFeatures: ['records.incoming_shipments.manage'],
  featureToggle: 'records_incoming_shipments',
  pageTitle: 'Create Incoming Shipment',
  pageTitleKey: 'records.incomingShipments.create.title',
  breadcrumb: [
    { label: 'Incoming Shipments', labelKey: 'records.incomingShipments.page.title', href: '/backend/incoming-shipments' },
    { label: 'Create', labelKey: 'records.incomingShipments.create.title' },
  ],
}
