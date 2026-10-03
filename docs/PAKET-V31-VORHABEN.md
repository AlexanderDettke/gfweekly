# Das Hohe Haus · Paket V31 Vorhaben · Stand 03.10.2026

Bauanleitung für Claude Code im Repo ~/Documents/GitHub/gfweekly. Freigabe durch Alex am 03.10.2026 für alle Teilpakete 31a bis 31e in einem Zug. Ziel: Alex und Lea sehen an einem Ort, welche Vorhaben laufen, wo sie stehen, wer den Ball hat und was als Nächstes passiert, von der Metaphase bis zum einzelnen Punkt. Gespräche, Telefonate, Mails und Plattformen landen in der Akte des Vorhabens, und ein Schichtwechsel ist ein Knopfdruck.

Termin: alles live bis Montag, 12.10.2026 abends. Lea übergibt am Dienstag, 13.10., und ist vom 14. bis 25.10. im Urlaub. Die Übergabe ist der erste Ernstfall.

Referenz für Optik und Bedienung (von Alex freigegeben): `docs/referenz/vorhaben-prototyp-gesamt.dc.html` (eine Seite, Umschalter Woche, Board, Liste, Akte rechts mit Reitern Prozess und Verlauf, Einwurf und Übergabe als Dialog). Ergänzend `vorhaben-prototyp-akte-prozess.dc.html`, `vorhaben-prototyp-akte-faden.dc.html`, `vorhaben-prototyp-einwurf-mobil.dc.html` (drei Handy-Schritte), `vorhaben-prototyp-uebergabe.dc.html`, `vorhaben-prototyp-woche.dc.html`. Die Dateien sind Design-Komponenten (`.dc.html`) aus Claude Design: Markup und Daten als Vorlage lesen, nicht einbinden. Gebaut wird im bestehenden Stil des Hauses (`site/assets/styles.css`, `core.js`, Tokens, Bausteine aus V21).

## Leitprinzip

Das Paket ist eine Antwort auf zu viel Information. Jede Entscheidung im Bau wird daran gemessen, ob Alex und Lea danach weniger lesen müssen. Die Vorhaben liegen über dem Bestand und saugen ihn auf: Themen, Kandidaten und Neuigkeiten hängen an einem Vorhaben und erscheinen dort verdichtet. Es entsteht kein weiterer Posteingang neben Neuigkeiten und Sichtungskorb. Im Zweifel die einfachere Variante bauen und in `FRAGEN_FUER_MORGEN.md` nennen.

## Was schon steht (aus Cowork, 03.10.2026)

Datenbank (Supabase-Projekt `bnfmupnmqyrcltrphfak`), angewendet per Supabase-MCP, Dateien liegen im Repo mit derselben Versionskennung wie in der Fernhistorie:

- `supabase/migrations/20261003162639_hh_vorhaben_tabellen.sql`: `hh_vorhaben`, `hh_vorhaben_punkte`, `hh_vorhaben_verlauf`, `hh_einwurf`, RLS an ohne Policies, kein Zugriff für anon und authenticated.
- `supabase/migrations/20261003162647_hh_vorhaben_verknuepfung.sql`: `vorhaben_id` an `gfweekly_topics` und `gfweekly_news`, `gfweekly_handover.kind` kennt `vorhaben`.
- `supabase/migrations/20261003163017_hh_vorhaben_lage_view.sql`: Sicht `hh_vorhaben_lage` mit Punkten, letzter Bewegung, offenen Themen, neuen Kandidaten, offenen Einwürfen und `zustand` (ball_fehlt, ueberfaellig, bewegt, ruhig).
- `supabase/migrations/20261003163436_hh_vorhaben_abwesenheit.sql`: `ball_vor_abwesenheit`, `absence_id` an `hh_vorhaben`.

Nicht angewendet, weil der MCP-Aufruf jeweils nach 180 s abbrach: der Trigger für `updated_at` (Funktion mit `$$`-Körper) und die Neuanlage der Sicht nach dem letzten ALTER. Beides ist Teil von 31a.

