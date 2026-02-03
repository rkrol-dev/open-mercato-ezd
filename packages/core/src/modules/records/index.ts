import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'records',
  title: 'Records Management',
  version: '0.1.0',
  description: 'Incoming shipments (Przesyłki wpływające), JRWA classification, and document management for Electronic Document Management (EZD) platform.',
  author: 'Open Mercato Team',
  license: 'Proprietary',
}

export { features } from './acl'
