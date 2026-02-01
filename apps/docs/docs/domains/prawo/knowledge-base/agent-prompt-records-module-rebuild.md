# Agent Prompt: Rebuild Records & Correspondence Sources Modules

## Technical Objective

You are implementing a complete rebuild of two interconnected modules for the Open-Mercato EZD (Electronic Document Management) platform:

1. **`records` module** – Incoming shipments (Przesyłki wpływające), JRWA classification, and document management
2. **`correspondence_sources` module** – eDoreczenia integration (Polish electronic delivery system) with automatic correspondence synchronization

Your deliverables include backend services, API routes, database entities, frontend UI pages, components, tests, and full integration between both modules.

---

## Architecture Overview

### Platform Stack
- **Monorepo**: Yarn 4 workspaces + Turborepo orchestration
- **Framework**: Next.js 16 (App Router)
- **ORM**: MikroORM with PostgreSQL
- **Language**: TypeScript (strict mode)
- **Architecture**: Module-based with opt-in registration

### Key Directory Structure

```
packages/core/src/modules/
├── records/                     # Backend: incoming shipments, JRWA
│   ├── data/entities.ts         # ORM entities (partially exists)
│   ├── data/validators.ts       # Zod schemas
│   ├── api/                     # API routes
│   ├── services/                # Business logic
│   ├── acl.ts                   # Feature permissions
│   ├── di.ts                    # DI registrar
│   ├── search.ts                # Cmd+K search config
│   └── index.ts                 # Module metadata
│
└── correspondence_sources/      # Backend: eDoreczenia integration
    ├── data/entities.ts
    ├── services/
    ├── api/
    └── ...

apps/mercato/src/modules/
├── records/                     # Frontend: UI pages & components
│   ├── backend/                 # Admin UI pages
│   │   ├── incoming-shipments/
│   │   └── jrwa/
│   ├── components/              # React components
│   ├── i18n/                    # Translations
│   └── index.ts                 # App-level metadata
│
└── correspondence_sources/      # Frontend: source config UI
    ├── backend/
    ├── components/
    └── i18n/
```

---

## Business Requirements Reference

All functional requirements are documented in:
- **Primary spec**: `docs/docs/domains/prawo/administracja-publiczna/wdrozenie/records-przesylki-wplywajace.mdx`
- **Data mapping**: `docs/docs/domains/prawo/administracja-publiczna/mapping/openmercato-ezd/index.mdx`
- **UI mockups**: `docs/docs/domains/prawo/administracja-publiczna/example UI/`

### Key Business Concepts

**Incoming Shipment (Przesyłka wpływająca)**:
- Formal record of correspondence received by the organization
- Has unique RPW number (Rejestr Przesyłek Wpływających) assigned upon registration
- Contains metadata: sender, subject, received date, delivery method
- Links to JRWA classification and attached documents
- Status flow: `draft` → `registered`

**RPW Number Format**: `RPW/{kanc_id}/{seq:5}/{yyyy}`
- `kanc_id` = receiving organizational unit symbol
- `seq` = 5-digit sequence (per org unit per year)
- Sequence resets annually; numbers are immutable after assignment

**JRWA (Jednolity Rzeczowy Wykaz Akt)**:
- Hierarchical archival classification system
- Imported via CSV with versioning
- Contains retention categories (A, B, BE, Bc) - could be more

**eDoreczenia Integration**:
- Automatic correspondence fetching from external sources
- Creates incoming shipments in `draft` status
- Maps sender data with customer matching (NIP/REGON/PESEL/KRS)
- Handles document attachments
- Sends UPD (acknowledgment of receipt) back to sender

---

## Core Entities

