# Additional Information for eDoreczenia Integration Implementation

## Overview

This document contains supplementary information, tips, tricks, and context that may be useful for future agents or developers working on eDoreczenia integration or similar functionality.

---

## Platform Architecture Context

### Module System Philosophy

The Open-Mercato platform uses a **module-based architecture** where:
- Each feature area is a separate module (e.g., `records`, `correspondence_sources`)
- Modules can exist in `packages/core` (backend) and `apps/mercato/src/modules` (frontend)
- Modules are **opt-in** - they must be explicitly registered to be available
- This allows for flexible deployment and tenant-specific feature sets

### Why Module Registration Matters

The platform uses a **module discovery system** that:
1. Scans `apps/mercato/src/modules.ts` for enabled modules
2. Generates a registry file (`.mercato/generated/modules.generated.ts`) 
3. Creates route mappings for the backend router
4. Without registration, routes return 404 even if files exist

**Key insight**: The platform doesn't use file-system routing like pure Next.js. It uses a **registry-based routing system** for backend pages.

---

## TypeScript Compilation Model

### Why Build Packages?

The platform uses a **compilation model** where:
- Source code lives in `packages/*/src`
- Compiled code goes to `packages/*/dist`
- Applications import from `dist`, not `src`
- This allows for **build-time optimizations** and **consistent module boundaries**

### Build Process

```
TypeScript Source (src/)
    ↓
tsc or swc (compilation)
    ↓
JavaScript + Type Definitions (dist/)
    ↓
Next.js Build (imports from dist/)
    ↓
Production Bundle
```

**Key insight**: If you change backend code but don't run `yarn build:packages`, the application still runs the OLD compiled code from dist/.

---

## Testing Strategy

### Unit Tests

**Purpose**: Test individual services in isolation

**Pattern**:
```typescript
describe('CustomerMappingService', () => {
  let em: EntityManager
  let service: CustomerMappingService

  beforeEach(() => {
    em = createMockEntityManager()
    service = new CustomerMappingService(em, { sourceLabel: 'test' })
  })

  it('should find existing customer', async () => {
    // Arrange
    const existing = await em.create(CustomerEntity, { displayName: 'John' })
    
    // Act
    const result = await service.findOrCreateCustomer('John')
    
    // Assert
    expect(result.id).toBe(existing.id)
  })
})
```

**Key insight**: Mock the EntityManager, not the database. This tests business logic without database dependencies.

### Integration Tests

**Purpose**: Test interaction between services

**Pattern**:
```typescript
describe('CorrespondenceSyncService', () => {
  it('should create shipment with customer and documents', async () => {
    // Use real database (test DB)
    const source = await createCorrespondenceSource()
    const service = new CorrespondenceSyncService(em)
    
    await service.syncSource(source.id)
    
    // Verify database state
    const shipments = await em.find(RecordsIncomingShipment, {})
    expect(shipments).toHaveLength(1)
    
    const customers = await em.find(CustomerEntity, {})
    expect(customers).toHaveLength(1)
  })
})
```

**Key insight**: Integration tests use a real database (in-memory or test DB) to verify actual data flow.

### E2E Tests

**Purpose**: Test complete user workflows

**Tools**: Playwright, Cypress, or similar

**Pattern**:
```typescript
test('user can create and register shipment', async ({ page }) => {
  await page.goto('/backend/incoming-shipments')
  await page.click('text=Create Shipment')
  await page.fill('input[name="subject"]', 'Test Subject')
  await page.click('button[type="submit"]')
  await page.click('text=Register')
  await expect(page.locator('text=RPW/')).toBeVisible()
})
```

**Key insight**: E2E tests are slow but catch integration issues that unit tests miss.

---

## UI Patterns Deep Dive

### DataTable Pattern

**When to use**: List pages showing multiple items with actions

**Advantages**:
- Automatic pagination, sorting, filtering
- Consistent UI across the application
- Minimal code (5-10 lines for page, 30-50 lines for component)
- Built-in accessibility

