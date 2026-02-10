# Raport weryfikacji spójności: analiza wykonawcza ↔ mapowanie na obiekty

**Data:** 2026-02-10  
**Status:** W toku

## Cel weryfikacji

Weryfikacja spójności między:
1. **Analiza wykonawcza**: `records-przesylki-wplywajace.mdx`
2. **Dokumentacja integracji**: `edoreczenia/implementation.md`
3. **Mapowanie obiektów**: pliki w `mapping/openmercato-ezd/`

## Metodologia

Weryfikacja obejmuje sprawdzenie spójności:
- Nazw encji i pól
- Struktur danych (typy, wymagalność, wartości domyślne)
- Endpointów API
- Logiki biznesowej i workflow
- Relacji między modułami
- Statusów i stanów

---

## 1. Weryfikacja encji RecordsIncomingShipment

### ✅ SPÓJNE (Zgodność 100%)

| Aspekt | Analiza wykonawcza | Implementacja | Status |
|--------|-------------------|---------------|---------|
| Nazwa tabeli | `records_incoming_shipments` | `records_incoming_shipments` | ✅ |
| Pola podstawowe | organizationId, tenantId, receivingOrgUnitId | ✓ | ✅ |
| receivingOrgUnitSymbol | text (snapshot) | text | ✅ |
| subject | text (wymagane) | text | ✅ |
| senderId / senderDisplayName | uuid/text (XOR) | uuid nullable / text nullable | ✅ |
| senderAnonymous | boolean | boolean (default: false) | ✅ |
| deliveryMethod | text (wymagane) | text | ✅ |
| status | 'draft' \| 'registered' | 'draft' \| 'registered' | ✅ |
| receivedAt | timestamptz nullable | timestamptz nullable | ✅ |
| rpwNumber | text nullable | text nullable | ✅ |
| rpwSequence | number nullable | integer nullable | ✅ |
| postedAt | timestamptz nullable | timestamptz nullable | ✅ |
| senderReference | text nullable | text nullable | ✅ |
| documentDate | timestamptz nullable | timestamptz nullable | ✅ |
| noDocumentDate | boolean | boolean (default: false) | ✅ |
| documentSign | text nullable | text nullable | ✅ |
| noDocumentSign | boolean | boolean (default: false) | ✅ |
| accessLevel | text (default: 'public') | text (default: 'public') | ✅ |
| hasChronologicalRegistration | boolean | boolean (default: false) | ✅ |
| mappingCoverage | 'none'\|'partial'\|'full' | text (default: 'none') | ✅ |
| isActive | boolean | boolean (default: true) | ✅ |
| created_at, updated_at, deleted_at | timestamptz | Date | ✅ |

### ⚠️ UWAGI

1. **Pole `attachment_ids` vs `document_ids`**:
   - **Implementacja**: `attachmentIds: string[] = []` (line 62)
   - **Dokumentacja analiza wykonawcza** (line 207): `document_ids: uuid[]` – powiązane dokumenty (relacja do `records.documents`)
   - **Dokumentacja mapowanie** (data-dictionary line 34): `attachmentIds` | uuid[]
   
   **PROBLEM**: **Niespójność semantyczna**
   - W implementacji używa się `attachmentIds` (załączniki)
   - W analizie wykonawczej mowa o `document_ids` (dokumenty z encji records.documents)
   - To są **dwa różne koncepty**:
     - `attachmentIds` = bezpośrednie referencje do plików w module attachments
     - `document_ids` = referencje do encji `records.documents` (która sama ma `attachmentIds`)
   
   **WYMAGANA DECYZJA**: Który model jest właściwy dla MVP?
   - Opcja A: Przesyłka → Dokumenty → Załączniki (zgodnie z analizą wykonawczą)
   - Opcja B: Przesyłka → Załączniki (obecna implementacja, uproszczony model)

2. **Pola integracyjne dla systemów zewnętrznych**:
   - **Dokumentacja analiza wykonawcza**: `external_rpw_number`, `external_document_ids` (nowe pola dla EZD RP/eSODOK)
   - **Dokumentacja mapowanie**: `externalRpwNumber`, `externalDocumentIds`
   - **Implementacja**: brak pól w encji `RecordsIncomingShipment`
   
   **Status**: planowane - wymagają rozszerzenia encji i synchronizacji w module `correspondence_sources`.

---

## 2. Weryfikacja encji RecordsRpwSequence

### ✅ SPÓJNE