Erstbefüllung am 03.10.2026 aus WhatsApp (GF-Chat bis 03.10. 16:21), Gmail, Saisonplanung und Entscheidungen vom 02.10.:

- 16 Vorhaben mit Ball, Stand, nächstem Schritt, Frist und Saison-Verweis (`saison_row_id`, `saison_item_id` auf `gfweekly_saison_items`), Metaphase „Systembau, Launch und Formatpartner“.
- 65 Checklistenpunkte, 45 Verlaufseinträge (`source_ref` beginnt mit `seed:`).
- Offene Themen und Kandidaten bzw. Ticker der letzten 45 Tage per Schlüsselwort einem Vorhaben zugeordnet (Regeln: siehe Abschnitt Zuordnung unten). Was nicht passt, hat `vorhaben_id` null.

Gegenprobe vor dem Bau: `select slug, punkte_erledigt, punkte_gesamt, themen_offen, kandidaten_neu, zustand from hh_vorhaben_lage order by sort;` Erwartet 16 Zeilen, XCeed mit 4 von 9 Punkten.

## Arbeitsweise und Prüfschleife mit Codex

1. Branch `paket/v31-vorhaben` anlegen, in `docs/ARBEITSPAKETE.md` als WP-V31 eintragen (Eintrag ist vorbereitet). Erster Commit: die von Cowork abgelegten Dateien (`docs/PAKET-V31-VORHABEN.md`, `docs/reviews/V31-pruefauftrag.md`, `docs/referenz/*`, die vier Migrationen, `docs/ABGLEICH-VORHABEN.md`) mit `docs(v31): Paket, Prüfauftrag, Referenz und Migrationen aus Cowork`.
2. Teilpakete in der Reihenfolge 31a, 31b, 31c, 31d, 31e. Je Teilpaket: bauen, eigene Prüfungen (`pruefung/abnahme.sh` plus die neuen Proben), Commit, dann Codex am genauen Commit:

   ```bash
   SHA=$(git rev-parse --short HEAD)
   codex exec --sandbox read-only -C "$PWD" "$(cat docs/reviews/V31-pruefauftrag.md)

   Teilpaket: 31a. Commit: $SHA. Basis: $(git merge-base HEAD origin/main | cut -c1-7).
   Prüfe gegen docs/PAKET-V31-VORHABEN.md, Abschnitt 31a." > docs/reviews/V31a-runde-1.md
   ```

3. Jeden Befund beantworten in `docs/reviews/V31a-antwort-1.md`: Nummer, Schwere, Entscheidung (übernommen, teilweise, verworfen), Beleg (Commit, Testausgabe, Abfrage oder Codezeile). Grundhaltung: Codex hat recht, bis das Gegenteil belegt ist. Verwerfen braucht einen Beleg, eine Meinung reicht nicht. Empfehlungen (nicht nur Fehler) werden umgesetzt, wenn sie innerhalb des Pakets bleiben und das Haus einfacher oder verlässlicher machen. Erweiterungen über das Paket hinaus kommen in `FRAGEN_FUER_MORGEN.md`.
4. Neue Runde, bis eine Runde keinen Befund der Schwere schwer oder mittel mehr hat, höchstens drei Runden je Teilpaket. Was danach offen bleibt, steht mit Begründung in `docs/BEKANNTE-MAENGEL.md`.
5. Am Ende eine Gesamtprüfung über `origin/main..HEAD` mit dem Zusatz aus dem Prüfauftrag „Gestaltung und Bedienung“: Codex nennt höchstens fünf Änderungen, durch die Alex und Lea weniger lesen müssten. Claude Code setzt um, was dem Leitprinzip folgt, und begründet den Rest.
6. Lernlog `docs/reviews/V31-lernlog.md`: was Codex gefunden hat, das die eigenen Prüfungen übersehen haben, und welche Regel daraus folgt. Ist die Regel mechanisch prüfbar, kommt sie in `pruefung/waechter.mjs`.

