export const metadata = {
  requireAuth: true,
  requireFeatures: ['correspondence_sources.manage.manage'],
  featureToggle: 'correspondence_sources',
  pageTitle: 'Create Correspondence Source',
  pageTitleKey: 'correspondenceSources.sources.create.title',
  breadcrumb: [
    { label: 'Correspondence Sources', labelKey: 'correspondenceSources.sources.page.title', href: '/backend/sources' },
    { label: 'Create', labelKey: 'correspondenceSources.sources.create.title' },
  ],
}
