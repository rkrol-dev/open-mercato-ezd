Critical Business Questions - eDoreczenia Integration Retrospective

## Overview

This document contains 30 critical questions that should have been clarified with business stakeholders BEFORE implementation of the eDoreczenia integration and incoming shipments module. Each question represents a real ambiguity, edge case, or business decision point encountered during development where unclear requirements forced assumptions or resulted in rework.

## Business Rules & Data Validation

### 1. What is the exact format and validation rules for the RPW number, and who owns the sequence?

**Decision**: stwórz kreator schematu RPW. Uwzględnij, że ZAWSZE występuje RWP, {seq} oraz {year}. {seq} zeruje się każdego roku. Numeracja jest per-organization. Administrator organizacji może do scehamtu RPW dodać: symbol komórki organizacyjnej pracownika.

### 2. Can an incoming shipment exist without a sender (customer), and how should we handle correspondence from unknown or anonymous sources?

**Decision**: tak, przesyłka może istnieć bez nadawcy (wprowadź pole wyboru: nadawca anonimowy).

### 3. What are the retention policy rules for incoming shipments after registration, and how do they interact with JRWA classification?

**Decision**: archiwizacji podlegają dokumenty. Po wykonaniu brakowania (usuwania dokumentów z systemu) - usuwana jest informacja o przesyłce (kaskada). Przesyłka może zawierać więcej niż 1 dokument, a te dokumenty mogą mieć różna kategorie archiwizacji, więc bezpiecznie będzie założyć że przesyłka jest usuwana tylko jeśli usuwany jest ostatni dokument z nią powiązany.

### 4. Should the system prevent registration of a shipment if the assigned JRWA class is inactive or archived?


**Decision**: klasa JRWA nadawana jest na poziomie dokumentu i już po zarejestrowaniu przesyłki. To czynność merytoryczna wykonywana po przekazaniu dokumentu do komórki merytorycznej. Nie wiążemy JRWA z przesyłką, tylko z dokumentem.

### 5. What happens when an organization unit is deactivated or restructured after shipments are assigned to it?


**Decision**: nic się nie dzieje. Zachowywana jest historyczna wartość.

## Workflow & State Management

### 6. Can a registered shipment ever be unregistered or have its registration revoked, and under what circumstances?

**Decision**: Przesyłka zarejestrowana może wrócić do "draft" celem poprawy metadanych (nadawca, tytuł, dodanie dokumentu). taka operacja odkłada się w historii.

### 7. What is the business process when a correspondence sync fails repeatedly - who is notified and what are the escalation procedures?

**Decision**: na ten moment passive error logging is sufficient.

### 8. Should the system auto-retry failed syncs, and if so, with what backoff strategy and maximum retry count?

**Decision**: jeśli nie uda się połączenie, system będzie próbował w kolejnym oknie syncrhonizacji (nieudane zadanie jest odkładane w logu a następna próba w kolejnym oknie synchronizacji). Utwórz panel dla administratora, lub dedykowane filtry w logach, gdzie bedzie można przeglądać historie połączeń i powody błędów.

### 9. Can multiple users edit the same incoming shipment simultaneously, and how should edit conflicts be resolved?

**Decision**: nie. jedna osoba pracuje nad przesyłką w jednym czasie.

### 10. What is the business rule for changing the receiving organization unit after documents have been added to a shipment?

**Decision**: changing org unit should cascade to documents.

## Integration & External Systems

### 11. How should the system handle correspondence that appears in eDoreczenia but references a sender that exists in the system under a different name variant?


**Decision**: w przypadku systemów zewnętrznych, adres źródłowy - adres do doręczeń elektronicznych, adres skrytki ePUAP - są unikalne. łącz nadawców po adresach skrzynek z których ta korespondencja przychodzi. Dodatkowo, unikalne pole to: numer REGON. Pola NIP oraz KRS rozróżniają podmioty, ale możliwe jest posiadanie jednego numeru NIP dla głównego podmiotu i ten sam numer NIP ale różne REGON dla oddziałów. Dlatego NIP zawęża listę podmiotów, ale nie jest jednoznaczny (chyba że w bazie masz 1 wynik - wtedy powiąż bezpośrednio).

To ważne: Podmioty (Customers) mają dodatkowe pola: REGON, NIP, KRS, adres eDoreczen, adres ePUAP.

### 12. What is the expected behavior when eDoreczenia returns correspondence with missing or malformed required fields (subject, sender, received date)?

**Decision**: pomiń taką przesyłkę, odłóż w logach błąd.

