export const metadata = {
  requireAuth: true,
  requireFeatures: ['records.jrwa_classes.view'],
  featureToggle: 'records_jrwa_classes',
  pageTitle: 'JRWA Class Details',
  pageTitleKey: 'records.jrwaClasses.details.title',
  breadcrumb: [
    { label: 'JRWA Classes', labelKey: 'records.jrwaClasses.page.title', href: '/backend/jrwa' },
    { label: 'Details', labelKey: 'records.jrwaClasses.details.title' },
  ],
}
