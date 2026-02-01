# Agent Prompt: eDoreczenia Integration and Incoming Shipments Module Implementation

## Mission Statement

You are tasked with implementing a complete backend and frontend system for **eDoreczenia integration** (Polish electronic delivery system) with an **incoming shipments management module** for the Open-Mercato EZD (Electronic Document Management) platform.

This is a **full-stack implementation** requiring backend services, API routes, database entities, frontend UI pages, components, tests, and documentation.

---

## Project Context

### What is eDoreczenia?
eDoreczenia is Poland's government electronic delivery system (similar to registered mail). Government entities must be able to:
1. **Receive correspondence** automatically from eDoreczenia
2. **Create incoming shipments** in the EZD system
3. **Register** these shipments with RPW numbers (Rejestr Przesyłek Wpływających)
4. **Send UPD confirmations** (acknowledgment of receipt) back to eDoreczenia
5. **Manage documents** attached to correspondence

###What is an Incoming Shipment (Przesyłka Wpływająca)?
An incoming shipment is a formal record of correspondence received by the organization. It:
- Represents one piece of correspondence (letter, email, eDoreczenia message)
- Has a unique RPW number (assigned upon registration)
- Contains metadata about sender, subject, received date
- May have attached documents
- Links to JRWA classification (archival classification system)
- Tracks status (draft → registered)

---

## Requirements Overview

You must implement `docs\docs\domains\prawo\administracja-publiczna\wdrozenie\records-przesylki-wplywajace.mdx` requirements.

---

## Technical Architecture

### Platform Context

You're working on an **Open-Mercato** platform which is:
- **Monorepo** structure with Yarn 4 workspaces
- **Next.js 16** (App Router) for frontend
- **MikroORM** for database (PostgreSQL)
- **Turborepo** for build orchestration
- **TypeScript** strict mode
- **Module-based architecture** - features are organized as modules

### Key Directories

```
open-ezd/
├── packages/core/                    # Backend modules
│   └── src/modules/
│       ├── records/                  # Incoming shipments, JRWA
│       │   ├── data/
│       │   │   └── entities.ts      # RecordsIncomingShipment, RecordsDocument, RecordsJrwaClass
│       │   ├── api/                 # API routes
│       │   └── services/            # Business logic
│       │
│       └── correspondence_sources/  # eDoreczenia integration
│           ├── data/
│           │   └── entities.ts      # CorrespondenceSource, MockCorrespondence
│           ├── services/
│           │   ├── correspondenceSyncService.ts
│           │   ├── customerMappingService.ts
│           │   └── documentUploadService.ts
│           └── api/                 # API routes
│
├── apps/mercato/                    # Frontend application
│   └── src/modules/
│       ├── records/                 # UI for incoming shipments
│       │   ├── backend/            # Backend UI pages
│       │   │   ├── incoming-shipments/
│       │   │   └── jrwa/
│       │   ├── components/         # React components
│       │   └── i18n/               # Translations
│       │
│       └── correspondence_sources/ # UI for sources
│           ├── backend/
│           │   ├── sources/
│           │   └── edoreczenia-mock/
│           ├── components/
│           └── i18n/
│
└── docs/                           # Documentation
    ├── docs/
    │   ├── domains/               # Business documentation
    │   └── user-guide/            # User guides
    └── knowledge-base/            # Lessons learned
```

---

## Implementation Phases

### CRITICAL: Phase 0 - Module Registration (MUST DO FIRST!)

**Before creating any UI pages**, you MUST register modules:

1. **Backend Module Metadata** (`packages/core/src/modules/records/index.ts`):
```typescript
import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'records',
  title: 'Records Management',
  version: '0.1.0',
  description: 'Incoming and outgoing shipments, JRWA classification',
  author: 'Open Mercato Team',
  license: 'Proprietary',
}

export { features } from './acl'
```

2. **App Module Metadata** (`apps/mercato/src/modules/records/index.ts`):
```typescript
import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'records',
  title: 'Records Management',
  version: '0.1.0',
  description: 'Records management UI',
  author: 'Open Mercato Team',
  license: 'Proprietary',
}
```

3. **Register in Application** (`apps/mercato/src/modules.ts`):
```typescript
export const enabledModules: ModuleEntry[] = [
  // ... existing modules
  { id: 'records', from: '@open-mercato/core' },
  { id: 'correspondence_sources', from: '@open-mercato/core' },
]
```