### 13. Should the UPD (Urzędowe Poświadczenie Doręczenia) be sent immediately during sync or as a separate asynchronous process?

**Decision**: immediately during sync.

### 14. What happens if a correspondence is marked as 'fetched' in eDoreczenia but the local shipment creation fails - should we retry or consider it processed?

**Decision**: utrata korespondencji ma poważne skutki formalne dla podmiotu publicznego. Zaprojektuj proces, który zapewni że żadna przesyłka nie zostanie utracona. Potwierdzaj odbiór przesyłki dopiero po jej poprawnym pobraniu do systemu.

### 15. Can the same external correspondence (identified by external_id) be synced multiple times, and should the system create duplicate shipments or update existing ones?

**Decision**: w takim przypadku powinien utworzyć nową przesyłkę. Nowa przesyłka zawierająca ten sam external_id co już istniejąca, powinna wyświetlić komunikat z linkiem do przesyłki wcześniej zarejestrowanej. Przesyłkę w stanie "draft" (która nie była nigdy wcześniej zarejestrowana) można usunąć z systemu zwalniając numer RPW. Pracownik moze wiec kontynuuować rejestracje lub usunąć ją z systemu.

## User Experience & Permissions

### 16. Should workers be able to see incoming shipments from all organization units, or only those assigned to their unit?

Decision: only those assigned to their unit.

### 17. Who has permission to delete a registered shipment, and what is the audit/approval process for deletion?

Decision: zarejestrowanej przesyłki nie można usunąć. Można ją przekazać dalej, a pracownik merytoryczny przypisze ją do JRWA nie stanowiącego akt sprawy. Taka przesyłka zostanie usunięcia w procedurze brakowania przez osobę z właściwymi uprawnieniami. Wprowadź uprawnienie "Brakowanie" - osoby, która może usuwać dokumenty i przesyłki.

### 18. Should the system prevent workers from registering shipments outside their assigned organization units?

**Decision**: usuń możliwość wybierania "org unit". Rejestracja odbywa sie w org unit pracownika, który rejestruje przesyłkę.

### 19. What user roles should have access to the mock eDoreczenia interface, and should it be available in production environments?

**Decision**:  superadmin-only włącza i wyłącza ten moduł per tenant. Administrator organizacji organizacji nadaje uprawnienia dostępu innym osobom do tego modułu (jeśłi superadmin włączył). Moduł może być obecny na produkcji.

### 20. Can workers create incoming shipments manually without them originating from a correspondence source integration?

Decision: yes. Przesyłki mogą przyjść pocztą lub zostać doręczone osobiście. 

## Document Management & Attachments

### 21. What is the maximum allowed file size and total storage limit per shipment, and who pays for storage costs?

**Decision**: platform-level defaults apply.

### 22. Are there specific file types that must be blocked for security reasons (executables, scripts, certain archives)?

**Decision**: none.

### 23. Should documents inherit JRWA classification and retention from their parent shipment, or can they have independent classification?

Decision: JRWA otrzymuje wyłącznie dokument. Przesyłka nie ma JRWA. Nie dochodzi wiec do dziedziczenia.

### 24. What happens to documents when their parent incoming shipment is deleted - cascade delete or orphan prevention?

**Decision**: usunąć można przesyłkę tylko w stanie draft i taka, która nie była wcześniej zarejestrowana. Wtedy usuwane są również dokumenty powiazane z tą przesyłką. Ususuwanie przesyłki realizowane jest wyłącznie przez usunięcie (brakowanie) wszystkich dokumetów, które były powiązane z tą przesyłką.

### 25. Can workers re-order documents within a shipment, and does document order have business meaning (e.g., chronological, by importance)?

Decision: no, document order has no business meaning.

## Error Handling & Edge Cases

### 26. How should the system handle the case where two workers attempt to register the same shipment simultaneously?

**Decision**: zaproponuj rozwiązanie, które zaadresuje ten i inne edge case'y.

### 27. What is the business process when correspondence arrives before the customer exists in the system - block sync, create customer, or manual triage?

decision: create customer

### 28. If a JRWA class is deleted after CSV import fails, should the system roll back the entire import or commit successful rows?
decision: commit successful rows.

### 29. Should the system maintain a history of all syncs attempted (including zero-result syncs) or only syncs that created shipments?

decision: only syncs that created shipments

### 30. What is the expected system behavior during database maintenance windows - should active syncs be paused, failed gracefully, or retried automatically?

decision: active syncs be paused.