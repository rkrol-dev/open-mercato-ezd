# Quick Reference: Records Module Implementation

**Ostatnia aktualizacja:** 2026-02-10

## 🎯 Status implementacji

| Komponent | Status | Gotowe do użycia |
|-----------|--------|------------------|
| Backend API | ✅ Kompletne | TAK |
| Encje bazodanowe | ✅ Kompletne | TAK |
| Walidacja (Zod) | ✅ Kompletne | TAK |
| OpenAPI | ✅ Kompletne | TAK |
| Frontend/UI | ❌ Brak | NIE - do zaimplementowania |

---

## 📚 Główne dokumenty

1. **Analiza wykonawcza** (START TUTAJ):
   - `docs/docs/domains/prawo/administracja-publiczna/wdrozenie/records-przesylki-wplywajace.mdx`
   - 2238 linii - kompletna specyfikacja

2. **Integracja eDoreczenia**:
   - `docs/docs/integracje/edoreczenia/implementation.md`
   - Opis automatycznego pobierania korespondencji

3. **Mapowanie obiektów**:
   - `docs/docs/domains/prawo/administracja-publiczna/mapping/openmercato-ezd/`
   - entity-map, api-map, data-dictionary, conceptual-model

4. **Weryfikacja spójności** (PRZECZYTAJ PRZED STARTEM):
   - `PODSUMOWANIE-WERYFIKACJI-SPOJNOSCI.md` - streszczenie po polsku
   - `consistency-verification-report.md` - szczegółowy raport techniczny

---

## 🔑 Kluczowe koncepty

### Phase 1 (obecna implementacja) vs Phase 2 (przyszłość)

**⚠️ WAŻNE: Obecnie w Phase 1**

```
Phase 1 (MVP - OBECNA):
IncomingShipment.attachmentIds: uuid[] → bezpośrednio do module attachments
                                          (obecnie puste [])

Phase 2 (PLANOWANA):
IncomingShipment.documentIds: uuid[] → RecordsDocument.attachmentIds: uuid[] → attachments
```

**Konsekwencje dla implementacji:**
- W Phase 1: Nie ma encji `RecordsDocument`
- Pole `attachmentIds` jest przygotowane ale nie używane (remarks zawiera opis)
- W Phase 2: Zostanie dodana encja `RecordsDocument` i pole przemianowane na `documentIds`

### Statusy przesyłek

```typescript
type IncomingShipmentStatus = 'draft' | 'registered'
// Planowane w przyszłości: 'archived'
```

**NIE implementuj `archived`** - nie jest w MVP!

### Generator numerów RPW

Format: `RPW/{kanc_id}/{seq:5}/{yyyy}`

Przykład: `RPW/K01/00001/2026`

- `kanc_id` = `receivingOrgUnitSymbol` (snapshot)
- `seq` = sekwencja per (organization + unit + rok)
- `yyyy` = rok

Sekwencja resetuje się rocznie automatycznie.

---

## 📋 Encje i pola

### RecordsIncomingShipment

**Wymagane przy tworzeniu:**
- `receivingOrgUnitId` (uuid)
- `receivingOrgUnitSymbol` (string, regex: `/^[A-Za-z0-9_\-]+$/`)
- `subject` (string, 1-2000 chars)
- `senderId` (uuid) **LUB** `senderDisplayName` (string) - co najmniej jedno
- `deliveryMethod` (`'paper'` | `'epuap'` | `'email'`)

**Opcjonalne:**
- `receivedAt` (Date) - wymagane przed rejestracją
- `senderAnonymous` (boolean)
- `attachmentIds` (uuid[]) - domyślnie `[]`
- `postedAt`, `senderReference`, `remarks`
- `documentDate`, `noDocumentDate`
- `documentSign`, `noDocumentSign`
- `accessLevel` (`'public'` | `'restricted'` | `'private'`)
- `hasChronologicalRegistration` (boolean)
- `mappingCoverage` (`'none'` | `'partial'` | `'full'`)

