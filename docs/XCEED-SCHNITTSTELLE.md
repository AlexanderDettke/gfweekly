# XCeed: Schnittstelle, Webhooks, Exporte · Stand 03.10.2026

Auftrag: `docs/PAKET-V31-VORHABEN.md`, Abschnitt 31e. Geprüft, ob XCeed für Veranstalter eine Schnittstelle, Webhooks oder regelmäßige
Exporte per Mail anbietet. Gebaut wird in V31 nichts davon. Alles hier ist Recherche in öffentlichen Quellen vom 03.10.2026, nicht bei XCeed bestätigt.

## Kurz

- **Schnittstelle: ja.** XCeed veröffentlicht zwei APIs. Für uns zählt die **Partner Tickets API** (privat, mit API-Schlüssel): Events, Angebote,
  Tickets und Buchungen lesen, „ideal for statistics and reporting“. Den Schlüssel vergibt XCeed auf Anfrage an partners@xceed.me.
- **Webhooks: in der Doku keine.** Die veröffentlichte Dokumentation (Stand 03.10.2026) nennt keine Webhooks und keine Push-Benachrichtigung;
  Änderungen holt man per Abfrage (`updatedAtFrom` an `/v1/tickets`).
- **Regelmäßige Exporte per Mail: nicht dokumentiert.** Im Veranstalter-Backoffice (XCEED Pro) gibt es CSV-Exporte von Hand (Buchungen mit
  QR-Codes, gefilterte Kundenlisten). Einen geplanten Bericht per Mail beschreibt XCeed öffentlich nicht. Das ist eine Frage an XCeed.

## Die beiden APIs

| API | Zugang | Inhalt | Für uns |
|---|---|---|---|
| Open Event API 1.3.1 (`events.xceed.me`, `offer.xceed.me`) | ohne Anmeldung | Events, Event-Details, Line-up, Künstler, Angebote | Eventseiten, kein Verkauf |
| Partner Tickets API 2.4.2 (`partner.xceed.me`, Testumgebung `partner.staging.xceed.me`) | Header `X-API-Key`, Schlüssel über partners@xceed.me | `GET /v1/events`, `GET /v2/events/:eventId/offers`, `GET /v1/tickets` (je Ticket, mit `updatedAtFrom`), `GET /v1/bookings` und `/v1/bookings/:bookingId` (laut Changelog 2.4.2 vom 14.04.2026 als veraltet markiert) | Verkaufszahlen je Festival und Angebot, Stand je Stunde |

## Was das für das Hohe Haus heißt

1. **Sobald es einen Schlüssel gibt** (Frage an XCeed im laufenden Vertrag, Ball beim Vorhaben „XCeed Ticketing-Vertrag“), kann ein späteres Paket
   die Verkaufszahlen je Festival stündlich lesen, nach dem Muster des Asana-Rückwegs (pg_cron, Laufsperre, Zeitbudget). Der Schlüssel gehört dann
   als Supabase-Secret `XCEED_API_KEY` in die Edge Function, nicht in den Quelltext.
2. **Bis dahin** liest der Abgleich aus Cowork eingehende Mails von xceed.me mit (`docs/ABGLEICH-VORHABEN.md`, Quelle C: „Mails von xceed.me … immer prüfen“), solange Gmail sie nicht als Werbung oder Soziales einsortiert.
3. **Falls XCeed Berichte per Mail anbietet:** an `alex+xceed@wildemoehre.org` schicken lassen (Plus-Adresse von Google Workspace, landet im
   Postfach von Alex). Der Abgleich liest diese Adresse in einer eigenen Suche ohne Kategorie-Ausschluss (Quelle C2 in `docs/ABGLEICH-VORHABEN.md`,
   Nachtrag vom 03.10.2026); im eingerichteten Cowork-Auftrag steht C2 erst, wenn sein Text ersetzt ist. **Nicht** an `alex+einwurf@…`: was dort ankommt, wird zu einem
   Einwurf mit Vorschlag und landet in der Warteschlange der Vorhaben, ein täglicher Verkaufsbericht gehört nicht dorthin.

## Offene Fragen an XCeed

- Gibt es Webhooks (Buchung angelegt, storniert, Einlass) oder ist Abfragen der einzige Weg?
- Gibt es geplante Berichte (täglich oder wöchentlich, Verkäufe je Event und Angebot) per Mail?
- Bekommen wir für die Partner Tickets API einen Lese-Schlüssel nur für unsere Events, und ab wann (Go-live der ersten Tranche)?

## Quellen

- XCeed Documentation (Postman Documenter), abgerufen am 03.10.2026: https://docs.xceed.me/ (Sammlung „Xceed Documentation“, Open Event API 1.3.1, Partner Tickets API 2.4.2 mit Changelog)
- XCEED Pro für Veranstalter: https://xceed.me/en/business
- XCeed Hilfe, Tickets exportieren: https://support.xceed.me/en/articles/2720629-how-to-export-tickets-to-other-ticketing-platforms
- XCeed Hilfe, Kunden analysieren und exportieren: https://support.xceed.me/en/articles/9046809-how-to-analyse-your-customers
