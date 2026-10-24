# Paket · Verkauf 2027 auf „Für dich“ · Stand 24.10.2026

Auftrag von Alex (24.10.2026): Fokus der GF bis Jahresende sind Cashflow und Festival-Launches. Der Kompass soll den
Verkaufsstand je Festival gegen Ziel zeigen, auf einen Blick, ohne Klick. Heute steht er in keinem System
(`vvp_sales_entries` ist leer, die einzige Zahl kam per Mail). Entschieden, ohne weitere Rückfrage zu bauen.

Zwei Stufen. Stufe 1 wird jetzt gebaut. Stufe 2 erst, wenn XCeed den Schlüssel für die Partner Tickets API
geliefert hat (siehe `docs/XCEED-SCHNITTSTELLE.md`).

## Abschnitt 0 · Vorlauf (ergänzt am 25.10.2026 vor dem Bau)

### Auftrag (wörtlich, 25.10.2026)

> Hol den aktuellen Stand mit git pull. Kopiere "~/Documents/Claude/02 Projects/Geschäftsführung Wilde Möhre/Claude outputs/PAKET-VERKAUF-2027.md" nach docs/ und setze es vollständig um, Abschnitt 0 zuerst und den Prüfweg in Abschnitt 2 mit den Codex-Runden vor dem Push.

### Lesart (Annahme, ohne Rückfrage)

Die Vorlage vom 24.10. hatte keine nummerierten Abschnitte. Nach dem Muster der früheren Pakete (Auftrag, Ausgangslage, Annahmen, Prüfung) gilt:
**Abschnitt 0** ist dieser Vorlauf: Ausgangslage lesend prüfen, Abweichungen und Annahmen festhalten, bevor gebaut wird.
**Abschnitt 1** ist „Stufe 1“ (1a bis 1d) unverändert. **Abschnitt 2** ist der Prüfweg unten, vor dem Push.
„Vollständig“ heißt Stufe 1 ganz; Stufe 2 bleibt gesperrt, bis XCeed den Schlüssel liefert.

### Ausgangslage (lesend geprüft am 25.10.2026)

- `git pull` auf `main`: `8c35752`. Arbeitszweig `paket/verkauf-2027`. Der alte Ordner `~/Documents/GitHub/gfweekly` existiert nicht mehr, gearbeitet wird im Klon `~/gfweekly`.
- `vvp_sales_entries`: 0 Zeilen. Keine Tabelle `hh_verkauf*`. Letzte Migration der Fernhistorie: `20261024141128`.
- Alle fünf `event_id` der Seed-Tabelle gibt es in `vvp_events`.
- **Live-Edge-Function `gfweekly` ist nicht der main-Stand**, sondern byte-gleich mit dem nicht gepushten Zweig `paket/blick-board` (`aac38da`, 23.10.): zusätzlich `topic_get`, `themen_sammeln` und zwei `updated_at`-Zeilen; die Datenbankfunktionen `hh_themen_sammeln` und `hh_themen_erledigt_archivieren` sind angewendet. Ein Deploy aus main würde diese Aktionen live entfernen. Darum übernimmt dieses Paket genau diese Zeilen der Funktion unverändert („Live-Stand übernommen“), aber keine Seiten und keine Migrationsdateien von `paket/blick-board`. Die heutige main-Oberfläche ruft die beiden Aktionen nicht auf.
- Assets stehen auf `main` bei `?v=38`, `paket/blick-board` schon auf `?v=39`. Dieses Paket geht auf `?v=39`; `paket/blick-board` muss vor seinem Push auf `?v=40`.

### Abweichungen der Vorgabe von `vvp_events` (Seed folgt der Vorgabe)

| Festival | Feld | Vorgabe (geseedet) | `vvp_events` |
|---|---|---|---|
| Fluidity | VVK-Start | 2026-08-01 | 2026-10-25 |
| Lusatia | VVK-Start | null (Start offen) | 2026-10-15 |
| Draußenbande | Festivalbeginn | 2027-07-29 | 2027-07-30 |

`vvp_events` wird nicht geändert. Korrekturen an `hh_verkauf_ziel` gehen bis auf Weiteres nur per SQL (keine Pflegemaske in Stufe 1).

### Rechenregeln (Annahmen zu 1b)

- **Letzter Stand** je Festival: jüngster Stichtag; bei gleichem Stichtag `xceed_api` vor `xceed_mail` vor `hand`.
- **Vorwoche** für den Trend: der jüngste Stand mit Stichtag 7 bis 13 Tage vor dem Stichtag des letzten Stands (gleiche Rangfolge). Trend = Differenz der Tickets.
- **Tempo** = Tickets ÷ Wochen vom VVK-Start bis zum Stichtag, mindestens eine Woche. Ohne VVK-Start oder mit VVK-Start nach dem Stichtag: kein Tempo.
- **Nötiges Tempo** = (Ziel − Tickets) ÷ Wochen vom Stichtag bis 14 Tage vor Festivalbeginn. Ziel erreicht: 0. Keine Wochen mehr übrig: kein Wert.
- **Plan**: „im Plan“ (Ton `pos`), wenn Tempo ≥ nötiges Tempo; sonst „unter Plan“ (Ton `warn`). Ohne VVK-Start „Start offen“, VVK-Start in der Zukunft „VVK ab TT.MM.“, ohne Stand „noch kein Stand“.
- **Ältester Stand** im Kopf: Alter in Tagen (Europe/Berlin) des ältesten letzten Stands; Festivals ohne Stand werden zusätzlich gezählt („2 ohne Stand“) und zählen für den Ton `warn` mit.

