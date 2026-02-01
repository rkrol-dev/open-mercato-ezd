# eDoreczenia & Incoming Shipments - Complete Reimplementation Guide v2.0

## Executive Summary

**Purpose**: This document provides complete, validated implementation guidance for reimplementing the eDoreczenia integration and incoming shipments module from scratch, incorporating all lessons learned from the first iteration failure.

**First Iteration Failure Analysis**:
- ✅ All 1014 tests passing
- ❌ **Application broken at runtime**
- ❌ UI throws errors when clicked
- ❌ Routes don't work despite module registration
- **Root Cause**: Tests validated individual units in isolation but never validated the **integrated system at runtime**

**What This Guide Fixes**:
1. **Integration validation** at every phase milestone
2. **Runtime smoke tests** before proceeding to next phase
3. **Manual UI verification** procedures  
4. **Clear rollback triggers** when validation fails
5. **Definition of Done** that includes working UI, not just green tests

---

## Critical Success Factors

### 1. The Test Paradox

**First Iteration Problem**: "All tests green, application broken"

**Why This Happened**:
- Unit tests mocked all dependencies → never tested actual integration
- No tests verified module registry generation
- No tests verified UI → Backend → Database flow
- E2E tests used test database → didn't catch prod config issues

**V2 Solution**: **Three-Layer Testing Strategy**

```
Layer 1: Unit Tests (80% coverage)
├─ Services in isolation
├─ Utilities and helpers
└─ Mock all external dependencies

Layer 2: Integration Tests (Required for each milestone)
├─ Service → Repository → Database
├─ API Route → Service → Database
├─ Module Registry Generation
└─ Feature Toggle Integration

Layer 3: Runtime Smoke Tests (Manual, Required)
├─ Start app with `yarn dev`
├─ Navigate to each new route in browser
├─ Click every button/action
├─ Verify no console errors
└─ Test with feature toggles ON and OFF
```

### 2. The Integration Checkpoints

**Never proceed to the next phase without validating the current phase works at runtime.**

**Phase Validation Matrix**:

| Phase | Green Tests Required? | Runtime Validation Required? | Proceed If Fails? |
|-------|----------------------|------------------------------|-------------------|
| **Phase 0: Module Registration** | No | ✅ **YES** - Routes must be 200 | ❌ **STOP** |
| **Phase 1: Backend Foundation** | ✅ **YES** - Services tested | ✅ **YES** - API calls return data | ❌ **STOP** |
| **Phase 2: Core UI** | ✅ **YES** - Components tested | ✅ **YES** - Pages render, buttons work | ❌ **STOP** |
| **Phase 3: Extended UI** | ✅ **YES** - Features tested | ✅ **YES** - Workflows complete | ❌ **STOP** |
| **Phase 4: Production Readiness** | ✅ **YES** - E2E passing | ✅ **YES** - Full user flow works | ❌ **STOP** |

### 3. The Runtime Validation Protocol

After **every commit** that adds a feature:

```bash
# 1. Rebuild (if backend changes)
yarn build:packages

# 2. Regenerate module registry (if routes/pages added)
yarn generate

# 3. Start dev server
yarn dev

# 4. Open browser to http://localhost:3001

# 5. Navigate to the new feature

# 6. Verify in browser console (F12):
#    - No red errors
#    - No 404s in Network tab
#    - No React hydration errors

# 7. Click every interactive element

# 8. If ANY error → STOP, fix, repeat validation
```

**DO NOT** proceed to next feature if validation fails.

---

## Phase 0: Module Registration (CRITICAL FIRST STEP)

**Goal**: Ensure modules are discoverable by the application **BEFORE** writing any code

### Why This Phase Exists

**First Iteration Mistake**: Created 20+ UI pages, then discovered they all 404 because modules weren't registered.

**V2 Approach**: Register modules first, validate routes work, THEN build features.

### Step 0.1: Create Module Metadata (Backend)

**For `records` module**:

```typescript
// packages/core/src/modules/records/index.ts
import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  id: 'records',
  title: 'Records Management',
  version: '1.0.0',
  description: 'Incoming shipments, JRWA classification, document management',
}
```

**For `correspondence_sources` module**:

```typescript
// packages/core/src/modules/correspondence_sources/index.ts
import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  id: 'correspondence_sources',
  title: 'Correspondence Sources',
  version: '1.0.0',
  description: 'eDoreczenia and ePUAP integration for automatic correspondence sync',
}
```

### Step 0.2: Create App-Level Module Metadata

**For `records` module**:

```typescript
// apps/mercato/src/modules/records/index.ts
export { metadata } from '@open-mercato/core/modules/records'
```

**For `correspondence_sources` module**:

```typescript
// apps/mercato/src/modules/correspondence_sources/index.ts
export { metadata } from '@open-mercato/core/modules/correspondence_sources'
```

### Step 0.3: Register Modules in Application

```typescript
// apps/mercato/src/modules.ts
import { defineModules } from '@open-mercato/shared/modules'

export default defineModules([
  // Existing modules
  { id: 'auth', from: '@open-mercato/core' },
  { id: 'directory', from: '@open-mercato/core' },
  { id: 'entities', from: '@open-mercato/core' },
  
  // NEW: Add these two lines
  { id: 'records', from: '@open-mercato/core' },
  { id: 'correspondence_sources', from: '@open-mercato/core' },
])
```

### Step 0.4: Create Placeholder Pages

**Create minimal pages to test routing**:

```bash
# records module placeholder
mkdir -p packages/core/src/modules/records/backend/incoming-shipments
```

```typescript
// packages/core/src/modules/records/backend/incoming-shipments/page.tsx
export default function IncomingShipmentsPlaceholder() {
  return (
    <div>
      <h1>Incoming Shipments</h1>
      <p>Module registered successfully! This page works.</p>
    </div>
  )
}
```

```typescript
// packages/core/src/modules/records/backend/incoming-shipments/page.meta.ts
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Incoming Shipments',
  group: 'Records',
  order: 10,
  requireAuth: true,
  requireFeatures: ['records.view'],
}
```

**Repeat for correspondence_sources**:

```bash
mkdir -p packages/core/src/modules/correspondence_sources/backend/sources
```

```typescript
// packages/core/src/modules/correspondence_sources/backend/sources/page.tsx
export default function CorrespondenceSourcesPlaceholder() {
  return (
    <div>
      <h1>Correspondence Sources</h1>
      <p>Module registered successfully! This page works.</p>
    </div>
  )
}
```