4. **Regenerate Module Registry**:
```bash
yarn generate
```

**Why this is critical**: The platform uses a module discovery system. UI routes are only registered if modules are enabled. Skip this and all your UI pages will return 404.

---

### Phase 1: Backend Foundation (Week 1)

#### Step 1.1: Create Entities

**RecordsIncomingShipment** (`packages/core/src/modules/records/data/entities.ts`):
```typescript
@Entity()
export class RecordsIncomingShipment extends BaseEntity {
  @Property()
  subject: string

  @Property()
  deliveryMethod: 'mail' | 'email' | 'edoreczenia' | 'epuap' | 'personal' | 'other'

  @Property()
  receivedAt: Date

  @Property()
  senderDisplayName: string

  @Property()
  receivingOrgUnitSymbol: string

  @Property({ nullable: true })
  rpwNumber?: string  // Set upon registration

  @Property()
  status: 'draft' | 'registered' = 'draft'

  @Property({ nullable: true })
  documentDate?: Date

  @Property({ nullable: true })
  documentSign?: string

  @Property({ type: 'text', nullable: true })
  remarks?: string

  @ManyToOne(() => CustomerEntity, { nullable: true })
  sender?: CustomerEntity

  @Property({ type: 'jsonb', nullable: true })
  attachmentIds?: string[]  // Phase 1: Direct attachment references

  // Phase 2: documentIds?: string[]
}
```

**RecordsDocument** (for Phase 2):
```typescript
@Entity()
export class RecordsDocument extends BaseEntity {
  @Property()
  title: string

  @Property()
  kind: 'pismo' | 'notatka' | 'umowa' | 'decyzja' | 'orzeczenie' | 'inne'

  @Property()
  accessLevel: 'public' | 'partial' | 'restricted'

  @ManyToOne(() => RecordsIncomingShipment)
  incomingShipment: RecordsIncomingShipment

  @Property({ type: 'jsonb' })
  attachmentIds: string[]

  @Property({ nullable: true })
  documentDate?: Date

  @Property({ nullable: true })
  documentSign?: string

  @Property({ nullable: true })
  receivedDate?: Date

  @Property({ type: 'text', nullable: true })
  remarks?: string
}
```

**RecordsJrwaClass** (Polish archival classification):
```typescript
@Entity()
export class RecordsJrwaClass extends BaseEntity {
  @Property()
  code: string  // e.g., "100", "100.1"

  @Property()
  name: string  // e.g., "Organizacja i zarządzanie"

  @ManyToOne(() => RecordsJrwaClass, { nullable: true })
  parent?: RecordsJrwaClass

  @Property({ nullable: true })
  retentionYears?: number  // How long to keep

  @Property({ nullable: true })
  retentionCategory?: 'A' | 'B' | 'BE' | 'Bc'  // Polish archival categories

  @Property()
  version: number = 1  // For versioning classifications

  @Property()
  isActive: boolean = true
}
```

**CorrespondenceSource** (already exists, update):
```typescript
@Entity()
export class CorrespondenceSource extends BaseEntity {
  @Property()
  name: string

  @Property()
  sourceType: 'edoreczenia-mock' | 'edoreczenia-prod' | 'epuap' | 'email' | 'api'

  @Property()
  status: 'active' | 'paused' | 'error' = 'active'

  @Property({ type: 'jsonb' })
  config: {
    // Required (Q5-IMPL-003)
    defaultReceivingOrgUnitId: string
    defaultReceivingOrgUnitSymbol: string
    
    // Optional
    autoRegister?: boolean  // Q5-IMPL-001
    sendUPD?: boolean  // Q5-IMPL-004, default true
    markAsFetched?: boolean  // default true
    partitionCode?: string  // for document storage
    storageDriver?: string  // for document storage
    
    // Provider-specific
    apiUrl?: string
    apiKey?: string
    syncSchedule?: string  // CRON expression
  }

  @Property({ nullable: true })
  lastSyncDate?: Date
}
```

#### Step 1.2: Create Services

