import type { EntityManager } from '@mikro-orm/postgresql'
import { RecordsIncomingShipment } from '../data/entities'
import { RpwGeneratorService } from './RpwGeneratorService'
import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'

export class IncomingShipmentService {
  private rpwGenerator: RpwGeneratorService

  constructor(private readonly em: EntityManager) {
    this.rpwGenerator = new RpwGeneratorService(em)
  }

  async registerShipment(
    id: string,
    organizationId: string,
    tenantId: string
  ): Promise<RecordsIncomingShipment> {
    const shipment = await this.em.findOne(RecordsIncomingShipment, {
      id,
      organizationId,
      tenantId,
      deletedAt: null,
    })

    if (!shipment) {
      throw new CrudHttpError(404, { error: 'Incoming shipment not found' })
    }

    if (shipment.status !== 'draft') {
      throw new CrudHttpError(400, {
        error: `Cannot register shipment with status "${shipment.status}". Only "draft" shipments can be registered.`,
      })
    }

    const year = shipment.receivedAt.getFullYear()

    const { rpwNumber, rpwSequence } = await this.rpwGenerator.generateRpwNumber(
      organizationId,
      tenantId,
      shipment.receivingOrgUnitId,
      shipment.receivingOrgUnitSymbol,
      year
    )

    shipment.rpwNumber = rpwNumber
    shipment.rpwSequence = rpwSequence
    shipment.status = 'registered'

    await this.em.flush()

    return shipment
  }

  async findById(id: string, organizationId: string, tenantId: string): Promise<RecordsIncomingShipment | null> {
    return this.em.findOne(RecordsIncomingShipment, {
      id,
      organizationId,
      tenantId,
      deletedAt: null,
    })
  }

  async create(data: Partial<RecordsIncomingShipment>): Promise<RecordsIncomingShipment> {
    const shipment = this.em.create(RecordsIncomingShipment, data)
    await this.em.persistAndFlush(shipment)
    return shipment
  }

  async update(id: string, data: Partial<RecordsIncomingShipment>): Promise<RecordsIncomingShipment> {
    const shipment = await this.em.findOneOrFail(RecordsIncomingShipment, { id })

    if (data.rpwNumber !== undefined && shipment.rpwNumber) {
      throw new CrudHttpError(400, {
        error: 'Cannot modify RPW number once assigned',
      })
    }

    this.em.assign(shipment, data)
    await this.em.flush()
    return shipment
  }

  async delete(id: string, organizationId: string, tenantId: string): Promise<void> {
    const shipment = await this.em.findOne(RecordsIncomingShipment, {
      id,
      organizationId,
      tenantId,
      deletedAt: null,
    })

    if (!shipment) {
      throw new CrudHttpError(404, { error: 'Incoming shipment not found' })
    }

    shipment.deletedAt = new Date()
    await this.em.flush()
  }
}