```typescript
// packages/core/src/modules/correspondence_sources/backend/sources/page.meta.ts
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Correspondence Sources',
  group: 'Integration',
  order: 20,
  requireAuth: true,
  requireFeatures: ['correspondence_sources.manage'],
}
```

### Step 0.5: Generate Module Registry

```bash
yarn generate
```

**Expected Output**:
```
✓ Generated module registry: .mercato/generated/modules.generated.ts
✓ Found 2 new modules: records, correspondence_sources
✓ Registered 2 new routes: /backend/incoming-shipments, /backend/sources
```

### Step 0.6: **CRITICAL VALIDATION** - Runtime Smoke Test

```bash
yarn dev
```

**Open Browser**:
1. Navigate to `http://localhost:3001/backend/incoming-shipments`
2. Navigate to `http://localhost:3001/backend/sources`

**Validation Checklist**:
- [ ] Both pages return **200 OK** (not 404)
- [ ] Placeholder text displays correctly
- [ ] No console errors (F12)
- [ ] No hydration errors
- [ ] Pages appear in sidebar navigation

**If ANY validation fails**:
1. ❌ **STOP**  
2. Debug the module registration issue
3. Do NOT proceed to Phase 1
4. Repeat validation until all items checked

### Step 0.7: Commit Checkpoint

```bash
git add .
git commit -m "Phase 0: Module registration with validated routes

- Created metadata for records and correspondence_sources modules
- Registered modules in apps/mercato/src/modules.ts
- Added placeholder pages to test routing
- Validated routes return 200 OK at runtime
- No console errors in browser

✅ Runtime validation PASSED
✅ Ready for Phase 1: Backend Foundation"
```

**Phase 0 Definition of Done**:
- ✅ Modules registered in modules.ts
- ✅ Metadata files created
- ✅ `yarn generate` runs successfully
- ✅ Placeholder pages accessible via browser
- ✅ No 404 errors
- ✅ No console errors
- ✅ **Validated at runtime by opening URLs in browser**

---

## Phase 1: Backend Foundation (Services, Entities, APIs)

**Duration**: 40 hours (1 week)  
**Goal**: Implement all backend services, database entities, and API routes with **integration tests**

### Why This Phase Must Include Integration Tests

**First Iteration Mistake**: Service tests mocked EntityManager → didn't catch:
- Entity relationship errors
- Migration issues
- Query performance problems
- Transaction handling bugs

**V2 Approach**: Test services against **real test database**.

### Step 1.1: Database Entities

**Create entities first** (defines data model):

```typescript
// packages/core/src/modules/records/data/entities.ts
import { Entity, Property, ManyToOne, OneToMany, Enum } from '@mikro-orm/core'
import { BaseEntity } from '@open-mercato/core/data/base'

@Entity({ tableName: 'records_incoming_shipments' })
export class RecordsIncomingShipment extends BaseEntity {
  @Property()
  subject: string

  @Property({ nullable: true })
  sender_name?: string

  @Property({ nullable: true })
  sender_address?: string

  @Property({ type: 'timestamptz' })
  received_at: Date

  @Enum(() => ShipmentStatus)
  status: ShipmentStatus = ShipmentStatus.DRAFT

  @Property({ nullable: true })
  rpw_number?: string

  @Property({ type: 'timestamptz', nullable: true })
  registered_at?: Date

  @ManyToOne(() => OrgUnit)
  receiving_org_unit: OrgUnit

  @OneToMany(() => RecordsDocument, doc => doc.shipment)
  documents = new Collection<RecordsDocument>(this)
}

export enum ShipmentStatus {
  DRAFT = 'draft',
  REGISTERED = 'registered',
}

@Entity({ tableName: 'records_documents' })
export class RecordsDocument extends BaseEntity {
  @Property()
  title: string

  @Property({ nullable: true })
  kind?: string

  @ManyToOne(() => RecordsIncomingShipment)
  shipment: RecordsIncomingShipment

  @ManyToOne(() => Attachment, { nullable: true })
  attachment?: Attachment
}

@Entity({ tableName: 'records_jrwa_classes' })
export class RecordsJrwaClass extends BaseEntity {
  @Property()
  code: string

  @Property()
  name: string

  @Property({ nullable: true })
  parent_id?: string

  @Property()
  retention_years: number

  @Property()
  retention_category: string  // A, B, BE, Bc
}
```

### Step 1.2: Migrations

```bash
yarn mikro-orm migration:create --name add_records_tables
```

**Validate migration**:

```bash
# Apply migration to test database
yarn mikro-orm migration:up

# Verify tables exist
psql -d ezd_test -c "\dt records_*"
```

**Expected Output**:
```
 records_incoming_shipments
 records_documents
 records_jrwa_classes
```

### Step 1.3: Services with Integration Tests

**Create service**:

```typescript
// packages/core/src/modules/records/services/incomingShipmentService.ts
import { EntityManager } from '@mikro-orm/core'
import { RecordsIncomingShipment, ShipmentStatus } from '../data/entities'

export class IncomingShipmentService {
  constructor(private em: EntityManager) {}

  async createShipment(data: {
    subject: string
    sender_name?: string
    received_at: Date
    receiving_org_unit_id: string
  }): Promise<RecordsIncomingShipment> {
    const orgUnit = await this.em.findOneOrFail(OrgUnit, data.receiving_org_unit_id)
    
    const shipment = new RecordsIncomingShipment()
    shipment.subject = data.subject
    shipment.sender_name = data.sender_name
    shipment.received_at = data.received_at
    shipment.receiving_org_unit = orgUnit
    shipment.status = ShipmentStatus.DRAFT

    await this.em.persistAndFlush(shipment)
    return shipment
  }

  async registerShipment(shipmentId: string, userId: string): Promise<void> {
    const shipment = await this.em.findOneOrFail(RecordsIncomingShipment, shipmentId, {
      populate: ['receiving_org_unit'],
    })

    if (shipment.status === ShipmentStatus.REGISTERED) {
      throw new Error('Shipment already registered')
    }

    // Generate RPW number
    const sequence = await this.getNextRPWSequence(shipment.receiving_org_unit.id)
    const year = new Date().getFullYear()
    shipment.rpw_number = `RPW/${shipment.receiving_org_unit.symbol}/${sequence}/${year}`
    shipment.status = ShipmentStatus.REGISTERED
    shipment.registered_at = new Date()

    await this.em.persistAndFlush(shipment)
  }

  private async getNextRPWSequence(orgUnitId: string): Promise<number> {
    const year = new Date().getFullYear()
    const lastShipment = await this.em.findOne(
      RecordsIncomingShipment,
      {
        receiving_org_unit: orgUnitId,
        registered_at: { $gte: new Date(`${year}-01-01`) },
      },
      { orderBy: { registered_at: 'DESC' } }
    )

    if (!lastShipment || !lastShipment.rpw_number) {
      return 1
    }

    const match = lastShipment.rpw_number.match(/\/(\d+)\//)
    return match ? parseInt(match[1]) + 1 : 1
  }
}
```