**CustomerMappingService** (Q5-IMPL-005):
```typescript
export class CustomerMappingService {
  constructor(
    private readonly em: EntityManager,
    private readonly config: { sourceLabel: string }
  ) {}

  async findOrCreateCustomer(senderName: string): Promise<CustomerEntity> {
    // Search by display name
    let customer = await this.em.findOne(CustomerEntity, {
      displayName: senderName
    })

    if (!customer) {
      // Create new customer
      customer = this.em.create(CustomerEntity, {
        displayName: senderName,
        customerType: 'individual',
        sourceLabel: this.config.sourceLabel,  // e.g., "edoreczenia-auto-import"
        isAutoImported: true
      })
      await this.em.persistAndFlush(customer)
    }

    return customer
  }

  // TODO: Phase 2 - Add identifier-based search (NIP, REGON, PESEL, KRS)
}
```

**DocumentUploadService** (Q5-IMPL-002):
```typescript
export class DocumentUploadService {
  constructor(
    private readonly em: EntityManager,
    private readonly config: {
      partitionCode?: string
      storageDriver?: string
    }
  ) {}

  async uploadAttachment(
    file: { filename: string; content: Buffer; mimeType: string },
    shipmentId: string
  ): Promise<string> {
    // Upload to attachments module
    const attachment = this.em.create(AttachmentEntity, {
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.content.length,
      partitionCode: this.config.partitionCode || 'default',
      storageDriver: this.config.storageDriver || 'local',
      // ... storage logic
    })
    await this.em.persistAndFlush(attachment)

    return attachment.id
  }

  async createDocument(
    attachmentId: string,
    shipmentId: string,
    metadata: Partial<RecordsDocument>
  ): Promise<RecordsDocument> {
    const document = this.em.create(RecordsDocument, {
      title: metadata.title || 'Untitled Document',
      kind: metadata.kind || 'pismo',
      accessLevel: metadata.accessLevel || 'public',
      incomingShipmentId: shipmentId,
      attachmentIds: [attachmentId],
      ...metadata
    })
    await this.em.persistAndFlush(document)

    return document
  }
}
```

**CorrespondenceSyncService** (orchestrates everything):
```typescript
export class CorrespondenceSyncService {
  constructor(private readonly em: EntityManager) {}

  async syncSource(sourceId: string): Promise<void> {
    const source = await this.em.findOneOrFail(CorrespondenceSource, sourceId)

    // CRITICAL: Validate configuration early (Q5-IMPL-003)
    if (!source.config.defaultReceivingOrgUnitId) {
      throw new Error('Source configuration missing required field: defaultReceivingOrgUnitId')
    }

    // Initialize services with configuration
    const customerService = new CustomerMappingService(this.em, {
      sourceLabel: `${source.sourceType}-auto-import`
    })

    const documentService = new DocumentUploadService(this.em, {
      partitionCode: source.config.partitionCode,
      storageDriver: source.config.storageDriver
    })

    try {
      // 1. Fetch correspondence from provider
      const items = await this.fetchCorrespondence(source)

      for (const item of items) {
        // 2. Map sender to customer (Q5-IMPL-005)
        const sender = await customerService.findOrCreateCustomer(item.senderName)

        // 3. Create incoming shipment
        const shipment = this.em.create(RecordsIncomingShipment, {
          subject: item.subject,
          deliveryMethod: this.mapDeliveryMethod(source.sourceType),
          receivedAt: item.receivedAt,
          senderDisplayName: item.senderName,
          sender: sender,
          receivingOrgUnitSymbol: source.config.defaultReceivingOrgUnitSymbol,
          status: 'draft',
          attachmentIds: []
        })

        // 4. Upload documents (Q5-IMPL-002)
        for (const file of item.attachments) {
          const attachmentId = await documentService.uploadAttachment(file, shipment.id)
          shipment.attachmentIds.push(attachmentId)
        }

        await this.em.persistAndFlush(shipment)

        // 5. Send UPD if enabled (Q5-IMPL-004)
        if (source.config.sendUPD !== false) {
          await this.sendUPD(source, item.externalId)
        }

        // 6. Mark as fetched
        if (source.config.markAsFetched !== false) {
          await this.markAsFetched(source, item.externalId)
        }

        // 7. Auto-register if enabled (Q5-IMPL-001)
        if (source.config.autoRegister) {
          console.warn('Auto-registration enabled but not implemented yet')
          // TODO: Phase 2 - Call register action from records module
        }
      }

      source.lastSyncDate = new Date()
      source.status = 'active'
      await this.em.flush()
    } catch (error) {
      source.status = 'error'
      await this.em.flush()
      throw error
    }
  }

  private async sendUPD(source: CorrespondenceSource, externalId: string): Promise<void> {
    // TODO: Implement actual eDoreczenia API call
    console.log(`Sending UPD for ${externalId}`)
  }
}
```