**Tylko do odczytu (nadawane przez system):**
- `rpwNumber` - nadawane przez akcję `register`
- `rpwSequence` - numeracja wewnętrzna
- `status` - zmieniane przez workflow
- `externalRpwNumber`, `externalDocumentIds` - ustawiane przy imporcie z systemów kancelaryjnych (EZD RP/eSODOK)

### RecordsJrwaClass

**Wymagane:**
- `code` (string, 1-50 chars)
- `name` (string, 1-500 chars)

**Opcjonalne:**
- `parentId` (uuid) - dla hierarchii
- `retentionYears` (integer 0-200)
- `retentionCategory` (string, max 20 chars)
- `version` (integer) - domyślnie 1

---

## 🔌 API Endpoints

### Przesyłki wpływające

```
GET    /api/records/incoming-shipments
POST   /api/records/incoming-shipments
PUT    /api/records/incoming-shipments/:id
DELETE /api/records/incoming-shipments/:id
POST   /api/records/incoming-shipments/:id/register  # Nadaje RPW
```

### JRWA

```
GET    /api/records/jrwa-classes
POST   /api/records/jrwa-classes
PUT    /api/records/jrwa-classes/:id
DELETE /api/records/jrwa-classes/:id
POST   /api/records/jrwa-classes/import  # CSV import
```

### Integracja correspondence_sources

```
GET    /api/correspondence-sources/sources
POST   /api/correspondence-sources/sources
POST   /api/correspondence-sources/sources/:id/sync
```

---

## 🎨 UI Components do zaimplementowania

### 1. Lista przesyłek wpływających

**Wzorzec:** DataTable z `packages/ui/src/backend/components/DataTable`

**Kolumny:**
- RPW number
- Subject
- Sender (name)
- Received at
- Status (badge)
- Receiving org unit

**Filtry:**
- Status: draft/registered
- Received at range (date picker)
- Receiving org unit (select)

**Akcje:**
- Klik w wiersz → szczegóły
- Menu "..." → edit/delete
- Bulk: export CSV

### 2. Formularz create/edit przesyłki

**Wzorzec:** CrudForm z `packages/ui/src/backend/forms/CrudForm`

**Sekcje:**
1. Dane nadawcy
   - senderId (autocomplete z customers) LUB senderDisplayName (text)
   - senderAnonymous (checkbox)
   
2. Dane przesyłki
   - subject (textarea)
   - receivingOrgUnitId (select z hierarchii directory)
   - deliveryMethod (select: paper/epuap/email)
   - receivedAt (date picker)
   
3. Metadane opcjonalne
   - postedAt, senderReference
   - documentDate, documentSign
   - checkboxy: noDocumentDate, noDocumentSign
   
4. Załączniki (Phase 1 - placeholder)
   - Info: "Załączniki będą dostępne w Phase 2"
   - remarks (textarea) - tymczasowe miejsce na notatki

### 3. Akcja "Zarejestruj wpływ"

**Przycisk:** Widoczny tylko dla `status === 'draft'`

**Walidacja przed akcją:**
- receivedAt !== null
- receivingOrgUnitSymbol !== null && !== ''
- subject !== ''
- senderId || senderDisplayName

**Endpoint:** `POST /api/records/incoming-shipments/:id/register`

**Feedback:**
- Sukces: Toast + odświeżenie danych
- Błąd: Alert z komunikatem błędu

### 4. Lista JRWA (hierarchiczna)

**Wzorzec:** TreeView lub DataTable z indent

**Kolumny:**
- Code (z indentacją dla dzieci)
- Name
- Retention years
- Retention category
- Version
- Actions

**Funkcje:**
- Rozwijanie/zwijanie gałęzi
- Filtr po version (domyślnie: is_active=true)
- Search po code/name

### 5. Import CSV JRWA

**Strona dedykowana** (nie modal)

**Kroki:**
1. Upload pliku CSV
2. Walidacja + preview (tabela z pierwszych N wierszy)
3. Podsumowanie: OK count, Error count
4. Lista błędów (jeśli są)
5. Przycisk "Importuj" (disabled jeśli błędy)
6. Progress bar podczas importu
7. Raport końcowy

---

## 🔐 Uprawnienia (ACL)

