export const metadata = {
  requireAuth: true,
  requireFeatures: ['records.jrwa_classes.import'],
  featureToggle: 'records_jrwa_classes',
  pageTitle: 'Import JRWA Classes',
  pageTitleKey: 'records.jrwaClasses.import.title',
  breadcrumb: [
    { label: 'JRWA Classes', labelKey: 'records.jrwaClasses.page.title', href: '/backend/jrwa' },
    { label: 'Import', labelKey: 'records.jrwaClasses.import.title' },
  ],
}