Regeln aus den bisherigen Paketen gelten weiter: vor jedem Commit `git log` und `git status`, Edge Function nur aus `supabase/functions/gfweekly/index.ts`, vor dem Deploy den Live-Stand diffen, Deploy aus der Supabase-CLI. Assets `?v=` hochzählen bei jeder Änderung an `core.js` oder `styles.css`. Keine Gedankenstriche in Oberflächentexten. Nur Tokens, keine neuen Farben. Farbe trägt Information nicht allein (Symbol plus Wort). Tests, die die Edge Function abfangen, heißen Oberflächentest. Gepusht wird von Alex.

## 31a · Backend fertigstellen, Edge Function v38

### Migration (neue Datei, Kennung aus `supabase migration new`)

- Sicht `hh_vorhaben_lage` per `drop view` und `create view` neu anlegen, damit `ball_vor_abwesenheit` und `absence_id` enthalten sind. Rechte wie bisher (nur service_role).
- Funktion `public.hh_touch_updated_at()` mit `set search_path = public` und Trigger `before update` auf `hh_vorhaben` und `hh_vorhaben_punkte`.

### Aktionen in `supabase/functions/gfweekly/index.ts`

Alle Aktionen hinter dem bestehenden Passwort, Personen normiert wie in den anderen Aktionen (`Alex`, `Lea`), `by` Pflicht bei schreibenden Aktionen.

- `vorhaben_list {status?: 'aktiv'|'alle'}` liefert die Zeilen aus `hh_vorhaben_lage` (Standard: status aktiv und pausiert), sortiert nach `sort`, dazu je Vorhaben die nächste offene Punkt-Frist und die Saison-Daten (`gfweekly_saison_rows.label`, `vvk_start`), dazu die aktiven und geplanten Abwesenheiten aus `gfweekly_absences` (für die Bänder der Wochenansicht) und die Zahl der offenen Einwürfe ohne Vorhaben.
- `vorhaben_get {id|slug}` liefert Vorhaben, Punkte (sortiert), Verlauf (neueste zuerst, höchstens 200, Status bestaetigt und vorschlag), verknüpfte offene Themen (`id, title, board_lane, gate`), neue Kandidaten (`id, title, relevance`), offene Einwürfe.
- `vorhaben_save {id?, slug?, felder…, by}` legt an oder ändert (erlaubte Felder: title, gruppe, strand, ball, ball_name, owner, stand, naechster_schritt, frist, frist_text, konflikt, status, sort). Ändert sich `ball`, setzt die Aktion `ball_seit = now()` und schreibt einen Verlaufseintrag `art uebergabe`, Text „Ball von <alt> an <neu>“ plus optional `notiz`. Ändert sich `naechster_schritt` oder `stand`, schreibt sie einen Eintrag `art system`, damit „Seit du zuletzt da warst“ es sieht. Neuer `slug` aus dem Titel, eindeutig.
- `punkt_save {id?, vorhaben_id, titel, position?, stand?, wer?, frist?, sort?, by}`, `punkt_toggle {id, erledigt, by}` (setzt `erledigt_at`, `erledigt_by`, schreibt Verlauf „Punkt erledigt: <titel>“ bzw. „Punkt wieder offen: <titel>“), `punkt_delete {id, by}` (nur ohne Verlauf mit Bezug; sonst Fehlermeldung mit Grund).
- `verlauf_add {vorhaben_id, art, wer, text, tag?, happened_at?, source_url?, by}` und `verlauf_status {id, status: 'bestaetigt'|'verworfen', by}`. Verlauf wird nicht gelöscht, nur verworfen.
- `vorhaben_verknuepfen {kind: 'thema'|'kandidat', id, vorhaben_id|null, by}` setzt `vorhaben_id` an Thema oder Neuigkeit.
- `einwurf_add {text, kanal: 'knopf'|'sprache'|'cowork'|'whatsapp'|'mail', von, vorhaben_id?, by}` speichert den Einwurf und fragt die Anthropic-API (Secret `ANTHROPIC_API_KEY`, Modell aus `GFWEEKLY_EINWURF_MODEL`, sonst `GFWEEKLY_TIDY_MODEL`, sonst wie `tidy_suggest`). Eingabe an das Modell: der Text, heutiges Datum (Europe/Berlin), Person, die aktiven Vorhaben mit slug, Titel, Ball, Stand, nächstem Schritt, Frist und den offenen Punkten mit ihrer `id`. Antwort als JSON, das die Aktion streng prüft:

  ```json
  {"vorhaben_slug":"xceed","sicherheit":0.0,
   "verlauf":{"art":"telefon","wer":"Alex","text":"…","tag":"…"},
   "punkte":[{"id":"<uuid eines offenen Punkts>","stand":"…","erledigt":false}],
   "neue_punkte":[{"titel":"…","wer":"…","frist":"2026-10-05"}],
   "ball":null, "naechster_schritt":null, "frist":null,
   "benachrichtigung":"morgen"}
  ```

  Unbekannte Punkt-IDs, unbekannte Slugs und ungültige Daten werden verworfen und in `vorschlag.verworfen` vermerkt. Der Vorschlag wird gespeichert (`status vorgeschlagen`), angewendet wird nichts. Fällt die KI aus oder läuft in einen Timeout von 20 s, bleibt der Einwurf mit `status neu` und ohne Vorschlag stehen; die Oberfläche bietet dann die Zuordnung von Hand an. Ein vorgegebenes `vorhaben_id` (Einwurf aus einer offenen Akte) hat Vorrang vor der Erkennung.