### RecordsIncomingShipment

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | uuid | Yes | PK |
| `organizationId` | uuid | Yes | Tenant scope |
| `tenantId` | uuid | Yes | Tenant scope |
| `receivingOrgUnitId` | uuid | Yes | FK to directory/org-units |
| `receivingOrgUnitSymbol` | text | Yes | Snapshot for RPW |
| `subject` | text | Yes | Shipment topic |
| `senderId` | uuid | No | FK to customers (optional) |
| `senderDisplayName` | text | Conditional | Required if no senderId |
| `senderAnonymous` | boolean | No | Default: false |
| `deliveryMethod` | text | Yes | e.g., `edoreczenia-mock`, `epuap`, `email`, `postal` |
| `status` | text | Yes | `draft` \| `registered` |
| `receivedAt` | timestamptz | Yes | Required for registration |
| `rpwNumber` | text | No | Assigned on registration, immutable |
| `rpwSequence` | integer | No | Sequence number within scope |
| `attachmentIds` | uuid[] | No | Phase 1: empty; Phase 2: document refs |
| `postedAt` | timestamptz | No | Sender's posting date |
| `senderReference` | text | No | External reference |
| `remarks` | text | No | Additional notes |
| `documentDate` | timestamptz | No | Date on document |
| `documentSign` | text | No | Document signature/ID |
| `accessLevel` | text | No | `public` \| `partial` \| `restricted` |

### RecordsRpwSequence

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | PK |
| `organizationId` | uuid | Scope |
| `tenantId` | uuid | Scope |
| `receivingOrgUnitId` | uuid | Scope |
| `year` | integer | Scope |
| `currentValue` | integer | Last assigned sequence |

Unique constraint: `(organizationId, tenantId, receivingOrgUnitId, year)`

### RecordsJrwaClass

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | uuid | Yes | PK |
| `organizationId` | uuid | Yes | Scope |
| `tenantId` | uuid | Yes | Scope |
| `code` | text | Yes | e.g., "1234" |
| `name` | text | Yes | Class name |
| `description` | text | No | |
| `parentId` | uuid | No | Parent class (tree structure) |
| `retentionYears` | integer | No | |
| `retentionCategory` | text | No | A/B/BE/Bc |
| `archivalPackageVariant` | text | No | |
| `version` | integer | Yes | Import version |
| `isActive` | boolean | Yes | Active version flag |

Unique constraint: `(organizationId, tenantId, version, code)`

### RecordsDocument (Phase 2)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | PK |
| `title` | text | Required |
| `kind` | text | Document type (configurable dictionary) |
| `accessLevel` | text | `public` \| `partial` \| `restricted` |
| `incomingShipmentId` | uuid | FK to shipment |
| `attachmentIds` | uuid[] | FK to attachments module |
| `disposalStatus` | text | Archival disposal status |

### CorrespondenceSource

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | PK |
| `name` | text | Display name |
| `sourceType` | text | `edoreczenia-mock` \| `epuap` \| `email` |
| `config` | jsonb | Source-specific configuration |
| `isActive` | boolean | |
| `lastSyncDate` | timestamptz | |
| `defaultReceivingOrgUnitId` | uuid | Default org unit for created shipments |
| `defaultReceivingOrgUnitSymbol` | text | Snapshot |

---

## API Endpoints

### Incoming Shipments

| Method | Endpoint | Permission | Notes |
|--------|----------|------------|-------|
| GET | `/api/records/incoming-shipments` | `records.incoming_shipments.view` | List with filtering/pagination |
| POST | `/api/records/incoming-shipments` | `records.incoming_shipments.manage` | Create (status=draft) |
| PUT | `/api/records/incoming-shipments?id={id}` | `records.incoming_shipments.manage` | Update (RPW immutable) |
| DELETE | `/api/records/incoming-shipments?id={id}` | `records.incoming_shipments.manage` | Soft delete |
| POST | `/api/records/incoming-shipments/{id}/register` | `records.incoming_shipments.register` | Assign RPW, status→registered |

### JRWA Classes

| Method | Endpoint | Permission | Notes |
|--------|----------|------------|-------|
| GET | `/api/records/jrwa-classes` | `records.jrwa_classes.view` | Hierarchical list |
| POST | `/api/records/jrwa-classes` | `records.jrwa_classes.manage` | Create |
| PUT | `/api/records/jrwa-classes?id={id}` | `records.jrwa_classes.manage` | Update |
| DELETE | `/api/records/jrwa-classes?id={id}` | `records.jrwa_classes.manage` | Delete |
| POST | `/api/records/jrwa-classes/import` | `records.jrwa_classes.import` | CSV import |
| POST | `/api/records/jrwa-classes/validate-csv` | `records.jrwa_classes.import` | Validate before import |