| Aspekt | Analiza wykonawcza | Implementacja | Status |
|--------|-------------------|---------------|---------|
| Nazwa tabeli | `records_rpw_sequences` | `records_rpw_sequences` | ✅ |
| Scope | (organization_id, tenant_id, receiving_org_unit_id, year) | ✓ | ✅ |
| currentValue | integer | integer (default: 0) | ✅ |
| Unique constraint | (tenant, org, unit, year) | ✓ | ✅ |

**Zgodność**: Format RPW: `RPW/{kanc_id}/{seq:5}/{yyyy}` - zgodny z decyzją Q2-RPW-001/002

---

## 3. Weryfikacja encji RecordsJrwaClass

### ✅ SPÓJNE

| Aspekt | Analiza wykonawcza | Implementacja | Status |
|--------|-------------------|---------------|---------|
| Nazwa tabeli | `records_jrwa_classes` | `records_jrwa_classes` | ✅ |
| code | text | text | ✅ |
| name | text | text | ✅ |
| parentId | uuid nullable | uuid nullable | ✅ |
| retentionYears | integer nullable | integer nullable | ✅ |
| retentionCategory | text nullable | text nullable | ✅ |
| version | integer | integer (default: 1) | ✅ |
| Unique constraint | (tenant, org, version, parent, code) | ✓ | ✅ |

### ⚠️ UWAGI

1. **Pole `archival_package_variant`**:
   - **Dokumentacja data-dictionary** (line 153): `archivalPackageVariant` | enum | `package_a` / `package_b`
   - **Implementacja**: BRAK tego pola
   
   **NIESPÓJNOŚĆ**: Pole wymienione w słowniku danych nie jest zaimplementowane

---

## 4. Weryfikacja integracji correspondence_sources ↔ records

### ✅ SPÓJNE

| Aspekt | Dokumentacja implementation.md | Implementacja | Status |
|--------|--------------------------------|---------------|---------|
| Tabela correspondence_sources | Opisana (lines 70-94) | CorrespondenceSource entity | ✅ |
| Tabela sync_logs | Opisana (lines 100-113) | CorrespondenceSyncLog entity | ✅ |
| Tabela mock_correspondence | Opisana (lines 118-139) | MockCorrespondence entity | ✅ |
| Pole delivery_method | Ustawiane na sourceType | ✓ (line 316, implementation.md) | ✅ |
| Mapowanie metadanych | subject, sender, receivedAt, etc. | ✓ (lines 302-311) | ✅ |

**Zgodność**: Integracja między modułami jest prawidłowo opisana w obu miejscach.

---

## 5. Weryfikacja API Endpoints

### Przesyłki wpływające

| Endpoint | Analiza wykonawcza | api-map.mdx | Status |
|----------|-------------------|-------------|---------|
| GET /api/records/incoming-shipments | line 320 | line 24 | ✅ |
| POST /api/records/incoming-shipments | line 321 | line 24 | ✅ |
| PUT /api/records/incoming-shipments | line 322 | line 24 | ✅ |
| DELETE /api/records/incoming-shipments | line 323 | line 24 | ✅ |
| POST .../register | line 326 | line 42 | ✅ |

### JRWA Classes

| Endpoint | Analiza wykonawcza | api-map.mdx | Status |
|----------|-------------------|-------------|---------|
| GET/POST/PUT/DELETE /api/records/jrwa-classes | lines 330-333 | line 30 | ✅ |
| POST /api/records/jrwa-classes/import | line 336 | line 209 | ✅ |

### ⚠️ BRAKUJĄCE w implementacji (wymienione w mapowaniu)

Z pliku `api-map.mdx`:
- `/api/records/documents` (line 25) - **NIE ZAIMPLEMENTOWANE**
- `/api/records/folders` (line 26) - **NIE ZAIMPLEMENTOWANE** (to alias dla cases)
- `/api/records/cases` (line 27) - **NIE ZAIMPLEMENTOWANE**
- `/api/records/record-links` (line 28) - **NIE ZAIMPLEMENTOWANE**
- `/api/records/case-registers` (line 29) - **NIE ZAIMPLEMENTOWANE**
- `/api/records/chronological-locations` (line 31) - **NIE ZAIMPLEMENTOWANE**
- `/api/records/chronological-assignments` (line 32) - **NIE ZAIMPLEMENTOWANE**
- `/api/records/case-parties` (line 33) - **NIE ZAIMPLEMENTOWANE**