**Structure**:
```
Page (apps/mercato/src/modules/{module}/backend/{entity}/page.tsx)
  ↓ renders
DataTable Component (DataTable from @open-mercato/ui)
  ↓ uses
Table Component (apps/mercato/src/modules/{module}/components/{Entity}Table.tsx)
  ↓ defines columns, actions, filters
API Endpoint (packages/core/src/modules/{module}/api/{entity}/route.ts)
```

**Customization points**:
- Columns (what to display)
- Actions (row-level actions like edit, delete)
- Filters (what users can filter by)
- Create button (link to create page)

### CrudForm Pattern

**When to use**: Create/edit pages for single entities

**Advantages**:
- Automatic validation with Zod schemas
- Consistent form layout
- Built-in error handling
- Section-based organization

**Structure**:
```
Page (apps/mercato/src/modules/{module}/backend/{entity}/create/page.tsx)
  ↓ renders
CrudForm Component (CrudForm from @open-mercato/ui)
  ↓ uses
Schema (Zod schema defining validation)
  ↓ validates against
API Endpoint (packages/core/src/modules/{module}/api/{entity}/route.ts)
```

**Customization points**:
- Schema (validation rules)
- Sections (grouping of fields)
- Default values
- Custom field renderers

---

## Common Development Scenarios

### Scenario 1: Adding a New Field to an Entity

**Steps**:
1. Add property to entity (`packages/core/src/modules/{module}/data/entities.ts`)
2. Create migration (if using migrations)
3. Update validation schema (`validators.ts`)
4. Add to API route (if needed)
5. Compile: `yarn build:packages`
6. Add to frontend form schema
7. Add i18n translation
8. Test

**Gotcha**: If you forget step 5, frontend will get old entity structure.

### Scenario 2: Creating a New Page

**Steps**:
1. Ensure module is registered
2. Create page file (`apps/mercato/src/modules/{module}/backend/{path}/page.tsx`)
3. Create metadata file (`page.meta.ts`)
4. Add i18n translations
5. Run `yarn generate` to register route
6. Test at `http://localhost:3001/backend/{path}`

**Gotcha**: If you forget step 1, all pages will 404. If you forget step 5, new pages will 404.

### Scenario 3: Debugging "Module not found" Errors

**Problem**: Build fails with "Can't resolve '@open-mercato/core/modules/...'"

**Diagnosis checklist**:
1. Did you run `yarn build:packages` after changing backend code?
2. Does the file exist in `packages/core/dist/modules/...` (not just `src/`)?
3. Is the import path correct?
4. Did you run `yarn generate` after adding new API routes?

**Solution**: Usually `yarn build:packages` fixes it.

### Scenario 4: Debugging 404 Errors on UI Pages

**Problem**: Navigating to `/backend/my-page` returns 404

**Diagnosis checklist**:
1. Is the module registered in `apps/mercato/src/modules.ts`?
2. Did you run `yarn generate` after registering?
3. Does the file exist at `apps/mercato/src/modules/{module}/backend/my-page/page.tsx`?
4. Is the feature toggle enabled (if using FeatureGuard)?
5. Check `.mercato/generated/modules.generated.ts` - is your route there?

**Solution**: Usually missing module registration or missing `yarn generate`.

---

## Performance Considerations

### Database Query Optimization

**N+1 Query Problem**:
```typescript
// ❌ Bad: N+1 queries
for (const shipment of shipments) {
  const customer = await em.findOne(CustomerEntity, shipment.senderId)
}

// ✅ Good: Single query with join
const shipments = await em.find(RecordsIncomingShipment, {}, {
  populate: ['sender']
})
```

**Batching Lookups**:
```typescript
// ❌ Bad: Individual lookups
for (const item of items) {
  const customer = await customerService.findOrCreateCustomer(item.senderName)
}

// ✅ Good: Batch lookup
const allNames = items.map(i => i.senderName)
const customers = await customerService.batchFindOrCreate(allNames)
```

