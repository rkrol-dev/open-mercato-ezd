import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'correspondence_sources',
  title: 'Correspondence Sources Integration',
  version: '0.1.0',
  description: 'eDoreczenia integration with automatic correspondence synchronization.',
  author: 'Open Mercato Team',
  license: 'Proprietary',
}

export { features } from './acl'
