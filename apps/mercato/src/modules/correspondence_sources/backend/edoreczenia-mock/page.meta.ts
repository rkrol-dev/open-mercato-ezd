export const metadata = {
  requireAuth: true,
  requireRoles: ['superadmin'],
  featureToggle: 'correspondence_sources_mock_ui',
  pageTitle: 'eDoreczenia Mock',
  pageTitleKey: 'correspondenceSources.mock.page.title',
  pageGroup: 'Testing',
  pageGroupKey: 'correspondenceSources.testing.nav.group',
  pageOrder: 900,
  breadcrumb: [
    { label: 'eDoreczenia Mock', labelKey: 'correspondenceSources.mock.page.title' },
  ],
}