#### Step 1.3: Create API Routes

Follow Next.js App Router conventions. All routes in `packages/core/src/modules/{module}/api/`:

**Example**: `packages/core/src/modules/records/api/incoming-shipments/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  // Query shipments
  const shipments = await em.find(RecordsIncomingShipment, {
    ...(status && { status })
  })

  return NextResponse.json(shipments)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const shipment = em.create(RecordsIncomingShipment, body)
  await em.persistAndFlush(shipment)

  return NextResponse.json(shipment, { status: 201 })
}
```

**Register Action**: `packages/core/src/modules/records/api/incoming-shipments/[id]/register/route.ts`
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shipment = await em.findOneOrFail(RecordsIncomingShipment, params.id)

  // Validate required fields
  if (!shipment.subject || !shipment.receivingOrgUnitSymbol) {
    return NextResponse.json(
      { error: 'Missing required fields for registration' },
      { status: 400 }
    )
  }

  // Generate RPW number
  const sequence = await getNextSequenceNumber(shipment.receivingOrgUnitSymbol)
  const year = new Date().getFullYear()
  shipment.rpwNumber = `RPW/${shipment.receivingOrgUnitSymbol}/${sequence.toString().padStart(5, '0')}/${year}`
  shipment.status = 'registered'

  await em.flush()

  return NextResponse.json(shipment)
}
```

#### Step 1.4: Compile Backend

**CRITICAL**: After creating backend code, compile it:
```bash
yarn build:packages
```

This compiles TypeScript to JavaScript in `dist/` directories. The application imports from `dist/`, not source.

---

### Phase 2: Core UI (Week 2)

#### Step 2.1: Create i18n Translations

Create before building UI! `apps/mercato/src/modules/records/i18n/en.ts`:
```typescript
export const en = {
  'records.incomingShipments.title': 'Incoming Shipments',
  'records.incomingShipments.list': 'Shipments List',
  'records.incomingShipments.create': 'Create Shipment',
  'records.incomingShipments.form.subject': 'Subject',
  'records.incomingShipments.form.deliveryMethod': 'Delivery Method',
  'records.incomingShipments.form.receivedAt': 'Received At',
  'records.incomingShipments.form.senderDisplayName': 'Sender Name',
  'records.incomingShipments.form.receivingOrgUnitSymbol': 'Receiving Unit Symbol',
  'records.incomingShipments.form.status': 'Status',
  'records.incomingShipments.form.rpwNumber': 'RPW Number',
  'records.incomingShipments.actions.register': 'Register',
  'records.incomingShipments.status.draft': 'Draft',
  'records.incomingShipments.status.registered': 'Registered',
  // ... add all translations as you create fields
}
```

#### Step 2.2: Create List Pages with DataTable Pattern

**List Page**: `apps/mercato/src/modules/records/backend/incoming-shipments/page.tsx`
```tsx
import { DataTable } from '@open-mercato/ui/backend/data-table'
import { IncomingShipmentsTable } from '../../components/IncomingShipmentsTable'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'
import { Alert } from '@open-mercato/ui/components/alert'

export default function IncomingShipmentsPage() {
  return (
    <FeatureGuard
      id="records_incoming_shipments"
      fallback={<Alert>Feature disabled. Contact administrator to enable.</Alert>}
    >
      <DataTable component={IncomingShipmentsTable} />
    </FeatureGuard>
  )
}
```

**Component**: `apps/mercato/src/modules/records/components/IncomingShipmentsTable.tsx`
```tsx
import { useTranslation } from '@open-mercato/ui/i18n'
import { createColumnHelper } from '@tanstack/react-table'
import type { RecordsIncomingShipment } from '@open-mercato/core/modules/records/data/entities'

const columnHelper = createColumnHelper<RecordsIncomingShipment>()