### Correspondence Sources

| Method | Endpoint | Permission | Notes |
|--------|----------|------------|-------|
| GET | `/api/correspondence-sources/sources` | `correspondence_sources.manage` | List sources |
| POST | `/api/correspondence-sources/sources` | `correspondence_sources.manage` | Create source |
| POST | `/api/correspondence-sources/sources/{id}/sync` | `correspondence_sources.manage` | Trigger sync |
| GET | `/api/correspondence-sources/sync-logs` | `correspondence_sources.manage` | Sync history |

---

## Feature Permissions (ACL)

### records module (`packages/core/src/modules/records/acl.ts`)

```
records.incoming_shipments.view
records.incoming_shipments.manage
records.incoming_shipments.register
records.jrwa_classes.view
records.jrwa_classes.manage
records.jrwa_classes.import
records.documents.view
records.documents.manage
```

### correspondence_sources module

```
correspondence_sources.manage
correspondence_sources.sync
```

---

## Feature Toggles

All modules are protected by feature toggles:

| Flag ID | Default | Description |
|---------|---------|-------------|
| `records_incoming_shipments` | false | Incoming shipments functionality |
| `records_jrwa_classes` | false | JRWA classification system |
| `correspondence_sources` | false | eDoreczenia integration |
| `correspondence_sources_mock_ui` | false | Mock interface (superadmin only) |

Wrap all main UI pages with `FeatureGuard` component.

---

## UI Components Required

### Incoming Shipments

1. **IncomingShipmentsTable** – DataTable with columns: RPW, subject, sender, receivedAt, status
2. **IncomingShipmentForm** – CrudForm with sections: Shipment Data, Sender Data, Registration Data
3. **ShipmentDocumentsSection** – Embedded section for documents (Phase 2)
4. **RegisterShipmentButton** – Action button with validation, visible only in draft status

### JRWA Classes

1. **JrwaClassesTable** – DataTable or TreeView for hierarchical display
2. **JrwaClassForm** – CrudForm for class create/edit
3. **JrwaImportWizard** – Multi-step: upload → validate → preview → import → result

### Correspondence Sources

1. **SourcesTable** – DataTable with source name, type, status, last sync
2. **SourceConfigForm** – Configuration form per source type
3. **SyncLogsTable** – Sync history with status and counts

---

## UI Pages Structure

```
apps/mercato/src/modules/records/backend/
├── incoming-shipments/
│   ├── page.tsx              # List page
│   ├── page.meta.ts          # Metadata (title, permissions)
│   ├── create/
│   │   └── page.tsx          # Create form
│   └── [id]/
│       └── page.tsx          # Detail/edit page
└── jrwa/
    ├── page.tsx              # List/tree page
    ├── page.meta.ts
    ├── create/
    │   └── page.tsx
    ├── import/
    │   └── page.tsx          # CSV import wizard
    └── [id]/
        └── page.tsx

apps/mercato/src/modules/correspondence_sources/backend/
├── sources/
│   ├── page.tsx
│   ├── create/
│   └── [id]/
├── sync-logs/
│   └── page.tsx
└── edoreczenia-mock/         # Mock testing UI
    └── page.tsx
```

---

## Implementation Phases

### Phase 0: Module Registration & Validation (Critical First Step)

**Duration**: 2-4 hours

**Deliverables**:
1. Verify module metadata files exist in both `packages/core` and `apps/mercato`
2. Confirm modules are registered in `apps/mercato/src/modules.ts`
3. Create placeholder pages for all routes
4. Run `yarn generate` to update module registry
5. **Validate**: All placeholder routes return 200 OK in browser

**Validation Gate**: Navigate to each route in browser – no 404s, no console errors.

### Phase 1: Backend Foundation

**Duration**: ~40 hours (1 week)

**Deliverables**:
1. **Entities**: Verify/complete RecordsIncomingShipment, RecordsRpwSequence, RecordsJrwaClass, CorrespondenceSource
2. **Validators**: Zod schemas for all create/update operations
3. **Services**:
   - `IncomingShipmentService` – CRUD + registration logic
   - `RpwGeneratorService` – Thread-safe sequence generation
   - `JrwaImportService` – CSV parsing and batch import
   - `CorrespondenceSyncService` – Fetch and create shipments
   - `CustomerMappingService` – Match senders to existing customers