### Feature gates do sprawdzania:

```typescript
// Przesyłki
'records.incoming_shipments.view'      // Odczyt
'records.incoming_shipments.manage'    // Create/edit/delete
'records.incoming_shipments.register'  // Akcja register (nadanie RPW)

// JRWA
'records.jrwa_classes.view'     // Odczyt
'records.jrwa_classes.manage'   // Create/edit/delete
'records.jrwa_classes.import'   // Import CSV

// Correspondence sources
'correspondence_sources.view'       // Odczyt źródeł
'correspondence_sources.manage'     // Zarządzanie źródłami
'correspondence_sources.sync'       // Trigger sync
'correspondence_sources.mock_admin' // Mock admin panel
```

---

## 🧪 Testowanie

### Backend jest przetestowany:
- ✅ E2E tests dla correspondence sync
- ✅ Walidacja Zod schemas
- ✅ Generator RPW

### Frontend wymaga testów:
- Unit tests dla komponentów
- E2E tests dla flow: create → edit → register
- Walidacja formularzy

---

## 📝 Konwencje kodu

### Nazewnictwo:

```typescript
// TypeScript/React/API - camelCase
const incomingShipment = { receivingOrgUnitId: '...', ... }

// Database/SQL - snake_case
SELECT receiving_org_unit_id FROM records_incoming_shipments

// Komponenty React - PascalCase
<IncomingShipmentForm />

// Pliki - kebab-case
incoming-shipment-form.tsx
```

### Struktura plików UI (do utworzenia):

```
packages/ui/src/backend/pages/records/
├── incoming-shipments/
│   ├── page.tsx              # Lista
│   ├── [id]/
│   │   └── page.tsx          # Szczegóły/edit
│   └── new/
│       └── page.tsx          # Nowa przesyłka
├── jrwa-classes/
│   ├── page.tsx              # Lista/drzewo
│   ├── import/
│   │   └── page.tsx          # Import CSV
│   └── [id]/
│       └── page.tsx          # Edit
└── page.tsx                  # Dashboard modułu (opcjonalny)
```

---

## ⚠️ Najczęstsze pułapki

### 1. ❌ NIE używaj `document_ids` w Phase 1
```typescript
// ❌ BŁĄD
const shipment = { documentIds: [...] }

// ✅ POPRAWNIE (Phase 1)
const shipment = { attachmentIds: [] }  // Obecnie zawsze puste
```

### 2. ❌ NIE implementuj statusu `archived`
```typescript
// ❌ BŁĄD
const status: IncomingShipmentStatus = 'archived'

// ✅ POPRAWNIE
const status: IncomingShipmentStatus = 'draft' | 'registered'
```

### 3. ❌ NIE edytuj `rpwNumber` po rejestracji
```typescript
// RPW jest immutable po nadaniu!
// Walidacja po stronie backendu rzuci błąd
```

### 4. ✅ Zawsze waliduj senderId XOR senderDisplayName
```typescript
// Co najmniej jedno musi być wypełnione
if (!senderId && !senderDisplayName) {
  throw new Error('Provide senderId or senderDisplayName')
}
```

---

## 🚀 Quick Start dla developera

1. **Przeczytaj:**
   - Ten dokument
   - `PODSUMOWANIE-WERYFIKACJI-SPOJNOSCI.md`
   - Sekcję "Opis UX (MVP)" w `records-przesylki-wplywajace.mdx`

2. **Zrozum:**
   - Phase 1 vs Phase 2 model
   - Statusy: draft/registered (bez archived)
   - Generator RPW i format numeru

3. **Zacznij od:**
   - Lista przesyłek (najprostszy component)
   - Potem formularz create/edit
   - Na końcu akcja register i import JRWA

4. **Wzoruj się na:**
   - `sales` module - formularze
   - `catalog` module - listy i filtry
   - `customers` module - relacje

5. **Pytania?**
   - Sprawdź `consistency-verification-report.md`
   - Sprawdź `records-przesylki-wplywajace.mdx`
   - Zagląnij do kodu backendu w `packages/core/src/modules/records/`

---

**Happy coding! 🎉**