- `einwurf_apply {id, vorhaben_id?, auswahl: {verlauf: bool, punkte: [ids], neue_punkte: [index], ball: bool, naechster_schritt: bool, frist: bool}, benachrichtigung?: 'morgen'|'sofort', by}` wendet die gewählten Teile an (über dieselben Funktionen wie oben, damit Verlauf und Protokoll gleich entstehen), setzt den Einwurf auf `uebernommen`. Der Verlaufseintrag trägt `art` aus dem Vorschlag (bei Kanal mail: `mail`) und verweist auf den Einwurf (`source_ref = 'einwurf:<id>'`). `benachrichtigung sofort` legt einen Ticker in `gfweekly_news` an (kind ticker, source manuell, who die andere Person, vorhaben_id gesetzt), damit er im Laufband und in der Rückkehr erscheint.
- `einwurf_verwerfen {id, by}`, `einwurf_list {status?: 'offen'|'alle', vorhaben_id?}`.
- Übergabe: `handover_build` nimmt Vorhaben auf, deren Ball bei der abwesenden Person liegt, und Vorhaben mit Ball `gf`, deren Frist im Fenster liegt (kind `vorhaben`, ref_id = id). Für `score(item, absence)`: Frist aus `frist` oder der nächsten offenen Punkt-Frist, Text aus Titel, Stand, nächstem Schritt und offenen Punkten, Ball `gf` zählt wie gate gf. Dossier: Stand, nächster Schritt, offene Punkte, die letzten fünf Verlaufseinträge, Konflikt. `handover_set` auf eine Vorhaben-Zeile: Vertretung gesetzt, dann `ball_vor_abwesenheit = ball`, `ball` = Person der Vertretung, `absence_id`, Verlaufseintrag „in Vertretung für <Person> bis <bis>“; Ampel ruht, dann Ball unverändert und Verlaufseintrag „ruht bis <bis + 1 Tag>“. Bei `absence_end` und beim Statuswechsel nach `rueckkehr` in `absence_tick` gehen die Bälle zurück (nur Zeilen mit dieser `absence_id`, deren Ball seitdem nicht von Hand geändert wurde), mit Verlaufseintrag.
- `schicht_uebergabe {von, an, eintraege: [{vorhaben_id, ball: 'alex'|'lea'|'gf'|'team'|'extern'|'offen', ball_name?, notiz?}], by}` für den Schichtwechsel ohne Abwesenheit (Feierabend, Nachtschicht vorbei): je Eintrag Ballwechsel über `vorhaben_save` und ein Verlaufseintrag `art uebergabe` mit der Notiz.
- `ping` meldet `version: 38`.

### Wirkungsprobe

