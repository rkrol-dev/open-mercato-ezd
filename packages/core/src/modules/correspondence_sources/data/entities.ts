import {
  Entity,
  PrimaryKey,
  Property,
  Index,
  OptionalProps,
} from '@mikro-orm/core'

export type CorrespondenceSourceType = 'edoreczenia-mock' | 'epuap' | 'email'

@Entity({ tableName: 'correspondence_sources' })
@Index({ name: 'correspondence_sources_org_tenant_idx', properties: ['organizationId', 'tenantId'] })
@Index({ name: 'correspondence_sources_is_active_idx', properties: ['isActive'] })
@Index({ name: 'correspondence_sources_source_type_idx', properties: ['sourceType'] })
export class CorrespondenceSource {
  [OptionalProps]?: 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ type: 'text' })
  name!: string

  @Property({ name: 'source_type', type: 'text' })
  sourceType!: CorrespondenceSourceType

  @Property({ type: 'jsonb' })
  config!: Record<string, any>

  @Property({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean = true

  @Property({ name: 'last_sync_date', type: Date, nullable: true })
  lastSyncDate?: Date | null

  @Property({ name: 'default_receiving_org_unit_id', type: 'uuid', nullable: true })
  defaultReceivingOrgUnitId?: string | null

  @Property({ name: 'default_receiving_org_unit_symbol', type: 'text', nullable: true })
  defaultReceivingOrgUnitSymbol?: string | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}

@Entity({ tableName: 'correspondence_sync_logs' })
@Index({ name: 'correspondence_sync_logs_org_tenant_idx', properties: ['organizationId', 'tenantId'] })
@Index({ name: 'correspondence_sync_logs_source_idx', properties: ['sourceId'] })
@Index({ name: 'correspondence_sync_logs_started_at_idx', properties: ['startedAt'] })
export class CorrespondenceSyncLog {
  [OptionalProps]?: 'createdAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'source_id', type: 'uuid' })
  sourceId!: string

  @Property({ name: 'started_at', type: Date })
  startedAt!: Date

  @Property({ name: 'completed_at', type: Date, nullable: true })
  completedAt?: Date | null

  @Property({ type: 'text' })
  status!: string

  @Property({ name: 'items_fetched', type: 'int', default: 0 })
  itemsFetched: number = 0

  @Property({ name: 'items_created', type: 'int', default: 0 })
  itemsCreated: number = 0

  @Property({ name: 'items_failed', type: 'int', default: 0 })
  itemsFailed: number = 0

  @Property({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()
}