4. **API Routes**: All CRUD endpoints + process actions
5. **OpenAPI**: Export `openApi` from every route
6. **Search**: `formatResult` for Cmd+K results
7. **DI Registration**: Wire services in `di.ts`
8. **Integration Tests**: Against real test database

**Build Step**: Run `yarn build:packages` after any backend changes.

**Validation Gate**: API endpoints return correct responses via curl/Postman.

### Phase 2: Core UI Implementation

**Duration**: ~40 hours (1 week)

**Deliverables**:
1. **i18n**: All translation keys in `en.ts` and `pl.ts`
2. **List Pages**: DataTable for shipments, JRWA, sources, sync logs
3. **Create/Edit Forms**: CrudForm implementation with validation
4. **Detail Pages**: Combined view/edit with sections
5. **Action Buttons**: Register shipment, trigger sync
6. **Feature Guards**: Wrap all pages

**Validation Gate**: All pages render without errors, buttons trigger correct actions.

### Phase 3: Extended UI & Integration

**Duration**: ~20 hours

**Deliverables**:
1. **JRWA Import Wizard**: Multi-step CSV import with preview
2. **Documents Section**: Embedded document management (Phase 2 scope)
3. **Audit Timeline**: History of changes on shipments
4. **Sync Logs**: Detailed sync history view
5. **Keyboard Shortcuts**: Cmd/Ctrl+Enter for primary actions, Escape to cancel

**Validation Gate**: Complete user flows work end-to-end.

### Phase 4: Testing & Production Readiness

**Duration**: ~20 hours

**Deliverables**:
1. **Unit Tests**: 80%+ coverage for services and validators
2. **Integration Tests**: API endpoints with real database
3. **E2E Tests**: Critical user flows
4. **Performance Tests**: Concurrent RPW generation, large CSV imports
5. **Documentation**: User guides if required

**Validation Gate**: All tests pass, manual QA complete.

---

## Three-Layer Testing Strategy

### Layer 1: Unit Tests (80% coverage target)

- Test services in isolation with mocked dependencies
- Test Zod schemas with valid/invalid inputs
- Test utility functions
- Location: `packages/core/src/modules/{module}/__tests__/`

### Layer 2: Integration Tests (Required per milestone)

- Test Service → Repository → Database flow
- Test API Route → Service → Database flow
- Test module registry generation
- Use real test database (not mocks)
- Location: `packages/core/src/modules/{module}/api/__tests__/`

### Layer 3: Runtime Smoke Tests (Manual, Required)

After every commit that adds a feature:
1. Run `yarn build:packages` (if backend changed)
2. Run `yarn generate` (if routes/pages added)
3. Start `yarn dev`
4. Open browser to `http://localhost:3001`
5. Navigate to new feature
6. Check browser console (F12) – no red errors, no 404s in Network tab
7. Click every interactive element
8. **If ANY error → STOP, fix, repeat**

---

## Validation Gates Summary

| Phase | Tests Required | Runtime Validation Required | Proceed If Fails |
|-------|----------------|----------------------------|------------------|
| **Phase 0** | No | **YES** – Routes must return 200 | **STOP** |
| **Phase 1** | Yes – Integration tests | **YES** – API returns data | **STOP** |
| **Phase 2** | Yes – Component tests | **YES** – Pages render, buttons work | **STOP** |
| **Phase 3** | Yes – Feature tests | **YES** – Workflows complete | **STOP** |
| **Phase 4** | Yes – E2E passing | **YES** – Full user flow works | **STOP** |

---

## Coding Standards

### Naming Conventions
- Modules: plural, snake_case (`records`, `correspondence_sources`)
- Entities: PascalCase with module prefix (`RecordsIncomingShipment`)
- Services: PascalCase with Service suffix (`CustomerMappingService`)
- Components: PascalCase (`IncomingShipmentsTable`)
- Routes: kebab-case (`incoming-shipments`)
- Database tables: plural snake_case (`records_incoming_shipments`)
- Database columns: snake_case (`receiving_org_unit_id`)