**Create INTEGRATION test** (not unit test):

```typescript
// packages/core/src/modules/records/services/__tests__/incomingShipmentService.integration.test.ts
import { MikroORM } from '@mikro-orm/core'
import { PostgreSqlDriver } from '@mikro-orm/postgresql'
import { IncomingShipmentService } from '../incomingShipmentService'
import { RecordsIncomingShipment, ShipmentStatus } from '../../data/entities'
import { OrgUnit } from '@open-mercato/core/modules/directory/data/entities'

describe('IncomingShipmentService - Integration', () => {
  let orm: MikroORM<PostgreSqlDriver>
  let service: IncomingShipmentService
  let testOrgUnit: OrgUnit

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [RecordsIncomingShipment, OrgUnit],
      driver: PostgreSqlDriver,
      dbName: process.env.TEST_DB_NAME || 'ezd_test',
      // ... other config
    })

    await orm.schema.refreshDatabase()  // Clean slate for each test run
  })

  beforeEach(async () => {
    const em = orm.em.fork()
    
    // Create test org unit
    testOrgUnit = new OrgUnit()
    testOrgUnit.name = 'Test Department'
    testOrgUnit.symbol = 'TD'
    await em.persistAndFlush(testOrgUnit)

    service = new IncomingShipmentService(em)
  })

  afterAll(async () => {
    await orm.close()
  })

  it('creates shipment in draft status', async () => {
    const shipment = await service.createShipment({
      subject: 'Test correspondence',
      sender_name: 'John Doe',
      received_at: new Date(),
      receiving_org_unit_id: testOrgUnit.id,
    })

    expect(shipment.id).toBeDefined()
    expect(shipment.status).toBe(ShipmentStatus.DRAFT)
    expect(shipment.rpw_number).toBeUndefined()

    // Verify persisted to database
    const found = await orm.em.findOne(RecordsIncomingShipment, shipment.id)
    expect(found).not.toBeNull()
    expect(found!.subject).toBe('Test correspondence')
  })

  it('registers shipment with RPW number', async () => {
    const shipment = await service.createShipment({
      subject: 'Test correspondence',
      received_at: new Date(),
      receiving_org_unit_id: testOrgUnit.id,
    })

    await service.registerShipment(shipment.id, 'test-user-id')

    const registered = await orm.em.findOneOrFail(RecordsIncomingShipment, shipment.id)
    expect(registered.status).toBe(ShipmentStatus.REGISTERED)
    expect(registered.rpw_number).toMatch(/^RPW\/TD\/\d+\/\d{4}$/)
    expect(registered.registered_at).toBeDefined()
  })

  it('generates sequential RPW numbers for same org unit', async () => {
    const shipment1 = await service.createShipment({
      subject: 'First',
      received_at: new Date(),
      receiving_org_unit_id: testOrgUnit.id,
    })
    await service.registerShipment(shipment1.id, 'user-id')

    const shipment2 = await service.createShipment({
      subject: 'Second',
      received_at: new Date(),
      receiving_org_unit_id: testOrgUnit.id,
    })
    await service.registerShipment(shipment2.id, 'user-id')

    const reg1 = await orm.em.findOneOrFail(RecordsIncomingShipment, shipment1.id)
    const reg2 = await orm.em.findOneOrFail(RecordsIncomingShipment, shipment2.id)

    expect(reg1.rpw_number).toMatch(/\/1\//)
    expect(reg2.rpw_number).toMatch(/\/2\//)
  })

  it('throws error when registering already registered shipment', async () => {
    const shipment = await service.createShipment({
      subject: 'Test',
      received_at: new Date(),
      receiving_org_unit_id: testOrgUnit.id,
    })

    await service.registerShipment(shipment.id, 'user-id')

    await expect(
      service.registerShipment(shipment.id, 'user-id')
    ).rejects.toThrow('Shipment already registered')
  })
})
```

