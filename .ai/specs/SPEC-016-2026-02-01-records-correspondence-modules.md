# SPEC-016-2026-02-01-records-correspondence-modules

**Title**: Records Management and Correspondence Sources Integration Modules  
**Date**: 2026-02-01  
**Status**: In Progress  
**Author**: Copilot Agent  

## Overview

Implementation of two interconnected modules for the Open-Mercato EZD (Electronic Document Management) platform:

1. **`records` module** – Incoming shipments (Przesyłki wpływające / RPW), JRWA classification, and document management
2. **`correspondence_sources` module** – eDoreczenia integration (Polish electronic delivery system) with automatic correspondence synchronization

## Business Context

### Incoming Shipments (RPW)
- Formal registration of all correspondence received by the organization
- Each shipment receives a unique, immutable RPW number: `RPW/{kanc_id}/{seq:5}/{yyyy}`
- RPW sequences are per organizational unit, per year
- Status flow: `draft` → `registered` (irreversible)
- Links to JRWA classification for archival management

### JRWA Classification
- Hierarchical archival classification system (Jednolity Rzeczowy Wykaz Akt)
- Imported via CSV with versioning support
- Defines retention policies (years, categories A/B/BE/Bc)
- Each class can have parent-child relationships (tree structure)

### Correspondence Sources Integration
- Automated fetching from external systems (eDoreczenia, ePUAP, email)
- Creates incoming shipments automatically in `draft` status
- Maps senders to existing customers using identifiers (NIP, REGON, PESEL, KRS)
- Handles document attachments
- Tracks synchronization history and errors

## Architecture Decisions

### Module Structure

Both modules follow the platform's module-based architecture with:
- **Backend** (`packages/core/src/modules/{module}/`): Entities, services, API routes, ACL
- **Frontend** (`apps/mercato/src/modules/{module}/`): UI pages, components, i18n
- **Registration**: Both layers registered in `apps/mercato/src/modules.ts`

### Data Model

#### RecordsIncomingShipment
- Tenant-scoped entity with organization isolation
- Required fields: `subject`, `receivingOrgUnitId`, `deliveryMethod`, `receivedAt`, `status`
- Either `senderId` (FK to customers) OR `senderDisplayName` must be provided
- `rpwNumber` and `rpwSequence` assigned atomically during registration
- Supports anonymous senders via `senderAnonymous` flag
- Links to JRWA class via `jrwaClassId`
- Attachments stored as UUID array (references to attachments module)

#### RecordsRpwSequence
- Atomic sequence generator per `(organizationId, tenantId, receivingOrgUnitId, year)`
- Uses PostgreSQL's `INSERT ... ON CONFLICT DO UPDATE RETURNING` for thread-safety
- Failed registrations must not consume sequence numbers (transactional rollback)

#### RecordsJrwaClass
- Supports versioning via `version` field
- Tree structure via `parentId` self-reference
- Active version per organization managed via `isActive` flag
- Unique constraint on `(organizationId, tenantId, version, code)`

#### CorrespondenceSource
- Source-specific configuration stored as JSONB
- `sourceType` enum: `edoreczenia-mock`, `epuap`, `email`
- Tracks last sync timestamp for incremental fetches

#### CorrespondenceSyncLog
- Audit trail of all synchronization operations
- Status tracking: `pending` → `in_progress` → `completed`/`failed`
- Metrics: items processed, created, skipped, failed

### Security & Permissions

#### Feature Toggles
- `records_incoming_shipments` (boolean, default: false)
- `records_jrwa_classes` (boolean, default: false)
- `correspondence_sources` (boolean, default: false)
- `correspondence_sources_mock_ui` (boolean, default: false, superadmin only)

All UI pages wrapped with `FeatureGuard` component. API routes check feature state and return 403 if disabled.

#### ACL Permissions

**records module**:
- `records.incoming_shipments.view` - View shipments list
- `records.incoming_shipments.manage` - Create, edit shipments
- `records.incoming_shipments.register` - Assign RPW numbers
- `records.jrwa_classes.view` - View JRWA classes
- `records.jrwa_classes.manage` - Create, edit classes
- `records.jrwa_classes.import` - CSV import
- `records.documents.view` - View documents (Phase 2)
- `records.documents.manage` - Manage documents (Phase 2)

**correspondence_sources module**:
- `correspondence_sources.manage.view` - View sources
- `correspondence_sources.manage.manage` - Create, edit sources
- `correspondence_sources.sync.trigger` - Trigger manual sync
- `correspondence_sources.sync.view_logs` - View sync logs

### API Design

All API routes follow REST conventions with query parameters for filtering/pagination.

#### Incoming Shipments
- `GET /api/records/incoming-shipments` - List with filters
- `POST /api/records/incoming-shipments` - Create (status=draft)
- `PUT /api/records/incoming-shipments?id={id}` - Update (RPW immutable)
- `DELETE /api/records/incoming-shipments?id={id}` - Soft delete
- `POST /api/records/incoming-shipments/{id}/register` - Assign RPW

