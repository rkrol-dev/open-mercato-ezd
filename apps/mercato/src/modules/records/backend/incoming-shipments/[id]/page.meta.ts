export const metadata = {
  requireAuth: true,
  requireFeatures: ['records.incoming_shipments.view'],
  featureToggle: 'records_incoming_shipments',
  pageTitle: 'Incoming Shipment Details',
  pageTitleKey: 'records.incomingShipments.details.title',
  breadcrumb: [
    { label: 'Incoming Shipments', labelKey: 'records.incomingShipments.page.title', href: '/backend/incoming-shipments' },
    { label: 'Details', labelKey: 'records.incomingShipments.details.title' },
  ],
}
