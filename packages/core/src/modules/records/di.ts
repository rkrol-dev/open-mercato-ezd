import { asFunction } from 'awilix'
import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import type { EntityManager } from '@mikro-orm/postgresql'
import { IncomingShipmentService } from './services/IncomingShipmentService'
import { RpwGeneratorService } from './services/RpwGeneratorService'
import { JrwaImportService } from './services/JrwaImportService'

type AppCradle = AppContainer['cradle'] & {
  em: EntityManager
}

export function register(container: AppContainer) {
  container.register({
    IncomingShipmentService: asFunction(({ em }: AppCradle) => new IncomingShipmentService(em)).scoped(),
    RpwGeneratorService: asFunction(({ em }: AppCradle) => new RpwGeneratorService(em)).scoped(),
    JrwaImportService: asFunction(({ em }: AppCradle) => new JrwaImportService(em)).scoped(),
  })
}
