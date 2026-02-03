import type { EntityManager } from '@mikro-orm/postgresql'
import { CustomerEntity } from '@open-mercato/core/modules/customers/data/entities'

export interface SenderData {
  displayName: string
  email?: string
  identifiers?: {
    nip?: string
    regon?: string
    pesel?: string
    krs?: string
  }
}

export interface CustomerMappingResult {
  customerId: string
  displayName: string
  isNew: boolean
}

export class CustomerMappingService {
  constructor(private readonly em: EntityManager) {}

  async findOrCreateCustomer(
    organizationId: string,
    tenantId: string,
    senderData: SenderData
  ): Promise<CustomerMappingResult> {
    let customer: CustomerEntity | null = null

    if (senderData.email) {
      customer = await this.findCustomerByEmail(organizationId, tenantId, senderData.email)
    }

    if (!customer) {
      customer = await this.findCustomerByDisplayName(organizationId, tenantId, senderData.displayName)
    }

    if (customer) {
      return {
        customerId: customer.id,
        displayName: customer.displayName,
        isNew: false,
      }
    }

    const newCustomer = await this.createCustomer(organizationId, tenantId, senderData)
    return {
      customerId: newCustomer.id,
      displayName: newCustomer.displayName,
      isNew: true,
    }
  }

  private async findCustomerByEmail(
    organizationId: string,
    tenantId: string,
    email: string
  ): Promise<CustomerEntity | null> {
    return this.em.findOne(CustomerEntity, {
      organizationId,
      tenantId,
      primaryEmail: email,
      deletedAt: null,
    })
  }

  private async findCustomerByDisplayName(
    organizationId: string,
    tenantId: string,
    displayName: string
  ): Promise<CustomerEntity | null> {
    return this.em.findOne(CustomerEntity, {
      organizationId,
      tenantId,
      displayName,
      deletedAt: null,
    })
  }

  private async createCustomer(
    organizationId: string,
    tenantId: string,
    senderData: SenderData
  ): Promise<CustomerEntity> {
    const identifiers = senderData.identifiers || {}
    const hasCompanyIdentifiers = identifiers.nip || identifiers.regon || identifiers.krs
    const kind = hasCompanyIdentifiers ? 'company' : 'person'

    const customer = this.em.create(CustomerEntity, {
      organizationId,
      tenantId,
      kind,
      displayName: senderData.displayName,
      primaryEmail: senderData.email || null,
      source: 'correspondence_sync',
      isActive: true,
    })

    await this.em.persistAndFlush(customer)

    return customer
  }
}