**Run integration tests**:

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
yarn test packages/core/src/modules/records/services/__tests__/*.integration.test.ts
```

**Expected Output**:
```
PASS  packages/core/src/modules/records/services/__tests__/incomingShipmentService.integration.test.ts
  IncomingShipmentService - Integration
    ✓ creates shipment in draft status (45ms)
    ✓ registers shipment with RPW number (38ms)
    ✓ generates sequential RPW numbers for same org unit (52ms)
    ✓ throws error when registering already registered shipment (31ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

### Step 1.4: API Routes with Integration Tests

**Create API route**:

```typescript
// packages/core/src/modules/records/api/incoming-shipments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getRequestContainer } from '@/lib/di/container'
import { IncomingShipmentService } from '../../services/incomingShipmentService'

export async function GET(req: NextRequest) {
  const container = await getRequestContainer(req)
  const service = container.resolve<IncomingShipmentService>('IncomingShipmentService')

  const shipments = await service.listShipments({
    // Parse query params for filters
  })

  return NextResponse.json(shipments)
}

export async function POST(req: NextRequest) {
  const container = await getRequestContainer(req)
  const service = container.resolve<IncomingShipmentService>('IncomingShipmentService')

  const body = await req.json()
  const shipment = await service.createShipment(body)

  return NextResponse.json(shipment, { status: 201 })
}
```

**Create API integration test**:

```typescript
// packages/core/src/modules/records/api/__tests__/incoming-shipments.integration.test.ts
import { GET, POST } from '../incoming-shipments/route'

// Mock DI container to return service with real database
jest.mock('@/lib/di/container', () => ({
  getRequestContainer: async () => ({
    resolve: () => new IncomingShipmentService(orm.em.fork()),
  }),
}))

describe('API: /api/records/incoming-shipments - Integration', () => {
  beforeEach(async () => {
    await orm.schema.refreshDatabase()
    // ... setup test data
  })

  it('POST creates shipment and returns 201', async () => {
    const req = new Request('http://localhost/api/records/incoming-shipments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        subject: 'Test correspondence',
        sender_name: 'John Doe',
        received_at: new Date().toISOString(),
        receiving_org_unit_id: testOrgUnit.id,
      }),
    })

    const res = await POST(req as NextRequest)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.id).toBeDefined()
    expect(json.status).toBe('draft')

    // Verify persisted
    const found = await orm.em.findOne(RecordsIncomingShipment, json.id)
    expect(found).not.toBeNull()
  })

  it('GET returns list of shipments', async () => {
    // Create test shipments
    const shipment1 = await service.createShipment({...})
    const shipment2 = await service.createShipment({...})

    const req = new Request('http://localhost/api/records/incoming-shipments', {
      method: 'GET',
    })

    const res = await GET(req as NextRequest)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.length).toBe(2)
    expect(json[0].id).toBeDefined()
  })
})
```

### Step 1.5: Compile Backend Code

```bash
yarn build:packages
```

**Verify compilation**:

```bash
ls packages/core/dist/modules/records/api/incoming-shipments/
# Should see: route.js, route.d.ts

ls packages/core/dist/modules/records/services/
# Should see: incomingShipmentService.js, incomingShipmentService.d.ts
```

### Step 1.6: **CRITICAL VALIDATION** - API Runtime Test

```bash
yarn dev
```

**Test API with curl**:

```bash
# Test POST (create shipment)
curl -X POST http://localhost:3001/api/records/incoming-shipments \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test from curl",
    "sender_name": "Test Sender",
    "received_at": "2024-01-20T10:00:00Z",
    "receiving_org_unit_id": "test-org-unit-id"
  }'

# Expected: 201 Created with JSON response containing id

# Test GET (list shipments)
curl http://localhost:3001/api/records/incoming-shipments

# Expected: 200 OK with JSON array
```

**Validation Checklist**:
- [ ] POST returns 201 with valid JSON
- [ ] GET returns 200 with array
- [ ] Database contains the created record (check with psql)
- [ ] No 500 errors
- [ ] No console errors in terminal

**If validation fails**:
1. ❌ **STOP**
2. Debug the API issue  
3. Do NOT proceed to Phase 2
4. Repeat validation

### Step 1.7: Commit Checkpoint

```bash
git add .
git commit -m "Phase 1: Backend foundation with integration tests

- Created RecordsIncomingShipment, RecordsDocument, RecordsJrwaClass entities
- Implemented IncomingShipmentService with RPW generation
- Created API routes for incoming-shipments CRUD
- Added integration tests against real test database
- All tests passing (unit + integration)

✅ Integration tests PASSED  
✅ API runtime validation PASSED via curl
✅ Ready for Phase 2: Core UI"
```

**Phase 1 Definition of Done**:
- ✅ Entities created with migrations applied
- ✅ Services implemented with business logic
- ✅ **Integration tests** passing (not just mocked unit tests)
- ✅ API routes created and compiled
- ✅ **Runtime validation** passed via curl/Postman
- ✅ Database queries work correctly
- ✅ **Validated against real test database**

---

## Phase 2: Core UI (List, Create, Edit, Detail Pages)

**Duration**: 50 hours (1.5 weeks)  
**Goal**: Implement UI pages that **actually work when clicked** in the browser

### Why This Phase Requires Manual Testing

**First Iteration Mistake**: Component tests rendered in jsdom → didn't catch:
- Module registry routing issues
- Client/Server component mismatches
- Hydration errors
- Feature toggle integration problems
- Real API call failures

**V2 Approach**: Test every page **in the actual browser** before moving on.

### Step 2.1: List Page with DataTable

```typescript
// packages/core/src/modules/records/backend/incoming-shipments/page.tsx
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { FeatureGuard } from '@open-mercato/ui/backend/FeatureGuard'

async function fetchShipments() {
  const res = await fetch('http://localhost:3001/api/records/incoming-shipments', {
    cache: 'no-store',
  })
  
  if (!res.ok) {
    throw new Error(`API returned ${res.status}`)
  }
  
  return res.json()
}

export default async function IncomingShipmentsListPage() {
  const shipments = await fetchShipments()

  return (
    <FeatureGuard feature="records_incoming_shipments">
      <DataTable
        title="Incoming Shipments"
        description="Manage incoming correspondence"
        columns={[
          { id: 'rpw_number', title: 'RPW Number' },
          { id: 'subject', title: 'Subject', grow: 2 },
          { id: 'sender_name', title: 'Sender' },
          { id: 'status', title: 'Status' },
          { id: 'received_at', title: 'Received', type: 'date' },
        ]}
        rows={shipments}
        getRowId={(row) => row.id}
        actions={[
          {
            label: 'Create Shipment',
            href: '/backend/incoming-shipments/create',
            variant: 'primary',
          },
        ]}
      />
    </FeatureGuard>
  )
}
```

### Step 2.2: **CRITICAL VALIDATION** - List Page Runtime Test

```bash
yarn dev
```

**Open browser**: `http://localhost:3001/backend/incoming-shipments`

**Validation Checklist**:
- [ ] Page loads without errors
- [ ] DataTable renders with columns
- [ ] Rows display if data exists
- [ ] "Create Shipment" button visible
- [ ] Click "Create Shipment" button
- [ ] No console errors (F12)
- [ ] No hydration errors
- [ ] Feature toggle works (disable `records_incoming_shipments` → see disabled message)

**If ANY item fails**:
1. ❌ **STOP**
2. Fix the issue
3. Repeat validation
4. Do NOT create the next page until this one works

### Step 2.3: Create Page with CrudForm

```typescript
// packages/core/src/modules/records/backend/incoming-shipments/create/page.tsx
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { FeatureGuard } from '@open-mercato/ui/backend/FeatureGuard'

export default function CreateIncomingShipmentPage() {
  return (
    <FeatureGuard feature="records_incoming_shipments">
      <CrudForm
        title="Create Incoming Shipment"
        apiEndpoint="/api/records/incoming-shipments"
        method="POST"
        redirectOnSuccess="/backend/incoming-shipments"
        fields={[
          {
            name: 'subject',
            label: 'Subject',
            type: 'text',
            required: true,
          },
          {
            name: 'sender_name',
            label: 'Sender Name',
            type: 'text',
          },
          {
            name: 'received_at',
            label: 'Received Date',
            type: 'datetime-local',
            required: true,
            defaultValue: () => new Date().toISOString().slice(0, 16),
          },
          {
            name: 'receiving_org_unit_id',
            label: 'Receiving Unit',
            type: 'select',
            required: true,
            options: async () => {
              const res = await fetch('/api/directory/org-units')
              const units = await res.json()
              return units.map(u => ({ value: u.id, label: u.name }))
            },
          },
        ]}
      />
    </FeatureGuard>
  )
}
```

### Step 2.4: **CRITICAL VALIDATION** - Create Page Runtime Test

**Open browser**: `http://localhost:3001/backend/incoming-shipments/create`

**Validation Checklist**:
- [ ] Page loads without errors
- [ ] All form fields render
- [ ] Org unit dropdown populates
- [ ] Fill in all required fields
- [ ] Click "Create" button
- [ ] Success: redirects to list page
- [ ] **Verify new record appears in list**
- [ ] No console errors at any step

**If ANY step fails**:
1. ❌ **STOP**
2. Debug the form/API integration
3. Repeat validation
4. Do NOT create edit page until create works

### Step 2.5: Edit and Detail Pages

**Repeat the same pattern**:
1. Create page component
2. Add to module structure
3. **Test in browser BEFORE proceeding**
4. Verify all interactions work
5. Only then move to next page

### Step 2.6: Integration Smoke Test (Full User Flow)

**After all pages created**, test the **complete workflow**:

```
1. Start at list page
2. Click "Create Shipment"
3. Fill form
4. Submit
5. Verify redirected to list
6. Verify new record in list
7. Click record to view detail
8. Click "Edit"
9. Modify a field
10. Save
11. Verify change persisted
12. Click "Register" action
13. Verify RPW assigned
14. Verify status changed to "Registered"
```

**If ANY step fails in the full flow**:
- ❌ **STOP**  
- **Do NOT** proceed to Phase 3
- Fix the integration issue
- Repeat full flow validation

### Step 2.7: Commit Checkpoint

```bash
git add .
git commit -m "Phase 2: Core UI with validated user flows

- Implemented list page with DataTable
- Implemented create page with CrudForm
- Implemented edit and detail pages
- Added FeatureGuard integration
- All pages manually tested in browser

✅ List page loads and displays data
✅ Create form submits and redirects correctly
✅ Edit form loads existing data and saves
✅ Detail page displays all fields
✅ Full user flow validated end-to-end
✅ No console errors, no 404s, no hydration issues
✅ Ready for Phase 3: Extended UI Features"
```

**Phase 2 Definition of Done**:
- ✅ All core pages implemented (list, create, edit, detail)
- ✅ **Each page tested in browser individually**
- ✅ Feature toggles integrated and tested
- ✅ **Full user flow tested end-to-end**
- ✅ Data persists correctly
- ✅ Navigation works between pages
- ✅ No runtime errors
- ✅ **Validated by actually using the UI, not just tests**

---

## Phase 3: Extended UI Features (Advanced Workflows)

**Duration**: 30 hours (1 week)  
**Goal**: Add bulk actions, transfer workflows, document management, validation workflows

**Apply the same validation pattern**:
1. Implement feature
2. Test in browser immediately
3. Verify all interactions
4. Only proceed if validation passes

---

## Phase 4: Production Readiness (E2E, Documentation, Deploy)

**Duration**: 20 hours (0.5 weeks)  
**Goal**: E2E tests, performance validation, security review, production deploy

### Step 4.1: E2E Tests with Playwright

**Unlike Phase 1-2 tests, E2E tests run against the ACTUAL running application**:

```typescript
// packages/core/src/modules/records/__tests__/e2e/incoming-shipments.e2e.test.ts
import { test, expect } from '@playwright/test'

test.describe('Incoming Shipments - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/backend/incoming-shipments')
    // ... login if needed
  })

  test('complete user flow: create → register → verify', async ({ page }) => {
    // 1. Navigate to create page
    await page.click('text=Create Shipment')
    await expect(page).toHaveURL(/.*\/create/)

    // 2. Fill form
    await page.fill('[name="subject"]', 'E2E Test Shipment')
    await page.fill('[name="sender_name"]', 'Test Sender')
    await page.selectOption('[name="receiving_org_unit_id"]', { index: 1 })

    // 3. Submit
    await page.click('button:has-text("Create")')

    // 4. Verify redirected to list
    await expect(page).toHaveURL(/.*\/incoming-shipments$/)

    // 5. Verify record appears
    await expect(page.locator('text=E2E Test Shipment')).toBeVisible()

    // 6. Click to open detail
    await page.click('text=E2E Test Shipment')

    // 7. Register shipment
    await page.click('button:has-text("Register")')
    await page.click('button:has-text("Confirm")')

    // 8. Verify RPW assigned
    await expect(page.locator('text=/RPW\\/.*\\/\\d+\\/\\d{4}/')).toBeVisible()

    // 9. Verify status changed
    await expect(page.locator('text=Registered')).toBeVisible()
  })

  test('handles validation errors gracefully', async ({ page }) => {
    await page.click('text=Create Shipment')

    // Try to submit empty form
    await page.click('button:has-text("Create")')

    // Should show validation errors
    await expect(page.locator('text=Subject is required')).toBeVisible()
    
    // Should NOT submit
    await expect(page).toHaveURL(/.*\/create/)
  })

  test('respects feature toggles', async ({ page }) => {
    // Disable feature toggle (requires admin access)
    await page.goto('http://localhost:3001/backend/feature-toggles')
    await page.click('text=records_incoming_shipments')
    await page.click('button:has-text("Disable")')

    // Go to incoming shipments
    await page.goto('http://localhost:3001/backend/incoming-shipments')

    // Should show "Feature Disabled" message
    await expect(page.locator('text=Feature Disabled')).toBeVisible()
    await expect(page.locator('text=Create Shipment')).not.toBeVisible()
  })
})
```

**Run E2E tests**:

```bash
# Start app in test mode
yarn dev

# Run Playwright tests
yarn test:e2e
```

**Expected Output**:
```
Running 3 tests using 1 worker

  ✓ complete user flow: create → register → verify (2.5s)
  ✓ handles validation errors gracefully (1.2s)
  ✓ respects feature toggles (1.8s)

  3 passed (5.5s)
```

### Step 4.2: Performance Validation

**Load testing**:

```bash
# Install k6
brew install k6  # or download from k6.io

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 10,  // 10 virtual users
  duration: '30s',
}

export default function() {
  // Test list page
  const listRes = http.get('http://localhost:3001/api/records/incoming-shipments')
  check(listRes, {
    'list returns 200': (r) => r.status === 200,
    'list response time < 500ms': (r) => r.timings.duration < 500,
  })

  sleep(1)

  // Test create
  const createRes = http.post(
    'http://localhost:3001/api/records/incoming-shipments',
    JSON.stringify({
      subject: 'Load test shipment',
      received_at: new Date().toISOString(),
      receiving_org_unit_id: 'test-org-unit-id',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  check(createRes, {
    'create returns 201': (r) => r.status === 201,
    'create response time < 1000ms': (r) => r.timings.duration < 1000,
  })

  sleep(1)
}
EOF

# Run load test
k6 run load-test.js
```

**Expected Metrics**:
```
checks.........................: 100.00% ✓ 600       ✗ 0  
http_req_duration..............: avg=245ms  min=120ms med=230ms max=480ms
http_reqs......................: 600     19.98/s
```

**Performance Validation Checklist**:
- [ ] List page loads in < 500ms
- [ ] Create API responds in < 1000ms
- [ ] No N+1 query issues (check SQL logs)
- [ ] Database queries use indexes
- [ ] Memory usage stable under load

**If performance issues found**:
1. ❌ **STOP deployment**
2. Optimize queries
3. Add database indexes
4. Re-run load tests
5. Only deploy when performance acceptable

### Step 4.3: Security Review

**CodeQL scan**:

```bash
yarn codeql:scan
```

**Manual security checklist**:
- [ ] SQL injection protected (using ORM parameter binding)
- [ ] XSS prevented (React escapes by default)
- [ ] CSRF tokens on state-changing operations
- [ ] Authentication required on all backend routes
- [ ] Authorization checks on sensitive operations
- [ ] Input validation on all API endpoints
- [ ] No secrets in code or logs

**If security issues found**:
1. ❌ **STOP deployment**
2. Fix vulnerabilities
3. Re-run security scan
4. Only deploy when no critical/high issues

### Step 4.4: **FINAL VALIDATION** - Production Smoke Test

**Deploy to staging environment**, then run full smoke test:

```bash
# Set staging URL
export STAGING_URL=https://staging.ezd.gov.pl

# Run smoke test script
node smoke-test.js
```

**Smoke test script**:

```javascript
// smoke-test.js
const tests = [
  { name: 'Homepage loads', url: `${process.env.STAGING_URL}` },
  { name: 'Login works', url: `${process.env.STAGING_URL}/auth/login` },
  { name: 'Incoming shipments list', url: `${process.env.STAGING_URL}/backend/incoming-shipments` },
  { name: 'Create shipment page', url: `${process.env.STAGING_URL}/backend/incoming-shipments/create` },
  { name: 'API list endpoint', url: `${process.env.STAGING_URL}/api/records/incoming-shipments` },
]

for (const test of tests) {
  const res = await fetch(test.url)
  if (res.status >= 400) {
    console.error(`❌ FAIL: ${test.name} returned ${res.status}`)
    process.exit(1)
  } else {
    console.log(`✅ PASS: ${test.name}`)
  }
}

console.log('\\n✅ All smoke tests passed! Ready for production.')
```

**Staging Validation Checklist**:
- [ ] All URLs return 200 OK
- [ ] User can log in
- [ ] Full user flow works (create → register → view)
- [ ] Feature toggles work
- [ ] Database migrations applied
- [ ] No console errors in production build
- [ ] SSL certificate valid
- [ ] Performance acceptable (< 2s page load)

**If staging validation fails**:
1. ❌ **DO NOT DEPLOY TO PRODUCTION**
2. Fix issues
3. Re-deploy to staging
4. Repeat validation
5. Only deploy to production when staging is stable

### Step 4.5: Production Deployment

**Only deploy if**:
- ✅ All E2E tests passing
- ✅ Performance metrics acceptable
- ✅ Security scan clean
- ✅ Staging smoke test passed

```bash
# Deploy to production
yarn deploy:prod

# Monitor for 1 hour
# Watch error rates, performance metrics, user reports
```

**Post-Deploy Validation**:
- [ ] Run smoke test against production URL
- [ ] Monitor error tracking (Sentry/Rollbar)
- [ ] Check performance monitoring (New Relic/Datadog)
- [ ] Verify database connections stable
- [ ] Watch for user reports in first hour

**If production issues appear**:
1. ❌ **ROLLBACK IMMEDIATELY**
2. Investigate in staging
3. Fix and re-test
4. Deploy again only when confident

---

## Appendix A: Why First Iteration Failed - Technical Post-Mortem

### The "Green Tests, Broken Product" Paradox

**What Happened**:
- 1014 tests passed ✅
- Application broken at runtime ❌

**Root Cause Analysis**:

#### 1. Mocked Dependencies Hid Integration Issues

**First Iteration Test Pattern**:

```typescript
// ❌ BAD: Mock hides real problems
const mockEntityManager = {
  findOne: jest.fn().mockResolvedValue({ id: '123' }),
  persistAndFlush: jest.fn(),
}

const service = new IncomingShipmentService(mockEntityManager)
```

**Problems**:
- Never tested against real database
- Didn't catch SQL syntax errors
- Missed entity relationship issues
- Ignored transaction problems
- Mocked away performance issues

**V2 Approach**:

```typescript
// ✅ GOOD: Test against real database
const orm = await MikroORM.init({ dbName: 'ezd_test' })
const service = new IncomingShipmentService(orm.em)

// Actually inserts to database, catches real errors
const shipment = await service.createShipment({...})

// Verify persisted (not mocked)
const found = await orm.em.findOne(RecordsIncomingShipment, shipment.id)
expect(found).not.toBeNull()
```

#### 2. Component Tests Used jsdom (Not Real Browser)

**First Iteration Test Pattern**:

```typescript
// ❌ BAD: jsdom doesn't catch real browser issues
render(<IncomingShipmentsList />)
expect(screen.getByText('Incoming Shipments')).toBeInTheDocument()
```

**Problems**:
- Module registry not loaded (only works in Next.js runtime)
- Feature toggles not initialized
- API calls not made (fetch mocked)
- Hydration errors not caught
- Client/Server component mismatches missed

**V2 Approach**:

```typescript
// ✅ GOOD: Test in real browser with Playwright
test('incoming shipments page loads', async ({ page }) => {
  await page.goto('http://localhost:3001/backend/incoming-shipments')
  await expect(page.locator('h1')).toHaveText('Incoming Shipments')
  
  // Verify no console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(`Console error: ${msg.text()}`)
    }
  })
})
```

#### 3. No Validation of Generated Module Registry

**First Iteration**:
- Created pages
- Assumed `yarn generate` would work
- Never tested if routes were actually registered

**Problem**:
- Module registry generator ignores unregistered modules
- Pages existed but routes 404'd
- No test caught this

**V2 Approach**:

```typescript
// ✅ GOOD: Validate registry generation
test('module registry includes new routes', async () => {
  // Run generator
  execSync('yarn generate')
  
  // Read generated file
  const registry = require('.mercato/generated/modules.generated.ts')
  
  // Verify routes registered
  expect(registry.routes).toContainEqual(
    expect.objectContaining({
      path: '/backend/incoming-shipments',
      module: 'records',
    })
  )
})
```

#### 4. No Runtime Integration Testing

**First Iteration Test Coverage**:
```
Unit Tests:     ✅ 95% coverage (but all mocked)
Integration:    ❌ 0% (no tests against real database)
API E2E:        ❌ 0% (API never called)
UI E2E:         ❌ 0% (no browser testing)
Runtime:        ❌ 0% (never actually ran the app)
```

**Result**: Tests validated individual units in perfect isolation, but system integration was never tested.

**V2 Test Coverage**:
```
Unit Tests:        ✅ 80% coverage (focused on business logic)
Integration:       ✅ Required for services and APIs
API E2E:           ✅ Curl/Postman validation after each API
UI E2E:            ✅ Playwright tests for critical flows
Runtime Validation: ✅ Manual browser testing at each phase
```

**Result**: Tests validate the **integrated system**, not just isolated units.

---

## Appendix B: Validation Checklist Templates

### Phase 0 Validation Checklist

```markdown
## Module Registration Validation

Date: __________
Tester: __________

### Pre-Validation Setup
- [ ] `yarn generate` completed successfully
- [ ] `yarn dev` running on port 3001
- [ ] Browser opened to http://localhost:3001

### Route Validation
- [ ] `/backend/incoming-shipments` returns 200 (not 404)
- [ ] `/backend/sources` returns 200 (not 404)
- [ ] Placeholder text displays correctly
- [ ] No console errors (F12 → Console)
- [ ] No network errors (F12 → Network)

### Sidebar Navigation
- [ ] "Incoming Shipments" link appears in sidebar
- [ ] "Correspondence Sources" link appears in sidebar
- [ ] Clicking links navigates correctly

### Module Discovery
- [ ] Check `.mercato/generated/modules.generated.ts`:
  - [ ] Contains `id: 'records'`
  - [ ] Contains `id: 'correspondence_sources'`
  - [ ] Routes array includes new paths

**Result**: ✅ PASS / ❌ FAIL

**If FAIL, actions taken**:
_______________________________________

**Sign-off**: _____________ (Date: ______)
```

### Phase 1 Validation Checklist

```markdown
## Backend API Validation

Date: __________
Tester: __________

### Build Validation
- [ ] `yarn build:packages` completed successfully
- [ ] Compiled files exist in `packages/core/dist/`
- [ ] No TypeScript errors

### Database Validation
- [ ] Migrations applied: `yarn mikro-orm migration:up`
- [ ] Tables exist: `psql -c "\\dt records_*"`
- [ ] Can insert test data manually

### Integration Test Validation
- [ ] All service integration tests pass
- [ ] All API integration tests pass
- [ ] Tests run against real test database
- [ ] No flaky tests (run 3 times, all pass)

### API Runtime Validation
Using curl or Postman:

**POST /api/records/incoming-shipments**
- [ ] Request body: `{ "subject": "Test", "received_at": "...", "receiving_org_unit_id": "..." }`
- [ ] Response status: 201 Created
- [ ] Response body contains `id` field
- [ ] Record exists in database (verify with psql)

**GET /api/records/incoming-shipments**
- [ ] Response status: 200 OK
- [ ] Response body is array
- [ ] Contains the record created above

**GET /api/records/incoming-shipments/{id}**
- [ ] Response status: 200 OK
- [ ] Returns single object
- [ ] All fields present

### Error Handling
- [ ] POST with missing required field returns 400
- [ ] GET with invalid ID returns 404
- [ ] Validation errors have clear messages

**Result**: ✅ PASS / ❌ FAIL

**Sign-off**: _____________ (Date: ______)
```

### Phase 2 Validation Checklist

```markdown
## UI Runtime Validation

Date: __________
Tester: __________

### List Page Validation
URL: http://localhost:3001/backend/incoming-shipments

- [ ] Page loads without errors
- [ ] DataTable renders
- [ ] Columns display correctly
- [ ] "Create Shipment" button visible
- [ ] Click button navigates to create page
- [ ] No console errors
- [ ] No React hydration errors

### Create Page Validation
URL: http://localhost:3001/backend/incoming-shipments/create

- [ ] Page loads without errors
- [ ] All form fields render
- [ ] Required fields marked with *
- [ ] Dropdowns populate with data
- [ ] Date picker works
- [ ] Fill all required fields
- [ ] Click "Create" button
- [ ] Redirects to list page on success
- [ ] New record appears in list
- [ ] No console errors at any step

### Edit Page Validation
URL: http://localhost:3001/backend/incoming-shipments/{id}/edit

- [ ] Page loads with existing data
- [ ] Form pre-filled correctly
- [ ] Modify a field
- [ ] Click "Save"
- [ ] Redirects to detail page
- [ ] Change persisted (verify in database)

### Detail Page Validation
URL: http://localhost:3001/backend/incoming-shipments/{id}

- [ ] Page loads without errors
- [ ] All fields display
- [ ] Action buttons appear
- [ ] Click "Edit" navigates correctly
- [ ] Click "Delete" shows confirmation
- [ ] Click "Register" starts registration

### Feature Toggle Validation
- [ ] Disable `records_incoming_shipments` feature toggle
- [ ] Navigate to `/backend/incoming-shipments`
- [ ] Should show "Feature Disabled" message
- [ ] Should NOT show data table
- [ ] Enable toggle again
- [ ] Verify feature works normally

### Full User Flow
Complete workflow:
1. [ ] Go to list page
2. [ ] Click "Create"
3. [ ] Fill form
4. [ ] Submit
5. [ ] Verify redirected to list
6. [ ] Verify new record in list
7. [ ] Click record
8. [ ] View detail page
9. [ ] Click "Edit"
10. [ ] Modify field
11. [ ] Save
12. [ ] Verify change persisted
13. [ ] Click "Register"
14. [ ] Confirm registration
15. [ ] Verify RPW assigned
16. [ ] Verify status changed

**Result**: ✅ PASS / ❌ FAIL

**Sign-off**: _____________ (Date: ______)
```

---

## Appendix C: Debugging Guide for Runtime Issues

### Issue: Route Returns 404

**Symptoms**:
- Page exists in code
- `yarn generate` ran successfully
- Still get 404 in browser

**Debugging Steps**:

1. **Verify module registered in `apps/mercato/src/modules.ts`**:
   ```typescript
   { id: 'records', from: '@open-mercato/core' },
   ```

2. **Check generated registry**:
   ```bash
   cat apps/mercato/.mercato/generated/modules.generated.ts | grep "records"
   ```

3. **Verify page.tsx exists**:
   ```bash
   ls packages/core/src/modules/records/backend/incoming-shipments/page.tsx
   ```

4. **Check page.meta.ts exports metadata**:
   ```bash
   cat packages/core/src/modules/records/backend/incoming-shipments/page.meta.ts
   ```

5. **Regenerate registry**:
   ```bash
   rm -rf apps/mercato/.mercato/generated
   yarn generate
   ```

6. **Restart dev server**:
   ```bash
   # Kill old process
   killall node
   
   # Start fresh
   yarn dev
   ```

### Issue: API Returns 500 Error

**Symptoms**:
- API route exists
- Tests pass
- Runtime returns 500

**Debugging Steps**:

1. **Check terminal for error logs**:
   ```bash
   # Look for stack traces in terminal running `yarn dev`
   ```

2. **Verify backend code compiled**:
   ```bash
   ls packages/core/dist/modules/records/api/incoming-shipments/route.js
   
   # If missing, run:
   yarn build:packages
   ```

3. **Test with curl to see full error**:
   ```bash
   curl -v http://localhost:3001/api/records/incoming-shipments
   ```

4. **Check database connection**:
   ```bash
   # Test database accessible
   psql -d ezd_dev -c "SELECT 1"
   ```

5. **Verify migrations applied**:
   ```bash
   yarn mikro-orm migration:status
   ```

6. **Add debug logging to API route**:
   ```typescript
   export async function GET(req: NextRequest) {
     console.log('=== API GET called ===')
     try {
       const result = await service.listShipments()
       console.log('Result:', result)
       return NextResponse.json(result)
     } catch (error) {
       console.error('API Error:', error)
       throw error
     }
   }
   ```

### Issue: Page Loads but Crashes on Click

**Symptoms**:
- Page renders initially
- Clicking button/link causes error
- Console shows React error

**Debugging Steps**:

1. **Check browser console** (F12):
   ```
   Look for:
   - Uncaught TypeError
   - Hydration mismatch
   - Invalid hook call
   ```

2. **Verify client vs server components**:
   ```typescript
   // If using hooks, must be client component:
   'use client'
   
   import { useState } from 'react'
   ```

3. **Check for async issues**:
   ```typescript
   // ❌ BAD: Can't use async in event handler
   <button onClick={async () => await doSomething()}>
   
   // ✅ GOOD: Wrap in sync function
   <button onClick={() => { doSomething() }}>
   ```

4. **Verify API endpoint accessible**:
   ```bash
   curl http://localhost:3001/api/the-endpoint
   ```

5. **Add error boundary**:
   ```typescript
   'use client'
   
   import { ErrorBoundary } from '@/components/ErrorBoundary'
   
   export default function Page() {
     return (
       <ErrorBoundary fallback={<div>Error occurred</div>}>
         <YourComponent />
       </ErrorBoundary>
     )
   }
   ```

---

## Summary: Key Differences Between V1 (Failed) and V2 (This Guide)

| Aspect | V1 (Failed) | V2 (This Guide) |
|--------|-------------|-----------------|
| **Testing Strategy** | Unit tests only, all mocked | Unit + Integration + E2E + Manual |
| **Validation** | After all code written | After every major milestone |
| **Database Testing** | Mocked EntityManager | Real test database |
| **API Testing** | Component tests in jsdom | Curl/Postman + Playwright |
| **UI Testing** | Render tests | Manual browser testing required |
| **Module Registry** | Assumed it works | Validated at Phase 0 |
| **Definition of Done** | "Tests pass" | "Tests pass AND works in browser" |
| **Integration** | Never tested | Required at each phase |
| **Rollback Trigger** | Deploy to production | Stop at first validation failure |
| **Runtime Validation** | None | Mandatory between phases |

**V1 Approach**: Write all code → Run tests → Deploy → Discover it's broken

**V2 Approach**: Write code → Test → **Validate in browser** → Write more code → Test → **Validate in browser** → Repeat

**The Critical Difference**: V2 catches integration issues **during development**, not in production.

---

## Final Checklist: Before Starting Implementation

Before starting Phase 0, verify:

- [ ] Read this entire document
- [ ] Understand the validation checkpoints
- [ ] Set up test database
- [ ] Install browser testing tools (Playwright)
- [ ] Understand "Definition of Done" for each phase
- [ ] Agree to STOP at first validation failure
- [ ] Commit to manual UI testing
- [ ] Accept that green tests ≠ working product
- [ ] Ready to validate at runtime frequently

**Remember**: The goal is not to finish quickly. The goal is to finish with **working software**.

---

**Document Version**: 2.0  
**Created**: January 2026  
**Based On**: Lessons learned from first iteration failure  
**Status**: Ready for reimplementation

**Success Criteria**: When this guide is followed, the implementor will have:
1. ✅ All tests passing
2. ✅ Application working at runtime
3. ✅ UI functional when clicked
4. ✅ No 404s, no console errors
5. ✅ **Can confidently deploy to production**
