export const metadata = {
  requireAuth: true,
  requireFeatures: ['correspondence_sources.manage.view'],
  featureToggle: 'correspondence_sources',
  pageTitle: 'Correspondence Source Details',
  pageTitleKey: 'correspondenceSources.sources.details.title',
  breadcrumb: [
    { label: 'Correspondence Sources', labelKey: 'correspondenceSources.sources.page.title', href: '/backend/sources' },
    { label: 'Details', labelKey: 'correspondenceSources.sources.details.title' },
  ],
}
