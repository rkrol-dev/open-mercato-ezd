import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'correspondence_sources',
  title: 'Correspondence Sources',
  version: '0.1.0',
  description: 'eDoreczenia integration (Polish electronic delivery system) with automatic correspondence synchronization.',
  author: 'Open Mercato Team',
  license: 'Proprietary',
}

export { features } from './acl'
