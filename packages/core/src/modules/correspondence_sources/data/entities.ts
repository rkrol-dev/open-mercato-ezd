import { Entity, Property, Enum, Index } from '@mikro-orm/core'
import { BaseEntity } from '@open-mercato/shared/lib/data/BaseEntity'

/**
 * CorrespondenceSource - Configuration for external correspondence sources
 * Supports eDoreczenia, ePUAP, email, and other integrations
 */
@Entity({ tableName: 'correspondence_sources' })
@Index({ properties: ['organizationId', 'tenantId', 'isActive'] })
export class CorrespondenceSource extends BaseEntity {
  @Property()
  organizationId!: string

  @Property()
  tenantId!: string

  @Property({ type: 'text' })
  name!: string

  @Enum({ items: ['edoreczenia-mock', 'epuap', 'email'] })
  sourceType!: 'edoreczenia-mock' | 'epuap' | 'email'

  @Property({ type: 'jsonb' })
  config!: Record<string, any>

  @Property({ default: true })
  isActive: boolean = true

  @Property({ type: 'timestamptz', nullable: true })
  lastSyncDate?: Date

  @Property({ nullable: true })
  defaultReceivingOrgUnitId?: string

  @Property({ type: 'text', nullable: true })
  defaultReceivingOrgUnitSymbol?: string
}

/**
 * CorrespondenceSyncLog - History of synchronization operations
 */
@Entity({ tableName: 'correspondence_sync_logs' })
@Index({ properties: ['sourceId', 'syncStartedAt'] })
@Index({ properties: ['organizationId', 'tenantId', 'syncStartedAt'] })
export class CorrespondenceSyncLog extends BaseEntity {
  @Property()
  organizationId!: string

  @Property()
  tenantId!: string

  @Property()
  sourceId!: string

  @Property({ type: 'timestamptz' })
  syncStartedAt!: Date

  @Property({ type: 'timestamptz', nullable: true })
  syncCompletedAt?: Date

  @Enum({ items: ['pending', 'in_progress', 'completed', 'failed'] })
  status!: 'pending' | 'in_progress' | 'completed' | 'failed'

  @Property({ default: 0 })
  itemsProcessed: number = 0

  @Property({ default: 0 })
  itemsCreated: number = 0

  @Property({ default: 0 })
  itemsSkipped: number = 0

  @Property({ default: 0 })
  itemsFailed: number = 0

  @Property({ type: 'text', nullable: true })
  errorMessage?: string

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>
}