**UWAGA**: To są encje zaplanowane w MVP ale jeszcze nie zaimplementowane. Dokumentacja jest spójna z planem, implementacja jest częściowa (zgodnie z "Stan implementacji" line 98-109).

---

## 6. Weryfikacja słownika danych vs analiza wykonawcza

### RecordsIncomingShipment

Porównanie pól między `data-dictionary.mdx` (lines 24-51) a `records-przesylki-wplywajace.mdx` (lines 195-211):

#### ⚠️ RÓŻNICE W NAZWACH PÓL

| Słownik danych | Analiza wykonawcza | Status |
|----------------|-------------------|---------|
| `senderId` / `senderDisplayName` | `sender_name` | ⚠️ RÓŻNE |
| `attachmentIds` | `document_ids` | ⚠️ RÓŻNE (semantycznie) |

**Problem 1**: W słowniku danych (line 28) mowa o `senderId` lub `senderDisplayName`, ale w analizie wykonawczej (line 202) jest `sender_name`. W implementacji jest `senderId` i `senderDisplayName`, więc analiza wykonawcza jest nieaktualna.

**Problem 2**: Semantyka załączników (opisane w sekcji 1 powyżej).

---

## 7. Weryfikacja encji RecordsDocument (planowanej)

### ❌ NIESPÓJNOŚĆ: BRAK IMPLEMENTACJI

Encja `RecordsDocument` jest szeroko opisana w dokumentacji:
- **Analiza wykonawcza** (lines 267-303): Pełny opis pól i relacji
- **entity-map.mdx** (line 30): Mapowanie encji
- **data-dictionary.mdx** (lines 72-104): Szczegółowy słownik pól
- **api-map.mdx** (line 25): Planowane API

**Ale**: Encja NIE ISTNIEJE w `packages/core/src/modules/records/data/entities.ts`

**Status**: Zgodnie z sekcją "Stan implementacji" (line 112) jest to encja "częściowo zdefiniowana w sekcji 5.3, ale nie zaimplementowana". To jest **zgodne z planem** - dokumentacja jest przygotowana do implementacji.

---

## 8. Weryfikacja nazewnictwa: camelCase vs snake_case

### ✅ SPÓJNE

- **Baza danych**: snake_case (np. `receiving_org_unit_id`)
- **TypeScript/API**: camelCase (np. `receivingOrgUnitId`)
- **Konwersja**: Obsługiwana przez MikroORM z `@Property({ name: 'snake_case' })`

To jest standardowa konwencja w repozytorium i jest stosowana konsekwentnie.

---

## 9. Weryfikacja statusów i workflow

### RecordsIncomingShipment

| Aspekt | Dokumentacja | Implementacja | Status |
|--------|--------------|---------------|---------|
| Statusy MVP | 'draft', 'registered', 'archived' | 'draft', 'registered' | ⚠️ |

**NIESPÓJNOŚĆ**: Dokumentacja (line 360, analiza wykonawcza) wspomina status `'archived'`, ale implementacja definiuje tylko `'draft' | 'registered'` (entities.ts line 3).

**UWAGA**: W komentarzu Q3-VAL-003 (line 360) jest wymieniony status `archived`, ale TypeScript type tego nie zawiera.

---

## 10. Weryfikacja relacji i powiązań między modułami

### Integracja correspondence_sources → records

✅ **SPÓJNE**: 
- Dokumentacja `implementation.md` (lines 296-339) opisuje integrację
- W analizie wykonawczej (lines 87-95) jest sekcja "Integracja z modułem correspondence_sources"
- Obie sekcje są ze sobą zgodne

### Integracja z directory (struktura organizacyjna)

✅ **SPÓJNE**:
- Analiza wykonawcza (lines 199, 552-558): Opisuje użycie `receiving_org_unit_id` z modułu directory
- api-map.mdx (line 23, 138): Kancelaria jako komórka organizacyjna w directory
- conceptual-model.mdx (lines 27-29, 101-107): Model konceptualny

### Integracja z attachments

⚠️ **WYMAGA DECYZJI**:
- Analiza wykonawcza (line 560-567): Opisuje integrację przez `attachment_ids` w dokumencie
- Implementacja: Używa `attachmentIds` bezpośrednio na przesyłce
- **Konflikt**: Czy przesyłka ma bezpośrednie załączniki czy przez encję Document?

---

## Podsumowanie głównych niespójności

### 🔴 KRYTYCZNE (wymagają natychmiastowej decyzji)