### Weitere Annahmen

- Die Kachel öffnet die Eingabe; `gfKachel` erhält dafür eine Knopf-Variante (`<button>`), eine zweite Zeile und einen Trendwert. Bestehende Aufrufe bleiben unverändert.
- `by` ist die Person im Browser (Alex oder Lea), geprüft wie bei Vorhaben (`vhBy`).
- Eine Lösch-Aktion gibt es nicht (nicht beauftragt). Der Teststand der Abnahme wird per SQL entfernt.
- Push und Netlify-Veröffentlichung: Im Auto-Modus ist Push gesperrt; Alexander pusht selbst, danach folgt die Live-Prüfung.

### Grenzen

- Der Regelstand-Helfer kennt `~/gfweekly` nicht (kein registriertes Projekt); es gelten die Projektunterlagen im Repo.
- Wer speichert, wählt der Browser; die Edge Function prüft nur das gemeinsame Passwort (wie überall im Kompass).

## Stufe 1 · Kacheln, Handeingabe, Tempo

### 1a Migration `supabase/migrations/<zeitstempel>_hh_verkauf.sql`

`hh_verkauf_ziel` (eine Zeile je Festival und Saison): `festival_key text`, `saison int`, `name text`,
`ziel_tickets int`, `minimal_tickets int null`, `vvk_start date null`, `festival_von date`, `event_id uuid null`
(nur Verweis auf `vvp_events`, kein Fremdschlüssel, nichts wird dort geschrieben), `sort int`, `aktiv boolean default true`.
PRIMARY KEY (festival_key, saison).

Seed Saison 2027 (Ziel / Minimalfall Lea vom 12.10. / VVK-Start / Festival / event_id):

| festival_key | name | ziel | minimal | vvk_start | festival_von | event_id |
|---|---|---|---|---|---|---|
| fluidity | Fluidity | 5000 | 1500 | 2026-08-01 | 2027-08-27 | 7125581f-c5c5-45c7-80f0-51e4056951d4 |
| wilde-moehre | Wilde Möhre Freude Edition | 5000 | 3500 | 2026-09-01 | 2027-08-20 | 2f1f096a-1df9-4795-8ade-400ccb0b45a4 |
| draussenbande | Malina, Morio & die Draußenbande | 3000 | 2000 | 2026-10-01 | 2027-07-29 | 44dee651-47b8-4bd4-af38-f2014d571fbd |
| lusatia | Lusatia | 4500 | 2000 | null (Start offen) | 2027-07-23 | eaf9bd69-c54b-446d-809f-eb20a2369cdd |
| by-nature | by nature | 3500 | 0 | 2026-11-01 | 2027-08-06 | 6f6e1bcf-88fa-4989-9711-b4bc40f5c491 |

Die eG-Pakete (15.11.) gehören zur mit Freude eG und kommen nicht in diese Tabelle.

`hh_verkauf_stand`: `id uuid`, `festival_key text`, `saison int`, `stichtag date`, `tickets int`, `umsatz_brutto_cents bigint null`,
`quelle text CHECK (hand|xceed_api|xceed_mail)`, `notiz text null`, `by text`, `created_at`, `updated_at`.
UNIQUE (festival_key, saison, stichtag, quelle). RLS an ohne Policies, wie die anderen Kompass-Tabellen.

### 1b Edge Function, zwei Actions

`verkauf_list {saison=2027}` liefert je aktivem Festival: Ziel, Minimal, VVK-Start, letzter Stand (Stichtag, Tickets, Umsatz,
Quelle; bei gleichem Stichtag gewinnt `xceed_api` vor `xceed_mail` vor `hand`), Stand von vor 7 bis 13 Tagen für den Trend,
Anteil am Ziel in Prozent, **Tempo** (Tickets je Woche seit VVK-Start) und **nötiges Tempo** (Rest bis Ziel geteilt durch die Wochen
bis 14 Tage vor Festivalbeginn). Ohne Stand: `stand: null`.

`verkauf_set {festival_key, stichtag (Standard heute Europe/Berlin), tickets, umsatz_euro?, notiz?, by}` speichert mit
`quelle = 'hand'`, Upsert auf den Unique-Schlüssel. `tickets` ganzzahlig ≥ 0, Umsatz optional.

Vor dem Deploy wie immer Live-Stand gegen die Repo-Datei diffen.

### 1c „Für dich“ (index.html)

Neuer Abschnitt `#fdVk` „Verkauf 2027“ direkt unter „Deine 5 Minuten heute“, für Alex und Lea gleich. Eine Kachelreihe über
`gfKachel`, eine Kachel je Festival:

