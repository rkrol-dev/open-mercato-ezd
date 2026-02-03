import { asFunction } from 'awilix'
import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import type { EntityManager } from '@mikro-orm/postgresql'
import { CorrespondenceSyncService } from './services/CorrespondenceSyncService'
import { CustomerMappingService } from './services/CustomerMappingService'

type AppCradle = AppContainer['cradle'] & {
  em: EntityManager
}

export function register(container: AppContainer) {
  container.register({
    CorrespondenceSyncService: asFunction(({ em }: AppCradle) => new CorrespondenceSyncService(em)).scoped(),
    CustomerMappingService: asFunction(({ em }: AppCradle) => new CustomerMappingService(em)).scoped(),
  })
}