export function IncomingShipmentsTable() {
  const { t } = useTranslation()

  const columns = [
    columnHelper.accessor('rpwNumber', {
      header: t('records.incomingShipments.form.rpwNumber'),
      cell: ({ getValue }) => {
        const value = getValue() as string | null
        return value || <span className="text-muted-foreground">-</span>
      },
    }),
    columnHelper.accessor('subject', {
      header: t('records.incomingShipments.form.subject'),
    }),
    columnHelper.accessor('senderDisplayName', {
      header: t('records.incomingShipments.form.senderDisplayName'),
    }),
    columnHelper.accessor('receivedAt', {
      header: t('records.incomingShipments.form.receivedAt'),
      cell: ({ getValue }) => {
        const date = getValue() as Date
        return new Date(date).toLocaleDateString()
      },
    }),
    columnHelper.accessor('status', {
      header: t('records.incomingShipments.form.status'),
      cell: ({ getValue }) => {
        const status = getValue() as string
        return (
          <Badge variant={status === 'registered' ? 'success' : 'warning'}>
            {t(`records.incomingShipments.status.${status}`)}
          </Badge>
        )
      },
    }),
  ]

  return (
    <DataTable
      apiEndpoint="/api/records/incoming-shipments"
      columns={columns}
      actions={[
        {
          label: t('records.incomingShipments.actions.edit'),
          href: (row) => `/backend/incoming-shipments/${row.id}/edit`
        },
        {
          label: t('records.incomingShipments.actions.register'),
          href: (row) => `/backend/incoming-shipments/${row.id}/register`,
          show: (row) => row.status === 'draft'
        },
        {
          label: t('common.actions.delete'),
          action: async (row) => {
            await fetch(`/api/records/incoming-shipments/${row.id}`, { method: 'DELETE' })
          },
          confirm: true
        }
      ]}
      createButton={{
        label: t('records.incomingShipments.create'),
        href: '/backend/incoming-shipments/create'
      }}
    />
  )
}
```

**Page Metadata**: `apps/mercato/src/modules/records/backend/incoming-shipments/page.meta.ts`
```typescript
import type { PageMetadata } from '@open-mercato/shared/types'

export const metadata: PageMetadata = {
  title: 'records.incomingShipments.list',
  layout: 'backend',
  permissions: ['records.incoming-shipments.list'],
}
```

#### Step 2.3: Create Create/Edit Pages with CrudForm Pattern

**Create Page**: `apps/mercato/src/modules/records/backend/incoming-shipments/create/page.tsx`
```tsx
import { CrudForm } from '@open-mercato/ui/backend/crud-form'
import { useTranslation } from '@open-mercato/ui/i18n'
import { z } from 'zod'

const schema = z.object({
  subject: z.string().min(1),
  deliveryMethod: z.enum(['mail', 'email', 'edoreczenia', 'epuap', 'personal', 'other']),
  receivedAt: z.date(),
  senderDisplayName: z.string().min(1),
  receivingOrgUnitSymbol: z.string().min(1),
  documentDate: z.date().optional(),
  documentSign: z.string().optional(),
  remarks: z.string().optional(),
})