#### JRWA Classes
- `GET /api/records/jrwa-classes` - List hierarchical
- `POST /api/records/jrwa-classes` - Create
- `PUT /api/records/jrwa-classes?id={id}` - Update
- `DELETE /api/records/jrwa-classes?id={id}` - Delete
- `POST /api/records/jrwa-classes/import` - CSV import
- `POST /api/records/jrwa-classes/validate-csv` - Pre-import validation

#### Correspondence Sources
- `GET /api/correspondence-sources/sources` - List sources
- `POST /api/correspondence-sources/sources` - Create source
- `PUT /api/correspondence-sources/sources?id={id}` - Update source
- `DELETE /api/correspondence-sources/sources?id={id}` - Delete source
- `POST /api/correspondence-sources/sources/{id}/sync` - Trigger sync
- `GET /api/correspondence-sources/sync-logs` - Sync history

All endpoints export OpenAPI schemas via `openApi` object for automatic documentation.

### UI/UX Patterns

#### Page Structure
- List pages: `backend/{entity}/page.tsx` with DataTable component
- Create: `backend/{entity}/create/page.tsx` with CrudForm
- Details/Edit: `backend/{entity}/[id]/page.tsx` with combined view/edit

#### Navigation
- Records module: "Records" group with "Incoming Shipments" and "JRWA Classes"
- Correspondence Sources: "Integrations" group
- Mock UI: "Testing" group (superadmin only)

#### Interactions
- Support `Cmd/Ctrl+Enter` for form submission
- Support `Escape` to cancel/close
- Register button only visible for draft shipments
- Real-time validation feedback

### Integration Points

#### records → directory
- Lookup organizational units by UUID
- Snapshot `receivingOrgUnitSymbol` on shipment creation

#### records → customers
- Optional sender lookup by `senderId`
- Display name from customer or override via `senderDisplayName`

#### records → attachments
- Documents reference attachment UUIDs
- Use existing upload/storage API

#### correspondence_sources → records
- Creates shipments via `IncomingShipmentService`
- Always sets `status = 'draft'` (manual registration required)
- Sets `deliveryMethod` to source type

#### correspondence_sources → customers
- Maps senders using NIP, REGON, PESEL, KRS identifiers
- Creates new customers if no match found
- Normalizes identifiers before matching

## Implementation Strategy

### Phase 0: Module Registration ✅ COMPLETED
- Created backend and frontend module structures
- Registered modules in `modules.ts`
- Created placeholder pages
- Ran `yarn generate` successfully
- Added basic i18n translations

### Phase 1: Backend Foundation (Current)
- ✅ Created entities for all tables
- ✅ Created Zod validators
- ⏸️ Implement services (in progress)
- ⏸️ Create API routes
- ⏸️ Add OpenAPI documentation
- ⏸️ Configure search integration
- ⏸️ Wire DI registration
- ⏸️ Create integration tests

### Phase 2: Core UI Implementation
- Implement DataTables for all list pages
- Implement CrudForms for create/edit
- Add action buttons (register, sync)
- Manual browser testing

### Phase 3: Extended Features
- JRWA CSV import wizard
- Documents section (Phase 2)
- Audit timeline
- Sync logs view

### Phase 4: Testing & Production Readiness
- Unit tests (80%+ coverage)
- Integration tests
- E2E tests
- Performance testing

## Critical Implementation Notes

1. **RPW Immutability**: Once `rpwNumber` is assigned, it cannot be modified. Enforce at API, service, and database levels.

2. **Thread-Safe Sequences**: Use PostgreSQL's atomic operations:
   ```sql
   INSERT INTO records_rpw_sequences (...) VALUES (...)
   ON CONFLICT (organization_id, tenant_id, receiving_org_unit_id, year)
   DO UPDATE SET current_value = records_rpw_sequences.current_value + 1
   RETURNING current_value
   ```

3. **Transaction Rollback**: Failed registration must not consume sequence numbers. Wrap in transaction and rollback on error.

4. **CSV Import Atomicity**: Import entire CSV in a single transaction. Rollback all changes on any error.

5. **Feature Toggle Checks**: Verify at both API (403) and UI (hide components) levels.

6. **No Cross-Module ORM Relations**: Use UUID foreign keys only. Fetch related data separately.

7. **Tenant Data Encryption**: Use `findWithDecryption` helpers when tenant encryption is enabled.

8. **Validation Layers**: Client-side (UX), API (security), Service (business rules), Database (integrity).

## Testing Strategy

### Unit Tests
- Service logic with mocked repositories
- Validator schemas with valid/invalid inputs
- Utility functions

### Integration Tests
- Service → Repository → Database flows
- API → Service → Database flows
- Must use real test database, not mocks

### E2E Tests
- Complete user workflows
- RPW registration flow
- CSV import flow
- Correspondence sync flow

### Performance Tests
- Concurrent RPW generation (100+ simultaneous requests)
- Large CSV imports (10,000+ rows)
- Sync operations with many items

## Changelog

### 2026-02-01
- Initial specification created
- Phase 0 completed (module registration, placeholder pages)
- Entities and validators implemented
- Backend foundation in progress