`pruefung/vorhaben-probe.mjs` gegen das echte Backend, ohne Abfangen (Passwort aus der Umgebung `GF_PW`): `vorhaben_list` liefert mindestens 16 Zeilen; `vorhaben_get xceed` liefert 9 Punkte; an einem Testvorhaben `test-v31` (von der Probe angelegt, am Ende `status archiviert`): Punkt anlegen, abhaken, wieder öffnen, Ballwechsel, Verlauf prüfen, Einwurf mit KI (Text „Telefonat mit Testperson, Punkt Probe ist erledigt“), Vorschlag prüfen, anwenden, Ergebnis in der Datenbank prüfen. Die Probe räumt hinter sich auf und schreibt nichts in echte Vorhaben.

## 31b · Seite `site/vorhaben.html`

Navigation: Gruppe „Heute“, zweiter Eintrag „Vorhaben“ (nach „Für dich“), Tooltip „Woche, Board, Liste, Akte je Vorhaben“, Zähler-Marke mit der Zahl der offenen Einwürfe plus Vorhaben mit Ball bei mir und Zustand überfällig. Neues Linien-Icon im Stil von `GF_ICONS` (Zielscheibe oder Wegweiser).

Kopf: Metaphase aus `gfweekly_saison_items` (Zeile `meta`, heute im Zeitraum), Titel „Vorhaben“, eine Zeile Lage („Stand <Zeit> · 16 Vorhaben · 7 Bälle bei Lea, Urlaub ab 14.10.“), Umschalter Woche, Board, Liste (Chip-Reihe aus V21, gemerkt in localStorage `gf_vh_view`), Filter Alle, Bei mir, Bewegt, Konflikte (gemerkt in `gf_vh_filter`; „Bei mir“: Ball bei der Person oder `gf` oder `owner` die Person bei Ball extern), Knöpfe „Übergeben“ und „Einwurf“ (Hauptaktion).

Woche (Standard): Zeilen je Kalenderwoche ab der laufenden Woche (Montag bis Sonntag, Europe/Berlin), bis acht Wochen voraus, danach „Später“ und „Ohne Datum“. Oben eine Zeile „Überfällig“, wenn es Einträge gibt. Ein Vorhaben steht in der Woche seiner maßgeblichen Frist: `frist`, sonst die nächste offene Punkt-Frist, sonst „Ohne Datum“. Karte: Tag, Titel, nächster Schritt, Ball mit Avatar oder Initialen, Marke (★ Launch bei `gruppe launch` und Saison-Eintrag VVK-Start in dieser Woche, ⚠ überfällig, ⚠ Ball fehlt, ⚠ Konflikt mit dem Text aus `konflikt`). Bänder für Abwesenheiten aus `gfweekly_absences` in den betroffenen Wochen („Lea im Urlaub bis So 25.10. · Vertretung Alex“), nichts hart codiert.

Board: Spalten Alex, Lea, GF gemeinsam, Team, Wartet extern, Ball fehlt. Karte ziehbar zwischen Spalten (Ballwechsel über `vorhaben_save`, mit Rückfrage bei Team und Extern nach dem Namen), alternativ Knopf „Ball weitergeben“ auf der Karte (Tastatur und Handy). Spalte mit mehr als fünf Vorhaben bekommt die Warnmarke und den Satz „<n> Vorhaben, <k> mit Frist in 14 Tagen“.

Liste: Gruppen Launch-Strecke, Geld und Verträge, Team und Rollen, Partner, System, Sonstiges, je Zeile Zustand, Titel und Stand, Ball, nächster Schritt, Frist, Punkte „4 von 9“. Breite Tabelle scrollt in ihrem Kasten.

Akte: Klick auf eine Karte in jeder Ansicht öffnet die Akte, ab 1024 px als Spalte rechts, darunter als Vollbild-Blatt mit Zurück. Deep Link `vorhaben.html?v=<slug>` (und `&tab=verlauf`). Kopf: Gruppe, Titel, drei Kacheln Ball (seit), Frist, Punkte, Kasten „Nächster Schritt“ (inline bearbeitbar, Speichern beim Verlassen), Reiter Prozess und Verlauf.