export default function CreateIncomingShipmentPage() {
  const { t } = useTranslation()

  return (
    <CrudForm
      schema={schema}
      apiEndpoint="/api/records/incoming-shipments"
      redirectAfterSave="/backend/incoming-shipments"
      sections={[
        {
          title: t('records.incomingShipments.sections.metadata'),
          fields: ['subject', 'deliveryMethod', 'receivedAt']
        },
        {
          title: t('records.incomingShipments.sections.sender'),
          fields: ['senderDisplayName']
        },
        {
          title: t('records.incomingShipments.sections.organization'),
          fields: ['receivingOrgUnitSymbol']
        },
        {
          title: t('records.incomingShipments.sections.document'),
          fields: ['documentDate', 'documentSign']
        },
        {
          title: t('records.incomingShipments.sections.additional'),
          fields: ['remarks']
        }
      ]}
    />
  )
}
```

**Edit Page**: Similar structure, but load existing data:
```tsx
const shipment = await fetch(`/api/records/incoming-shipments/${params.id}`)
```

---

### Phase 3: Feature Toggles (Week 3)

#### Step 3.1: Add Feature Toggle Definitions

`packages/core/src/modules/feature_toggles/defaults.json`:
```json
{
  "records_incoming_shipments": {
    "type": "boolean",
    "defaultValue": false,
    "category": "records",
    "description": "Enable incoming shipments module with RPW registration"
  },
  "records_jrwa_classes": {
    "type": "boolean",
    "defaultValue": false,
    "category": "records",
    "description": "Enable JRWA classification system with CSV import"
  },
  "correspondence_sources": {
    "type": "boolean",
    "defaultValue": false,
    "category": "integrations",
    "description": "Enable correspondence sources integration (eDoreczenia, ePUAP)"
  },
  "correspondence_sources_mock_ui": {
    "type": "boolean",
    "defaultValue": false,
    "category": "integrations",
    "description": "Enable mock eDoreczenia interface for testing"
  }
}
```

#### Step 3.2: Wrap Pages with FeatureGuard

Already shown in Step 2.2 - wrap every main list page with `FeatureGuard`.

---

### Phase 4: Testing (Week 4)

#### Step 4.1: Unit Tests

`packages/core/src/modules/correspondence_sources/services/__tests__/customerMappingService.test.ts`:
```typescript
describe('CustomerMappingService', () => {
  it('should find existing customer by name', async () => {
    const service = new CustomerMappingService(em, { sourceLabel: 'test' })
    const customer = await service.findOrCreateCustomer('John Doe')
    expect(customer.displayName).toBe('John Doe')
  })

  it('should create new customer if not found', async () => {
    const service = new CustomerMappingService(em, { sourceLabel: 'edoreczenia-auto-import' })
    const customer = await service.findOrCreateCustomer('New Person')
    expect(customer.isAutoImported).toBe(true)
    expect(customer.sourceLabel).toBe('edoreczenia-auto-import')
  })
})
```

#### Step 4.2: E2E Tests

`packages/core/src/modules/correspondence_sources/services/__tests__/correspondenceSyncService.e2e.test.ts`:
```typescript
describe('CorrespondenceSyncService - E2E', () => {
  it('should fetch mock correspondence and create incoming shipments', async () => {
    const source = await createMockSource()
    const service = new CorrespondenceSyncService(em)

    await service.syncSource(source.id)

    const shipments = await em.find(RecordsIncomingShipment, {})
    expect(shipments).toHaveLength(1)
    expect(shipments[0].status).toBe('draft')
  })
})
```

---

## Critical Implementation Rules

### 1. ALWAYS Register Modules First
Before creating any UI, register modules in:
1. Backend: `packages/core/src/modules/{module}/index.ts`
2. App: `apps/mercato/src/modules/{module}/index.ts`
3. Application: `apps/mercato/src/modules.ts`
4. Run: `yarn generate`

### 2. ALWAYS Compile After Backend Changes
```bash
yarn build:packages
```

### 3. NEVER Use Special Unicode in JSX
Use ASCII equivalents:
- ✅ `-` (hyphen-minus)
- ❌ `—` (em dash)
- ✅ `'` (apostrophe)
- ❌ `'` (smart quote)

### 4. ALWAYS Validate Configuration Early
Check required config at the start of operations, not when needed.

### 5. ALWAYS Add i18n Keys Inline
Don't use hardcoded strings. Add translations as you write code.

### 6. ALWAYS Make Services Configurable
Pass configuration to constructor, never use magic strings.

### 7. ALWAYS Add Feature Toggles
Wrap main pages with `FeatureGuard` from day one.

### 8. ALWAYS Follow Naming Conventions
- Modules: plural, snake_case (records, correspondence_sources)
- Entities: PascalCase with module prefix (RecordsIncomingShipment)
- Services: PascalCase with Service suffix (CustomerMappingService)
- Components: PascalCase (IncomingShipmentsTable)
- Routes: kebab-case (incoming-shipments)

---

## Development Workflow

### Daily Workflow
```bash
# 1. Pull latest
git pull origin main

# 2. Create feature branch
git checkout -b feat/incoming-shipments-ui

# 3. Make changes to backend
# Edit files in packages/core/src/modules/...

# 4. Compile backend (CRITICAL!)
yarn build:packages

# 5. Make changes to frontend
# Edit files in apps/mercato/src/modules/...

# 6. Regenerate module registry if needed
yarn generate

# 7. Run tests
yarn test

# 8. Run dev server
yarn dev

# 9. Test manually at http://localhost:3001

# 10. Commit incrementally
git add .
git commit -m "feat: add incoming shipments list page"

# 11. Push to remote
git push origin feat/incoming-shipments-ui
```