1. **attachment_ids vs document_ids** na RecordsIncomingShipment
   - Implementacja: `attachmentIds` (bezpośrednie referencje do plików) - line 62 entities.ts
   - Dokumentacja analiza wykonawcza: `document_ids` (referencje do encji records.documents) - line 207
   - Kod sync service: `attachmentIds: []` z komentarzem "Will be populated when we handle documents" (correspondenceSyncService.ts line 251)
   - Dokumentacja integracji: "Document attachments not yet integrated (Phase 2)" (implementation.md line 335)
   - **Analiza**: To jest **celowa rozbieżność Phase 1 vs Phase 2**:
     - **Phase 1 (obecna)**: Uproszczony model - przesyłka → attachments (bezpośrednio)
     - **Phase 2 (planowana)**: Pełny model - przesyłka → documents → attachments
   - **WNIOSEK**: Implementacja jest zgodna z Phase 1. Dokumentacja opisuje docelowy model Phase 2.
   - **Działanie**: Zaktualizować analizę wykonawczą, aby jasno rozdzielić Phase 1 i Phase 2

### 🟡 ŚREDNIE (wymaga aktualizacji dokumentacji lub implementacji)

2. **Status 'archived' dla incoming shipments**
   - Dokumentacja: wspomina status 'archived'
   - Implementacja: TypeScript type nie zawiera 'archived'

3. **Pole archival_package_variant w JRWA**
   - Słownik danych: wymienia to pole
   - Implementacja: nie zawiera tego pola

4. **Pole sender_name w analizie wykonawczej**
   - Powinno być: senderId / senderDisplayName (zgodnie z implementacją)

### 🟢 INFORMACYJNE (zgodne z planem)

5. **Encja RecordsDocument**: Nie zaimplementowana, ale to jest zgodne z "Stan implementacji"
6. **Brakujące API endpoints**: Planowane w MVP, jeszcze nie zaimplementowane
7. **UI/Frontend**: Całkowicie brak (zgodnie z planem - line 98)

---

## Rekomendacje

### Natychmiastowe działania (przed rozpoczęciem prac implementacyjnych)

1. **WYJAŚNIENIE**: Model relacji przesyłka↔dokumenty↔załączniki jest już rozstrzygnięty
   - **Phase 1 (obecna implementacja)**: Przesyłka → Załączniki (bezpośrednio przez `attachmentIds`)
   - **Phase 2 (planowana)**: Przesyłka → Dokumenty (records.documents) → Załączniki
   - To jest ŚWIADOMA decyzja - Phase 1 jest uproszczeniem na czas MVP
   
2. **AKTUALIZACJA DOKUMENTACJI**: Jasno rozdzielić Phase 1 i Phase 2 w analizie wykonawczej
   - Dodać sekcję wyjaśniającą różnicę między Phase 1 (attachmentIds) i Phase 2 (documentIds)
   - W opisie pola wyraźnie oznaczyć Phase 1 vs Phase 2
   - Zaktualizować linię 207 w records-przesylki-wplywajace.mdx

3. **UJEDNOLICENIE**: Status 'archived'
   - Dodać do TypeScript type jeśli jest potrzebny
   - LUB usunąć z dokumentacji jeśli nie jest w MVP

4. **UZUPEŁNIENIE**: Pole `archival_package_variant` w JRWA
   - Dodać do implementacji jeśli jest w MVP
   - LUB usunąć ze słownika danych jeśli nie jest w MVP

### Działania średnioterminowe

5. **KONSYSTENCJA**: Przejrzeć wszystkie wystąpienia `sender_name` w dokumentacji i zamienić na `senderId`/`senderDisplayName`

6. **WERYFIKACJA**: Po każdej zmianie w implementacji, aktualizować odpowiednie sekcje w:
   - Analizie wykonawczej
   - Słowniku danych
   - Mapowaniu API
   - Mapowaniu encji

---

## Wnioski

**Status ogólny**: 🟡 **Dobry, ale wymaga decyzji przed implementacją**

- Większość dokumentacji jest spójna i dobrze zsynchronizowana
- Główny problem: nierozstrzygnięty model relacji przesyłka↔dokumenty↔załączniki
- Pozostałe niespójności są drobne i łatwe do naprawienia
- Dokumentacja jest przygotowana "na wyrost" (opisuje więcej niż zaimplementowano), co jest dobre do planowania

**Gotowość do implementacji**: 🟡 **Warunkowo gotowe**
- Można rozpocząć implementację UI/frontend dla już istniejących encji
- **WYMAGANE**: Rozstrzygnięcie modelu dokumentów przed implementacją obsługi załączników