- Prozess: Stand (inline bearbeitbar), bei Verträgen und Verhandlungen optional Stufen, wenn das Vorhaben welche hat (für V31 genügt: keine Stufen-Daten, Feld weglassen), Checkliste mit Haken (Toggle sofort), je Punkt Stand, wer, Frist, Quelle; „Punkt hinzufügen“; verknüpfte Themen und neue Kandidaten als Zähler mit Link (board.html?topic=…, neuigkeiten.html), „Ball geben an“ als Chip-Reihe, Abgleichstand aus `quellen` („XCeed-Konto 18:00 · Gmail 17:00 · WhatsApp-Export Sa 10:45“).
- Verlauf: neueste zuerst, je Eintrag Zeit, Kanal als Wort (WhatsApp, Telefon, Mail, Plattform, Notiz, Einwurf, Übergabe, Entscheidung), wer, Text, Tag. Einträge mit `status vorschlag` mit den Knöpfen Übernehmen und Verwerfen. Filter Alles, Nur Entscheidungen, Seit meinem letzten Besuch. Am Ende „Etwas eintragen …“ (öffnet den Einwurf mit diesem Vorhaben).

Mobil (390): eine Spalte, Umschalter und Filter als wischbare Zeilen, Einwurf als fester Knopf unten (56 px, Safe-Area), Akte als Vollbild. `pruefung/schirme.mjs` bekommt `vorhaben.html` mit Kern `#vhMain`.

## 31c · Einwurf

Ein Dialog, den `core.js` bereitstellt (`gfEinwurf({vorhaben_id?})`), erreichbar aus `vorhaben.html`, aus der Akte, aus „Für dich“ und auf dem Handy als fester Knopf auf diesen Seiten.

Ablauf wie im Prototyp `vorhaben-prototyp-einwurf-mobil.dc.html`: Textfeld „Was ist passiert?“ mit dem Hinweis „Am Handy: Mikrofon der Tastatur antippen und sprechen“, optional Vorhaben vorwählen, „Weiter“ ruft `einwurf_add`. Danach: „Erkannt: <Vorhaben>“ mit „ändern“, der vorgeschlagene Verlaufseintrag, die Änderungen als Haken (Punkt-Stand, Punkt erledigt, neue Punkte, Ball, nächster Schritt, Frist), „Die andere Person erfährt es: im Morgenbericht | sofort“, Knöpfe Bearbeiten und Übernehmen (`einwurf_apply`). Ohne Vorschlag: Auswahl des Vorhabens von Hand, dann nur Verlaufseintrag.

Warteschlange: Einwürfe, die per Mail oder aus Cowork kommen (Kanal mail, cowork, whatsapp), stehen mit Vorschlag in `hh_einwurf`. `vorhaben.html` zeigt oben „<n> Einwürfe warten“, Klick öffnet denselben Dialog Eintrag für Eintrag.

Keine eigene Sprachaufnahme und keine Transkription in V31. Die Diktierfunktion der Handytastatur reicht für den Anfang.

## 31d · Für dich, Übergabe, Rückkehr

- `index.html` (Für dich): neuer erster Block „Deine Vorhaben“: Vorhaben mit Ball bei mir oder `gf`, sortiert nach Frist, höchstens fünf, Rest „und <n> weitere →“ (vorhaben.html?filter=mir). Zweiter Block „Seit du zuletzt da warst“: Verlaufseinträge der letzten Tage seit dem letzten Besuch (localStorage `gf_vh_seen_<Person>`, ohne Wert die letzten 24 Stunden), gruppiert je Vorhaben, je Vorhaben eine Zeile mit Anzahl und jüngstem Eintrag, Marke „wartet auf dich“, wenn der Ball seitdem zu mir gewechselt ist. „Alles gesehen“ setzt den Zeitpunkt. Die bisherigen Blöcke rücken nach unten; was doppelt ist, entfällt (Entscheidung im Bau, im Zwischenbericht nennen).
- Übergabe aus `vorhaben.html`: Knopf „Übergeben“ öffnet den Dialog aus dem Prototyp. Auswahl Anlass: Feierabend oder Schichtende (nutzt `schicht_uebergabe`, keine Abwesenheit), Urlaub oder Krank (legt über `absence_set` eine Abwesenheit an oder nimmt die laufende und baut den Korb; die Vorhaben-Zeilen erscheinen oben mit den drei Wahlen „<andere Person> übernimmt“, „Ruht bis <Rückkehr>“, „Team“). Die Wahlen gehen über `handover_set`. `uebergabe.html` zeigt Vorhaben-Zeilen mit dem Wort „Vorhaben“ und Link in die Akte.
- `rueckkehr.html`: Abschnitt „Deine Vorhaben zurück“ mit den zurückgegebenen Bällen und je Vorhaben den Verlaufseinträgen seit Beginn der Abwesenheit.

