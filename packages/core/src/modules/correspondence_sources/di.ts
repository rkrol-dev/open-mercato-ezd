import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import { CorrespondenceSyncService } from './services/CorrespondenceSyncService'
import { CustomerMappingService } from './services/CustomerMappingService'

export function register(container: AppContainer) {
  container.register('CorrespondenceSyncService', ({ em }: any) => new CorrespondenceSyncService(em))
  container.register('CustomerMappingService', ({ em }: any) => new CustomerMappingService(em))
}
