import { Entity, Property, ManyToOne, Enum, Index, Unique } from '@mikro-orm/core'
import { BaseEntity } from '@open-mercato/shared/lib/data/BaseEntity'

/**
 * RecordsIncomingShipment - Formal record of correspondence received by the organization
 */
@Entity({ tableName: 'records_incoming_shipments' })
@Index({ properties: ['organizationId', 'tenantId', 'status'] })
@Index({ properties: ['receivingOrgUnitId', 'receivedAt'] })
@Index({ properties: ['rpwNumber'] })
export class RecordsIncomingShipment extends BaseEntity {
  @Property()
  organizationId!: string

  @Property()
  tenantId!: string

  @Property()
  receivingOrgUnitId!: string

  @Property()
  receivingOrgUnitSymbol!: string

  @Property({ type: 'text' })
  subject!: string

  @Property({ nullable: true })
  senderId?: string

  @Property({ type: 'text', nullable: true })
  senderDisplayName?: string

  @Property({ default: false })
  senderAnonymous: boolean = false

  @Property()
  deliveryMethod!: string // edoreczenia-mock, epuap, email, postal

  @Enum({ items: ['draft', 'registered'] })
  status!: 'draft' | 'registered'

  @Property({ type: 'timestamptz' })
  receivedAt!: Date

  @Property({ type: 'text', nullable: true })
  rpwNumber?: string // RPW/{kanc_id}/{seq:5}/{yyyy}

  @Property({ nullable: true })
  rpwSequence?: number

  @Property({ type: 'uuid', array: true, default: '{}' })
  attachmentIds: string[] = []

  @Property({ type: 'timestamptz', nullable: true })
  postedAt?: Date

  @Property({ type: 'text', nullable: true })
  senderReference?: string

  @Property({ type: 'text', nullable: true })
  remarks?: string

  @Property({ type: 'timestamptz', nullable: true })
  documentDate?: Date

  @Property({ type: 'text', nullable: true })
  documentSign?: string

  @Enum({ items: ['public', 'partial', 'restricted'], nullable: true })
  accessLevel?: 'public' | 'partial' | 'restricted'

  @Property({ type: 'uuid', nullable: true })
  jrwaClassId?: string
}

/**
 * RecordsRpwSequence - Sequence generator for RPW numbers
 * Ensures unique, sequential RPW numbers per org unit per year
 */
@Entity({ tableName: 'records_rpw_sequences' })
@Unique({ properties: ['organizationId', 'tenantId', 'receivingOrgUnitId', 'year'] })
export class RecordsRpwSequence extends BaseEntity {
  @Property()
  organizationId!: string

  @Property()
  tenantId!: string

  @Property()
  receivingOrgUnitId!: string

  @Property()
  year!: number

  @Property({ default: 0 })
  currentValue: number = 0
}

/**
 * RecordsJrwaClass - Hierarchical archival classification system
 * Imported via CSV with versioning
 */
@Entity({ tableName: 'records_jrwa_classes' })
@Unique({ properties: ['organizationId', 'tenantId', 'version', 'code'] })
@Index({ properties: ['organizationId', 'tenantId', 'isActive'] })
@Index({ properties: ['parentId'] })
export class RecordsJrwaClass extends BaseEntity {
  @Property()
  organizationId!: string

  @Property()
  tenantId!: string

  @Property({ type: 'text' })
  code!: string

  @Property({ type: 'text' })
  name!: string

  @Property({ type: 'text', nullable: true })
  description?: string

  @Property({ nullable: true })
  parentId?: string

  @Property({ nullable: true })
  retentionYears?: number

  @Property({ type: 'text', nullable: true })
  retentionCategory?: string // A, B, BE, Bc, etc.

  @Property({ type: 'text', nullable: true })
  archivalPackageVariant?: string

  @Property()
  version!: number

  @Property({ default: true })
  isActive: boolean = true
}

/**
 * RecordsDocument - Document metadata linked to incoming shipments (Phase 2)
 */
@Entity({ tableName: 'records_documents' })
@Index({ properties: ['incomingShipmentId'] })
export class RecordsDocument extends BaseEntity {
  @Property()
  organizationId!: string

  @Property()
  tenantId!: string

  @Property({ type: 'text' })
  title!: string

  @Property({ type: 'text', nullable: true })
  kind?: string

  @Enum({ items: ['public', 'partial', 'restricted'], nullable: true })
  accessLevel?: 'public' | 'partial' | 'restricted'

  @Property({ nullable: true })
  incomingShipmentId?: string

  @Property({ type: 'uuid', array: true, default: '{}' })
  attachmentIds: string[] = []

  @Property({ type: 'text', nullable: true })
  disposalStatus?: string
}