## 31e · Abgleich und Quellen

Der Abgleich läuft als geplanter Cowork-Auftrag (eingerichtet aus Cowork am 03.10.2026, Text und Regeln in `docs/ABGLEICH-VORHABEN.md`). Claude Code baut dafür nichts in der Edge Function, prüft aber nach dem Deploy einmal, dass ein Lauf Einträge mit `source_ref` `abgleich:` erzeugt hat, und ergänzt den Technikstand.

XCeed: prüfen, ob XCeed für Veranstalter eine Schnittstelle, Webhooks oder regelmäßige Exporte per Mail anbietet. Ergebnis mit Quellen in `docs/XCEED-SCHNITTSTELLE.md`. Gebaut wird in V31 nichts davon; liefert XCeed Berichte per Mail, steht im Dokument, an welche Adresse sie gehen müssten, damit der Abgleich sie liest.

## Zuordnung (Stand der Erstbefüllung)

Schlüsselwörter, Groß- und Kleinschreibung egal, bei mehreren Treffern gewinnt die niedrigste Priorität: xceed (xceed, fever, ticketing, ticketanbieter, weeztix, celebratix, axs, niclaas; 1), infield (1), subardo (1), draussenbande (draußenbande, malina, morio, familienfest, merle, björn; 1), lusatia (1), bynature (1), gls (gls, wegstein, kredit, glamping, automat; 2), helge (2), freude-pakete (flex-ticket, pakete; 2), fluidity (fluidity, slawik, annie; 2), booking (jane, booking; 2), backoffice (beate, backoffice, buchhaltung; 2), liquiditaet (liquidit, darlehen, löhne, lohn, cash, zahlungsplan, bwa; 3), kollektive (3), habitat-hub (habitat hub, asana, aufgabenbereich; 3), wilde-moehre (wilde möhre festival, möhre 27, freude edition, wmf; 4). Die Akte zeigt verknüpfte Einträge mit einem Knopf „Zuordnung lösen“ (`vorhaben_verknuepfen` mit null), damit Fehltreffer schnell weg sind.

## Abnahme V31

1. `pruefung/abnahme.sh` läuft durch, `vorhaben.html` ist in den Schirmen (1440 und 390, dunkel und hell) ohne Meldung.
2. `node pruefung/vorhaben-probe.mjs` läuft gegen das echte Backend durch und hinterlässt keine Testdaten in aktiven Vorhaben.
3. Durchspiel am Live-Stand nach dem Deploy, als Alex und als Lea: Woche, Board, Liste umschalten; XCeed-Akte öffnen; Punkt abhaken und zurück; Ball von Lea an Alex und zurück; Einwurf „Telefonat mit Victor: Auszahlung ab Monat 1 schriftlich bis Montag“ mit Vorschlag übernehmen; Feierabend-Übergabe für zwei Vorhaben; Testabwesenheit (`test: true`) anlegen, Vorhaben-Zeile auf Vertretung setzen, Abwesenheit beenden, Ball zurück.
4. Codex-Runden je Teilpaket und Gesamtprüfung liegen in `docs/reviews/`, alle Befunde beantwortet.
5. README, `docs/TECHNIKSTAND.md` (Abschnitt V31), `ARBEITSSTAND.md`, Assets `?v=` hochgezählt, Edge Function v38 deployt und `ping` meldet 38.
6. Abschlussmeldung an Alex kurz: was er tun muss (Push, Live-Check am Handy) und was er wissen muss. Die ausführliche Doku steht im Technikstand.