### File Upload Optimization

**Sequential vs Parallel**:
```typescript
// ❌ Slow: Sequential uploads
for (const file of files) {
  await uploadFile(file)
}

// ✅ Fast: Parallel uploads
await Promise.all(files.map(file => uploadFile(file)))
```

**Streaming for Large Files**:
```typescript
// ❌ Bad: Load entire file into memory
const content = await readFile(path)
await uploadFile(content)

// ✅ Good: Stream the file
const stream = createReadStream(path)
await uploadFileStream(stream)
```

---

## Security Best Practices

### Input Validation

**Always validate at multiple layers**:
1. Client-side (for UX)
2. API layer (for security)
3. Service layer (for business rules)
4. Database layer (for data integrity)

**Example**:
```typescript
// Client-side (Zod schema in form)
const schema = z.object({
  subject: z.string().min(1).max(255)
})

// API layer (validate before processing)
const body = await request.json()
const validated = schema.parse(body)

// Service layer (business rules)
if (validated.subject.includes('forbidden')) {
  throw new Error('Invalid subject')
}

// Database layer (constraints)
@Property({ length: 255 })
subject: string
```

### SQL Injection Prevention

**MikroORM protects you by default**:
```typescript
// ✅ Safe: Parameterized query
await em.find(CustomerEntity, { displayName: userInput })

// ❌ Never do this: String concatenation
await em.execute(`SELECT * FROM customers WHERE name = '${userInput}'`)
```

### File Upload Security

**Always validate**:
1. File size limits
2. MIME type restrictions
3. Filename sanitization
4. Virus scanning (for production)

```typescript
// File upload validation
if (file.size > 10 * 1024 * 1024) {  // 10 MB
  throw new Error('File too large')
}

const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png']
if (!allowedMimes.includes(file.mimeType)) {
  throw new Error('Invalid file type')
}

// Sanitize filename
const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
```

---

## Internationalization (i18n) Best Practices

### Translation Key Naming Convention

**Pattern**: `{module}.{entity}.{section}.{field}`

**Examples**:
- `records.incomingShipments.form.subject`
- `records.incomingShipments.actions.register`
- `records.incomingShipments.status.draft`
- `correspondence.eDoreczeniaMock.create.title`

**Why this works**: Hierarchical structure makes it easy to find and organize translations.

### When to Create Translations

**Best practice**: Create inline as you write code

**Workflow**:
1. Write component with translation key: `{t('records.incomingShipments.form.subject')}`
2. Immediately add to `i18n/en.ts`: `'records.incomingShipments.form.subject': 'Subject'`
3. Commit both together

**Don't**: Write all components with hardcoded strings, then add translations later. It's much more work and error-prone.

### Plural Forms

**Use ICU Message Format**:
```typescript
// In i18n file
'records.incomingShipments.count': '{count, plural, =0 {No shipments} =1 {One shipment} other {# shipments}}'

// In code
t('records.incomingShipments.count', { count: shipments.length })
```

---

## Debugging Tips

### Backend Debugging

**Enable debug logging**:
```typescript
import debug from 'debug'
const log = debug('app:correspondence-sync')

log('Starting sync for source %s', source.id)
log('Found %d items to process', items.length)
```

Run with: `DEBUG=app:* yarn dev`

**Inspect database queries**:
```typescript
// In MikroORM config
debug: true  // Logs all SQL queries
```

### Frontend Debugging

**React DevTools**: Essential for debugging component state and props

**Network tab**: Check API calls, response times, error codes

**Console logging with context**:
```typescript
console.log('[IncomingShipmentsTable] Fetching shipments', { filters, page })
```

**React Query DevTools** (if using):
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

---

## Error Handling Patterns

### Service Layer

