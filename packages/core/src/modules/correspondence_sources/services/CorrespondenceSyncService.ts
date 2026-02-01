import type { EntityManager } from '@mikro-orm/postgresql'
import { CorrespondenceSource, CorrespondenceSyncLog } from '../data/entities'
import { IncomingShipmentService } from '@open-mercato/core/modules/records/services/IncomingShipmentService'
import { CustomerMappingService, type SenderData } from './CustomerMappingService'
import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'

export interface CorrespondenceItem {
  subject: string
  sender: SenderData
  receivedAt: Date
  deliveryMethod: string
  postedAt?: Date
  senderReference?: string
  remarks?: string
  documentDate?: Date
  documentSign?: string
}

export interface SyncResult {
  syncLogId: string
  itemsFetched: number
  itemsCreated: number
  itemsFailed: number
  status: string
}

export class CorrespondenceSyncService {
  private incomingShipmentService: IncomingShipmentService
  private customerMappingService: CustomerMappingService

  constructor(private readonly em: EntityManager) {
    this.incomingShipmentService = new IncomingShipmentService(em)
    this.customerMappingService = new CustomerMappingService(em)
  }

  async syncSource(
    sourceId: string,
    organizationId: string,
    tenantId: string
  ): Promise<SyncResult> {
    const source = await this.em.findOne(CorrespondenceSource, {
      id: sourceId,
      organizationId,
      tenantId,
      deletedAt: null,
    })

    if (!source) {
      throw new CrudHttpError(404, { error: 'Correspondence source not found' })
    }

    if (!source.isActive) {
      throw new CrudHttpError(400, { error: 'Correspondence source is not active' })
    }

    const syncLog = this.em.create(CorrespondenceSyncLog, {
      organizationId,
      tenantId,
      sourceId,
      startedAt: new Date(),
      status: 'in_progress',
      itemsFetched: 0,
      itemsCreated: 0,
      itemsFailed: 0,
    })

    await this.em.persistAndFlush(syncLog)

    try {
      const items = await this.fetchCorrespondence(source)
      syncLog.itemsFetched = items.length

      let itemsCreated = 0
      let itemsFailed = 0

      for (const item of items) {
        try {
          await this.processCorrespondenceItem(source, item, organizationId, tenantId)
          itemsCreated++
        } catch (error) {
          itemsFailed++
          console.error('Failed to process correspondence item:', error)
        }
      }

      syncLog.itemsCreated = itemsCreated
      syncLog.itemsFailed = itemsFailed
      syncLog.status = 'completed'
      syncLog.completedAt = new Date()

      source.lastSyncDate = new Date()

      await this.em.flush()

      return {
        syncLogId: syncLog.id,
        itemsFetched: syncLog.itemsFetched,
        itemsCreated: syncLog.itemsCreated,
        itemsFailed: syncLog.itemsFailed,
        status: syncLog.status,
      }
    } catch (error: any) {
      syncLog.status = 'failed'
      syncLog.errorMessage = error.message || 'Unknown error'
      syncLog.completedAt = new Date()

      await this.em.flush()

      throw error
    }
  }

  private async fetchCorrespondence(source: CorrespondenceSource): Promise<CorrespondenceItem[]> {
    switch (source.sourceType) {
      case 'edoreczenia-mock':
        return this.fetchMockCorrespondence()
      case 'epuap':
        return this.fetchEpuapCorrespondence(source)
      case 'email':
        return this.fetchEmailCorrespondence(source)
      default:
        throw new Error(`Unknown source type: ${source.sourceType}`)
    }
  }

  private async fetchMockCorrespondence(): Promise<CorrespondenceItem[]> {
    const now = new Date()
    const items: CorrespondenceItem[] = []
    const count = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < count; i++) {
      const itemDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      
      items.push({
        subject: `Test Correspondence #${Date.now()}-${i}`,
        sender: {
          displayName: this.getRandomSender(),
          email: `sender${i}@example.com`,
          identifiers: this.getRandomIdentifiers(i),
        },
        receivedAt: itemDate,
        deliveryMethod: 'electronic',
        postedAt: new Date(itemDate.getTime() - 24 * 60 * 60 * 1000),
        senderReference: `REF-${Date.now()}-${i}`,
        documentDate: new Date(itemDate.getTime() - 48 * 60 * 60 * 1000),
        documentSign: `DOC-${i}`,
      })
    }

    return items
  }

  private getRandomSender(): string {
    const senders = [
      'Jan Kowalski',
      'ABC Sp. z o.o.',
      'XYZ Corporation',
      'Maria Nowak',
      'Tech Solutions Ltd.',
    ]
    return senders[Math.floor(Math.random() * senders.length)]
  }

  private getRandomIdentifiers(seed: number): SenderData['identifiers'] {
    const types = ['company', 'person', 'none']
    const type = types[seed % 3]

    if (type === 'company') {
      return {
        nip: `${1000000000 + seed}`,
        regon: `${100000000 + seed}`,
      }
    } else if (type === 'person') {
      return {
        pesel: `${10000000000 + seed}`,
      }
    }

    return {}
  }

  private async fetchEpuapCorrespondence(_source: CorrespondenceSource): Promise<CorrespondenceItem[]> {
    throw new Error('ePUAP integration not yet implemented')
  }

  private async fetchEmailCorrespondence(_source: CorrespondenceSource): Promise<CorrespondenceItem[]> {
    throw new Error('Email integration not yet implemented')
  }

  private async processCorrespondenceItem(
    source: CorrespondenceSource,
    item: CorrespondenceItem,
    organizationId: string,
    tenantId: string
  ): Promise<void> {
    const customerMapping = await this.customerMappingService.findOrCreateCustomer(
      organizationId,
      tenantId,
      item.sender
    )

    const shipmentData = {
      organizationId,
      tenantId,
      receivingOrgUnitId: source.defaultReceivingOrgUnitId!,
      receivingOrgUnitSymbol: source.defaultReceivingOrgUnitSymbol!,
      subject: item.subject,
      senderId: customerMapping.customerId,
      senderDisplayName: customerMapping.displayName,
      senderAnonymous: false,
      deliveryMethod: item.deliveryMethod,
      status: 'draft' as const,
      receivedAt: item.receivedAt,
      postedAt: item.postedAt || null,
      senderReference: item.senderReference || null,
      remarks: item.remarks || null,
      documentDate: item.documentDate || null,
      documentSign: item.documentSign || null,
      accessLevel: 'public' as const,
      attachmentIds: [],
    }

    await this.incomingShipmentService.create(shipmentData)
  }
}
