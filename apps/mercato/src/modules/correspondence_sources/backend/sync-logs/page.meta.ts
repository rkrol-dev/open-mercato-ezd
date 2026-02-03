export const metadata = {
  requireAuth: true,
  requireFeatures: ['correspondence_sources.sync.view_logs'],
  featureToggle: 'correspondence_sources',
  pageTitle: 'Sync Logs',
  pageTitleKey: 'correspondenceSources.syncLogs.page.title',
  pageGroup: 'Integrations',
  pageGroupKey: 'correspondenceSources.nav.group',
  pageOrder: 210,
  breadcrumb: [
    { label: 'Sync Logs', labelKey: 'correspondenceSources.syncLogs.page.title' },
  ],
}
