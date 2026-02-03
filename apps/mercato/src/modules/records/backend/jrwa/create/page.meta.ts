export const metadata = {
  requireAuth: true,
  requireFeatures: ['records.jrwa_classes.manage'],
  featureToggle: 'records_jrwa_classes',
  pageTitle: 'Create JRWA Class',
  pageTitleKey: 'records.jrwaClasses.create.title',
  breadcrumb: [
    { label: 'JRWA Classes', labelKey: 'records.jrwaClasses.page.title', href: '/backend/jrwa' },
    { label: 'Create', labelKey: 'records.jrwaClasses.create.title' },
  ],
}