### i18n Pattern
- Add translations inline as you write code
- Key format: `{module}.{entity}.{section}.{field}`
- Example: `records.incomingShipments.form.subject`

### Form/Dialog Standards
- Support `Cmd/Ctrl+Enter` as primary action shortcut
- Support `Escape` to cancel/close
- Use `CrudForm` for create/edit forms
- Use `DataTable` for list pages

### Configuration Validation
- Validate required config at operation start, not when needed
- Services should receive configuration via constructor

---

## Build Commands

```bash
yarn install              # Install dependencies
yarn build:packages       # Compile backend packages (REQUIRED after backend changes)
yarn generate             # Regenerate module registry (REQUIRED after adding routes)
yarn test                 # Run all tests
yarn dev                  # Start dev server
yarn build:app            # Build for production
```

---

## Success Criteria

### Phase Complete When:

**Phase 0**:
- [ ] Modules registered in `apps/mercato/src/modules.ts`
- [ ] Metadata files exist
- [ ] `yarn generate` succeeds
- [ ] Placeholder pages accessible via browser (200 OK)
- [ ] No console errors

**Phase 1**:
- [ ] All entities created with migrations
- [ ] All services implemented with tests
- [ ] All API routes functional (verified via curl)
- [ ] Integration tests passing
- [ ] `yarn build:packages` succeeds

**Phase 2**:
- [ ] All pages implemented
- [ ] Forms validate correctly
- [ ] Actions trigger API calls
- [ ] Feature toggles work
- [ ] i18n complete
- [ ] Manual browser testing passes

**Phase 3**:
- [ ] CSV import wizard works end-to-end
- [ ] Document management functional (if in scope)
- [ ] Keyboard shortcuts work
- [ ] All user flows complete

**Phase 4**:
- [ ] Unit test coverage ≥80%
- [ ] Integration tests pass
- [ ] E2E tests cover critical flows
- [ ] Performance acceptable
- [ ] No console errors in production build

---

## Module Integration Points

### records → directory
- Lookup organizational units for `receivingOrgUnitId`
- Snapshot `receivingOrgUnitSymbol` on shipment

### records → customers
- Optional sender lookup by `senderId`
- Snapshot `senderDisplayName` regardless

### records → attachments
- Documents reference `attachmentIds` from attachments module
- Use existing upload/storage API

### correspondence_sources → records
- Sync creates shipments via `IncomingShipmentService`
- Sets `deliveryMethod` to source type
- Status always `draft` (requires manual registration)

### correspondence_sources → customers
- `CustomerMappingService` matches senders by identifiers (NIP, REGON, PESEL, KRS)
- Creates new customer if no match found

---

## Critical Implementation Notes

1. **Module Registration First**: Always verify modules are registered before writing UI code.

2. **Compile After Backend Changes**: Run `yarn build:packages` – the app imports from `dist/`, not `src/`.

3. **RPW Immutability**: Once assigned, `rpwNumber` cannot be modified. Enforce at API and database level.

4. **Sequence Thread Safety**: Use atomic PostgreSQL operations for RPW sequence increment (`INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING`).

5. **Transaction Rollback**: Failed registration should not consume a sequence number.

6. **CSV Import Atomicity**: Import entire CSV in a transaction – rollback all on any error.

7. **Feature Toggles**: Check at both API (return 403) and UI (hide components) levels.

8. **No Cross-Module ORM Relations**: Use UUID foreign keys only, fetch related data separately.

9. **Encryption Awareness**: Use `findWithDecryption` helpers when tenant data encryption is enabled.

10. **Validation at Multiple Layers**: Client-side (UX), API (security), Service (business rules), Database (integrity).

---

## Reference Documentation

- Business requirements: `docs/docs/domains/prawo/administracja-publiczna/wdrozenie/records-przesylki-wplywajace.mdx`
- Data mapping: `docs/docs/domains/prawo/administracja-publiczna/mapping/openmercato-ezd/index.mdx`
- UI mockups: `docs/docs/domains/prawo/administracja-publiczna/example UI/`
- Platform conventions: `AGENTS.md` (root of repository)
