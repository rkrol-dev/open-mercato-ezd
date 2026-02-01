import {
  Entity,
  PrimaryKey,
  Property,
  Index,
  OptionalProps,
} from '@mikro-orm/core'

export type RecordsIncomingShipmentStatus = 'draft' | 'registered'
export type RecordsAccessLevel = 'public' | 'partial' | 'restricted'

@Entity({ tableName: 'records_incoming_shipments' })
@Index({ name: 'records_incoming_shipments_org_tenant_idx', properties: ['organizationId', 'tenantId'] })
@Index({ name: 'records_incoming_shipments_rpw_number_idx', properties: ['rpwNumber'] })
@Index({ name: 'records_incoming_shipments_status_idx', properties: ['status'] })
@Index({ name: 'records_incoming_shipments_received_at_idx', properties: ['receivedAt'] })
@Index({ name: 'records_incoming_shipments_org_unit_idx', properties: ['receivingOrgUnitId'] })
export class RecordsIncomingShipment {
  [OptionalProps]?: 'createdAt' | 'updatedAt' | 'deletedAt' | 'senderAnonymous' | 'attachmentIds'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'receiving_org_unit_id', type: 'uuid' })
  receivingOrgUnitId!: string

  @Property({ name: 'receiving_org_unit_symbol', type: 'text' })
  receivingOrgUnitSymbol!: string

  @Property({ type: 'text' })
  subject!: string

  @Property({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId?: string | null

  @Property({ name: 'sender_display_name', type: 'text', nullable: true })
  senderDisplayName?: string | null

  @Property({ name: 'sender_anonymous', type: 'boolean', default: false })
  senderAnonymous: boolean = false

  @Property({ name: 'delivery_method', type: 'text' })
  deliveryMethod!: string

  @Property({ type: 'text' })
  status!: RecordsIncomingShipmentStatus

  @Property({ name: 'received_at', type: Date })
  receivedAt!: Date

  @Property({ name: 'rpw_number', type: 'text', nullable: true })
  rpwNumber?: string | null

  @Property({ name: 'rpw_sequence', type: 'int', nullable: true })
  rpwSequence?: number | null

  @Property({ name: 'attachment_ids', type: 'uuid[]', default: '{}' })
  attachmentIds: string[] = []

  @Property({ name: 'posted_at', type: Date, nullable: true })
  postedAt?: Date | null

  @Property({ name: 'sender_reference', type: 'text', nullable: true })
  senderReference?: string | null

  @Property({ type: 'text', nullable: true })
  remarks?: string | null

  @Property({ name: 'document_date', type: Date, nullable: true })
  documentDate?: Date | null

  @Property({ name: 'document_sign', type: 'text', nullable: true })
  documentSign?: string | null

  @Property({ name: 'access_level', type: 'text', nullable: true })
  accessLevel?: RecordsAccessLevel | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}

@Entity({ tableName: 'records_rpw_sequences' })
@Index({
  name: 'records_rpw_sequences_unique_idx',
  properties: ['organizationId', 'tenantId', 'receivingOrgUnitId', 'year'],
})
export class RecordsRpwSequence {
  [OptionalProps]?: 'currentValue' | 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'receiving_org_unit_id', type: 'uuid' })
  receivingOrgUnitId!: string

  @Property({ type: 'int' })
  year!: number

  @Property({ name: 'current_value', type: 'int', default: 0 })
  currentValue: number = 0

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}

export type RecordsJrwaRetentionCategory = 'A' | 'B' | 'BE' | 'Bc'

@Entity({ tableName: 'records_jrwa_classes' })
@Index({ name: 'records_jrwa_classes_org_tenant_idx', properties: ['organizationId', 'tenantId'] })
@Index({ name: 'records_jrwa_classes_version_code_idx', properties: ['version', 'code'] })
@Index({ name: 'records_jrwa_classes_parent_idx', properties: ['parentId'] })
@Index({ name: 'records_jrwa_classes_is_active_idx', properties: ['isActive'] })
export class RecordsJrwaClass {
  [OptionalProps]?: 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ type: 'text' })
  code!: string

  @Property({ type: 'text' })
  name!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string | null

  @Property({ name: 'retention_years', type: 'int', nullable: true })
  retentionYears?: number | null

  @Property({ name: 'retention_category', type: 'text', nullable: true })
  retentionCategory?: RecordsJrwaRetentionCategory | null

  @Property({ name: 'archival_package_variant', type: 'text', nullable: true })
  archivalPackageVariant?: string | null

  @Property({ type: 'int' })
  version!: number

  @Property({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean = true

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}

@Entity({ tableName: 'records_documents' })
@Index({ name: 'records_documents_org_tenant_idx', properties: ['organizationId', 'tenantId'] })
@Index({ name: 'records_documents_shipment_idx', properties: ['incomingShipmentId'] })
export class RecordsDocument {
  [OptionalProps]?: 'attachmentIds' | 'createdAt' | 'updatedAt' | 'deletedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ type: 'text' })
  title!: string

  @Property({ type: 'text', nullable: true })
  kind?: string | null

  @Property({ name: 'access_level', type: 'text', nullable: true })
  accessLevel?: RecordsAccessLevel | null

  @Property({ name: 'incoming_shipment_id', type: 'uuid', nullable: true })
  incomingShipmentId?: string | null

  @Property({ name: 'attachment_ids', type: 'uuid[]', default: '{}' })
  attachmentIds: string[] = []

  @Property({ name: 'disposal_status', type: 'text', nullable: true })
  disposalStatus?: string | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}
