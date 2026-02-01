import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import { IncomingShipmentService } from './services/IncomingShipmentService'
import { RpwGeneratorService } from './services/RpwGeneratorService'
import { JrwaImportService } from './services/JrwaImportService'

export function register(container: AppContainer) {
  container.register('IncomingShipmentService', ({ em }) => new IncomingShipmentService(em))
  container.register('RpwGeneratorService', ({ em }) => new RpwGeneratorService(em))
  container.register('JrwaImportService', ({ em }) => new JrwaImportService(em))
}