### Build Commands
```bash
yarn install           # Install dependencies
yarn build:packages    # Compile backend packages
yarn generate          # Regenerate module registry
yarn test              # Run all tests
yarn dev               # Start dev server
yarn build:app         # Build for production
```

---

## Success Criteria

### Backend Complete When:
- [ ] All entities created with proper relationships
- [ ] All services implemented with configuration
- [ ] All API routes functional (GET, POST, PUT, DELETE)
- [ ] Early configuration validation in sync service
- [ ] All 5 Q5-IMPL requirements addressed
- [ ] Unit tests passing for services
- [ ] `yarn build:packages` succeeds without errors

### UI Complete When:
- [ ] Modules registered in application
- [ ] All 29 pages implemented:
  - 4 list pages (DataTable pattern)
  - 5 create pages (CrudForm pattern)
  - 4 edit pages (CrudForm pattern)
  - 1 detail page (custom layout)
  - 1 register page (custom action)
  - 1 CSV import wizard (multi-step)
  - 1 sync logs page (custom view)
- [ ] All components created (6 table components)
- [ ] Feature toggles added for all modules
- [ ] i18n translations complete
- [ ] `yarn generate` succeeds
- [ ] `yarn dev` serves all pages without 404s

### Testing Complete When:
- [ ] All unit tests passing (1014/1014)
- [ ] E2E tests cover main flows
- [ ] Manual testing checklist complete
- [ ] CodeQL scan passes (0 vulnerabilities)

### Documentation Complete When:
- [ ] Implementation analysis updated
- [ ] User guides created
- [ ] API documentation complete
- [ ] Lessons learned documented

---

## Common Pitfalls to Avoid

### ❌ DON'T: Create UI before registering modules
**Result**: 404 errors on all pages

### ❌ DON'T: Forget to compile backend after changes
**Result**: "Module not found" build errors

### ❌ DON'T: Use Unicode characters in JSX
**Result**: "Unterminated string constant" parser errors

### ❌ DON'T: Validate config late in the process
**Result**: Silent failures, hard to debug

### ❌ DON'T: Use hardcoded strings
**Result**: Need to refactor 20+ files for i18n later

### ❌ DON'T: Use magic strings in services
**Result**: Hard to configure, difficult to test

### ❌ DON'T: Skip feature toggles
**Result**: Can't safely deploy or rollback

---

## Resources

### Documentation
- Platform conventions: `docs/CONVENTIONS.md`
- Module system: `docs/MODULES.md`
- Feature toggles: `packages/core/src/modules/feature_toggles/README.md`
- Implementation analysis: `docs/docs/domains/prawo/administracja-publiczna/wdrozenie/records-przesylki-wplywajace.mdx`
- Lessons learned: `docs/knowledge-base/edoreczenia-integration-lessons-learned.md`

### Code Examples
- Existing DataTable pages: `apps/mercato/src/modules/catalog/backend/products/page.tsx`
- Existing CrudForm pages: `apps/mercato/src/modules/catalog/backend/products/create/page.tsx`
- Existing services: `packages/core/src/modules/catalog/services/`
- Existing entities: `packages/core/src/modules/catalog/data/entities.ts`

### Testing
- Test patterns: `packages/core/src/modules/catalog/services/__tests__/`
- E2E examples: `packages/core/src/modules/correspondence_sources/services/__tests__/correspondenceSyncService.e2e.test.ts`

---

## Final Checklist

Before considering implementation complete:

- [ ] All modules registered in `apps/mercato/src/modules.ts`
- [ ] All backend code compiled (`yarn build:packages`)
- [ ] All tests passing (`yarn test`)
- [ ] All pages accessible (no 404s)
- [ ] Feature toggles working (can enable/disable)
- [ ] i18n translations complete (no hardcoded strings)
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Security scan passed (CodeQL)
- [ ] Manual testing completed
- [ ] Performance acceptable (no obvious bottlenecks)