**Always wrap in try-catch**:
```typescript
async syncSource(sourceId: string): Promise<void> {
  const source = await this.em.findOneOrFail(CorrespondenceSource, sourceId)
  
  try {
    source.status = 'syncing'
    await this.em.flush()
    
    // Do work
    await this.processItems(source)
    
    source.status = 'active'
    source.lastSyncDate = new Date()
  } catch (error) {
    source.status = 'error'
    source.lastError = error.message
    console.error('[CorrespondenceSync] Error:', error)
  } finally {
    await this.em.flush()
  }
}
```

### API Layer

**Return proper HTTP status codes**:
```typescript
try {
  const result = await service.doSomething()
  return NextResponse.json(result, { status: 200 })
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
```

### Frontend Error Handling

**Use error boundaries**:
```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <IncomingShipmentsPage />
</ErrorBoundary>
```

**Show user-friendly messages**:
```tsx
const { mutate, error } = useMutation({
  onError: (error) => {
    toast.error(t('common.errors.saveFailed'), {
      description: error.message
    })
  }
})
```

---

## Platform-Specific Quirks

### Next.js App Router

**Server Components by default**: All components in `app/` directory are Server Components unless you add `'use client'`

**Important**: Server Components can't use hooks, event handlers, or browser APIs.

**Pattern**:
```tsx
// Server Component (page.tsx)
export default async function Page() {
  const data = await fetchData()  // Can await directly
  return <ClientComponent data={data} />
}

// Client Component (components/ClientComponent.tsx)
'use client'
export function ClientComponent({ data }) {
  const [state, setState] = useState()  // Can use hooks
  return <div onClick={() => {}}>{/* Can use events */}</div>
}
```

### Turbo Build System

**Caching**: Turborepo caches build outputs. Sometimes you need to clear it:
```bash
yarn turbo run build --force  # Ignore cache
```

**Parallel builds**: Turborepo builds packages in parallel. Be aware of dependencies:
```json
{
  "dependsOn": ["@open-mercato/core#build"]
}
```

### MikroORM Specifics

**Entity discovery**: MikroORM scans for entities. New entities are auto-discovered.

**Flush vs Persist**: 
- `persist()`: Add to unit of work
- `flush()`: Execute all pending changes
- `persistAndFlush()`: Shorthand for both

**Transactions**:
```typescript
await em.transactional(async (em) => {
  // All operations use this EM
  // Auto-rollback on error
})
```

---

## Useful Commands Reference

### Development
```bash
yarn dev                    # Start dev server
yarn build:packages         # Compile backend packages
yarn generate               # Regenerate module registry
yarn test                   # Run all tests
yarn test:watch             # Run tests in watch mode
```

### Database
```bash
yarn mikro-orm migration:create  # Create migration
yarn mikro-orm migration:up      # Run migrations
yarn mikro-orm schema:update     # Update schema (dev only)
```

### Linting/Formatting
```bash
yarn lint                   # Run ESLint
yarn format                 # Run Prettier
yarn typecheck              # Run TypeScript compiler check
```

### Production
```bash
yarn build:app              # Build for production
yarn start                  # Start production server
```

---

## Resources and References

### Platform Documentation
- Architecture overview: `docs/ARCHITECTURE.md`
- Module system: `docs/MODULES.md`
- API conventions: `docs/API-CONVENTIONS.md`
- UI patterns: `docs/UI-PATTERNS.md`

### External Documentation
- Next.js: https://nextjs.org/docs
- MikroORM: https://mikro-orm.io/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs

### Polish Legal References
- Instrukcja Kancelaryjna: https://www.gov.pl/web/archiwum/instrukcja-kancelaryjna
- eDoreczenia: https://edoreczenia.gov.pl
- ePUAP: https://epuap.gov.pl

---

## Conclusion

This document captures supplementary knowledge that complements the lessons learned and agent prompt. Use it as a reference when:
- Debugging issues
- Implementing similar features
- Understanding platform conventions
- Optimizing performance
- Ensuring security

Remember: **The best documentation is code that doesn't need documentation.** Strive for self-documenting code with clear naming, proper structure, and inline comments only where necessary.

Good luck with your implementation! 🚀