- Zahl = Tickets, Einheit „/ 5.000“ (Ziel), Beschriftung = Festivalname, darunter „Stand 22.10.“.
- Trend gegen den Stand der Vorwoche als Pfeil mit Zahl.
- Ton `warn`, wenn Tempo unter dem nötigen Tempo liegt, mit Wort („unter Plan“), nie Farbe allein. Ton `pos` bei „im Plan“.
- Ohne VVK-Start: Wort „Start offen“. Ohne Stand: „noch kein Stand“ und die Kachel öffnet die Eingabe.

Klick auf eine Kachel öffnet ein kleines Modal: Stichtag (Datum, Standard heute), Tickets (Zahlenfeld), Umsatz in Euro (optional),
Notiz (optional), Knopf „Speichern“ als einziger Primärknopf. Darunter die letzten fünf Stände dieses Festivals.

Kopfzeile des Abschnitts: Summe Tickets aller Festivals gegen Summe der Ziele (21.000) und ein Satz, wie alt der älteste Stand ist
(„ältester Stand 9 Tage“, Ton `warn` ab 8 Tagen, damit die wöchentliche Pflege nicht einschläft).

Mobil (390): zwei Kacheln je Zeile. Stile in `styles.css`, eigener Block „Verkauf“ (`.vk-*`), nur Tokens.

### 1d Abnahme

Playwright 1440 und 390, dunkel und hell, ohne Konsolenfehler, Check-in-Karte wie gewohnt unterdrücken. Ein Teststand speichern
und wieder löschen (Festival `draussenbande`, Notiz „Test“). Webapp-Standard der Organisationswerkstatt (44 px, Kontrast) wie in
den letzten Paketen. Assets `?v=` hochzählen. README und `docs/TECHNIKSTAND.md` um einen kurzen Abschnitt ergänzen.
Commit „feat(verkauf): Verkauf 2027 je Festival auf Für dich“, Push, Live-Prüfung auf kompass.wildehabitate.de.

## Stufe 2 · XCeed liefert selbst (später)

Sobald XCeed den Lese-Schlüssel für die Partner Tickets API gegeben hat: Supabase-Secret `XCEED_API_KEY`, Action `verkauf_xceed_sync`
liest `GET /v1/tickets` mit `updatedAtFrom` je XCeed-Event, summiert je Festival und Tag, schreibt `quelle = 'xceed_api'`.
pg_cron stündlich nach dem Muster des Asana-Rückwegs (Laufsperre, Zeitbudget). Zuordnung XCeed-Event zu `festival_key` als
Spalte `xceed_event_id` in `hh_verkauf_ziel`. Handeingaben bleiben stehen; für denselben Tag gewinnt die API.

Offen für Alex: den Schlüssel bei partners@xceed.me anfragen (der Vertrag ist abgeschlossen, damit ist der Weg frei).

## Abschnitt 2 · Prüfweg vor dem Push (ergänzt am 25.10.2026)

1. **Datenbank:** Migration zuerst in einer zurückgerollten Transaktion gegen das echte Projekt prüfen, dann per `db query --linked` mit Eintrag in der Fernhistorie anwenden. Seed zurücklesen (5 Zeilen, Summe der Ziele 21.000).
2. **Edge Function:** Live-Stand herunterladen und gegen die Repo-Datei diffen (erwartet: nur die Verkauf-Teile). Deploy mit `--use-api`, `ping` zeigt die neue Version.
3. **Wirkungsprobe gegen das echte Backend** (`pruefung/verkauf-probe.mjs`): `verkauf_list` liefert fünf Festivals; `verkauf_set` speichert einen Teststand für `draussenbande` mit Notiz „Test“, Upsert auf denselben Stichtag ändert statt zu verdoppeln, ungültige Eingaben ergeben 400; danach löscht die Probe genau ihre eigenen Zeilen nach Kennung, auch nach einem Abbruch (Rückweg von Hand: `pruefung/verkauf-testdaten-loeschen.sql`). Ein echter Handstand von heute für `draussenbande` sperrt das Schreiben. Rechenregeln als reine Funktionsprobe mit festen Daten.
4. **Oberfläche:** Playwright bei 1440 und 390 px, dunkel und hell, ohne Konsolenfehler, Check-in unterdrückt; Bedienproben mit abgefangener API (Kachel öffnet Eingabe, Speichern, letzte fünf Stände, Tastatur, Escape); Webapp-Standard (44 px, Kontrast) über `pruefung/abnahme.sh` einschließlich `webstandard-pruefung.mjs`.
5. **Codex-Review** am festen Commit, read-only in eigenem Worktree, mit Auftrag und dieser Datei wörtlich, ohne weitere Reviewer: bis drei Runden. Bestätigte Befunde beheben, Fehlbefunde begründet verwerfen, danach erneut testen.
6. **Push** durch Alexander, dann **Live-Prüfung** auf kompass.wildehabitate.de: Dateien mit `?v=39`, Abschnitt „Verkauf 2027“ sichtbar, keine Konsolenfehler.
