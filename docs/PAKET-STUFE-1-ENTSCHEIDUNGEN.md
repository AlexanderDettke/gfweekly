# Paket · Stufe 1 · Entscheiden können · Stand 25.10.2026

Auftraggeber: Alex. Entschieden am 25.10.2026: Umbau des Kompass in vier Stufen mit Toren (Zielbild im Design-Canvas „Kompass GF-Check Ansätze“,
Tafel „Zielbild“). Dieses Paket ist Stufe 1. Es läuft in der Terminal-Sitzung ohne Rückfragen durch, mit eigener Prüfung, unabhängiger
Gegenprüfung durch Codex und Korrekturrunden, bis zum Push. Es ersetzt das Paket „Aufräumen entlasten und GF-Check“ (Fassung 2 vom 25.10.),
aus dem nur Teil B (Postfach-Regel) und Teil D (Schrift-Tokens) übernommen werden.

Repo: ~/Documents/GitHub/gfweekly · Live: https://kompass.wildehabitate.de/ · Supabase: bnfmupnmqyrcltrphfak · Edge Function: gfweekly.
Maßgeblich: Organisationsstandards in `organisationsstandards/` (ORG-001 bis ORG-004) und `WEBAPP-PILOT-0.2` mit `docs/webapp-standard/`.
Gemeinsamer Regelkern: KI-Uebergaben/regelstand, REGELN.md 1.3 und KERN.md 1.0.1 (gelesen 25.10.).

## 0 · Vorhabenvermerk (ORG-001, ORG-002)

**Ablauf heute.** Der Kompass hält denselben Sachverhalt in drei Behältern: Vorhaben (15 aktiv, 46 offene Punkte, 345 Verlaufseinträge in
30 Tagen, 72 unbestätigte Vorschläge), Themen (53 offen, 31 davon an einem Vorhaben, 26 seit 30 Tagen unverändert, 34 ohne Stand und
nächsten Schritt) und Kandidaten (35 offen, 27 an einem Thema, 16 aus schon beantworteten Mails). Vier Läufe schreiben in je einen anderen
Behälter. Die Besprechungsseite zieht ihre Agenda aus 29 Einträgen mit Ausgang GF und wurde seit dem Bau (20.09.) nie gestartet
(gfweekly_sessions leer). Dazu eine Spielschicht (Taler, Lagerplatz, Flammen, Abzeichen, Habitat-Punkte, Überraschungen), die Alex am 25.10.
als nicht mehr nötig bezeichnet hat.

**Ergebnis Stufe 1.** Alex und Lea sehen auf einer Seite die offenen Entscheidungen der Geschäftsführung, jede als Frage mit Frist und Herkunft,
entscheiden, vertagen oder geben ab, und die Besprechung arbeitet genau diese Liste ab. Details bleiben einen Klick entfernt (Akte des
Vorhabens, Quelle). Beantwortete Mails erzeugen keine Karten mehr. Die Spielschicht ist aus.

**Zielbild (Stufen 2 bis 4, je eigenes Paket nach dem Tor).** Ein Behälter: das Vorhaben mit Punkten und Verlauf. Themen gehen in Punkte und
Verlauf auf oder ins Archiv; Kandidaten werden nur noch Vorschläge an Vorhaben. 12 Seiten in drei Gruppen (Heute, Werkstätten, Verwalten).
Läufe schreiben nur Vorschläge mit Bezug zu offenen Punkten. Siehe Abschnitt 10.

**Vorhandene Lösung zuerst (ORG-001 Schritt 3).** Die Besprechungsseite hat Sitzung, Timer, Protokoll, decision_add, Vertagen, Abgeben.
Das bleibt und wird auf die neue Liste gesetzt. Die Seite `entscheidungen.html` (Beschlüsse-Archiv unter Themen) wird zur neuen Seite
umgebaut, ihr bisheriger Inhalt wandert als Abschnitt „Beschlüsse“ ans Ende. Vorhaben-Punkte mit wer = GF sind heute schon die
Entscheidungen; sie bekommen nur eine Frageform und eine Frist. Keine neue Ebene, eine Sicht mit Gedächtnis.

**Datenführung.**

| Informationsart | Führender Ort | Kennung | Pflege | Konfliktregel |
|---|---|---|---|---|
| Entscheidung (Frage, Frist, Vorschlag, Status, Ergebnis) | `hh_entscheidungen` | (quelle_art, quelle_id) eindeutig | Lauf legt an und formuliert; Alex, Lea entscheiden | Person vor Lauf; Lauf ändert nie status, ergebnis, eine von Hand geänderte frage |
| Herkunft der Entscheidung | Vorhaben-Punkt, Thema oder Kandidat (bestehend) | id | wie bisher | Entscheiden schreibt ins Original zurück (Punkt erledigt, Thema entschieden, Kandidat übernommen) |
| Bearbeitungsstand eines Mail-Verlaufs | Gmail | threadId | Lauf | Gmail gewinnt |
| Zuordnung Kandidat oder Thema zu Vorhaben | `vorhaben_id` (bestehend), Vorschlag in `vorhaben_vorschlag` | id | Lauf schlägt vor, Person bestätigt | Person vor Lauf |
| Spielschicht | Tabellen gfweekly_score_*, badges, checkins bleiben | | keine | nichts löschen, nur Oberfläche und Aufrufe aus |

**Erfolgskriterium (ORG-003), vier Wochen ab Live-Gang.** Mindestens zwei Besprechungen von Alex und Lea über das Werkzeug, gestartet aus der
Entscheidungsliste. Liste am Ende der vier Wochen unter 15 offenen Entscheidungen. Aufräumen zeigt keine Karte mehr, deren Mail-Verlauf Alex
oder Lea nach dem Anlegen beantwortet haben. Abbruch, wenn nach drei Wochen keine Besprechung stattgefunden hat; dann wird vor Stufe 2 die
Ursache geklärt, nicht weitergebaut.

## 0a · Vorlauf der Terminal-Sitzung (ergänzt am 25.10.2026)

Auftrag wörtlich: „Lies docs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md vollständig. Führe die Abschnitte 1 bis 8 in dieser Reihenfolge aus und arbeite
ohne Rückfragen durch: triff Detailentscheidungen selbst und notiere sie im Technikstand. Stoppe nur bei einem Stopp-Grund aus Abschnitt 8.5
und schreibe dann die Zeile in FRAGEN_FUER_MORGEN.md. Am Ende docs/STAND-STUFE-1.md schreiben und mir die zehn Sätze daraus ausgeben.“

Ausgangslage: `~/Documents/GitHub/gfweekly` gibt es nicht, der Klon liegt in `~/gfweekly`; `origin/main` = `2f709ba` (Verkauf 2027 und Board
aufgeräumt, Assets `?v=40`, Edge Function Version 40 live). Bestand am 25.10.2026 gegen die Regeln aus Abschnitt 1: 10 Punkte (nicht 9), 24 Themen,
5 Kandidaten, davon 15 Themen ohne Frist, Vorschlag und nächsten Schritt. Alle Detailentscheidungen und Lesarten stehen in `docs/TECHNIKSTAND.md`,
Abschnitt „Stufe 1“. Kein Stopp-Grund aus Abschnitt 8.5 ist eingetreten.

## 1 · Datenmodell (Migration `supabase/migrations/<zeitstempel>_stufe1_entscheidungen.sql`, Versionskennung für den Wächter)

1. `hh_entscheidungen`: `id uuid default gen_random_uuid() primary key`, `quelle_art text CHECK (punkt|thema|kandidat)`, `quelle_id uuid`,
   `vorhaben_id uuid null` (vom Punkt oder aus dem Original übernommen), `frage text`, `frage_form boolean default false` (true, sobald der
   Lauf oder eine Person die Frage formuliert hat), `frage_von text null` (lauf | Alex | Lea), `frist date null`, `frist_quelle text null`
   (punkt | thema | kandidat | hand), `vorschlag text null`, `status text CHECK (offen|entschieden|vertagt|abgegeben|hinfaellig) default 'offen'`,
   `ergebnis text null`, `entschieden_am timestamptz null`, `entschieden_von text null`, `vertagt_bis date null`, `abgegeben_an text null`
   (alex | lea | team), `created_by text`, `run_id text null`, `created_at`, `updated_at`. UNIQUE (quelle_art, quelle_id). Index (status, frist).
   RLS an ohne Policies, kein Recht für anon und authenticated, wie die anderen Kompass-Tabellen.
2. Spalte `vorhaben_vorschlag uuid null` auf `gfweekly_news` und `gfweekly_topics` (Vorschlag des Laufs für den Korb, kein Fremdschlüssel).
3. Datenbankfunktion `hh_entscheidungen_sammeln()` (security definer, nur über die Edge Function aufrufbar): fügt fehlende Zeilen ein und
   aktualisiert Frist und vorhaben_id aus den Quellen, ändert nie status, ergebnis oder eine Frage mit frage_von in (Alex, Lea).
   Quellen: (a) `hh_vorhaben_punkte` mit `erledigt = false`, Vorhaben aktiv oder pausiert, und `wer` passend zu GF: `wer ILIKE 'GF%'`
   oder enthält sowohl „Alex“ als auch „Lea“ (Komma, &, und). frage = titel, frist = p.frist, vorschlag = v.naechster_schritt.
   (b) `gfweekly_topics` mit `archived = false`, `board_lane in (zu_besprechen, in_klaerung)`, `gate = 'gf'`. frage = title ohne
   Präfix „Titel: “, frist = gate_frist, vorschlag = next_action oder recommendation. (c) `gfweekly_news` mit `kind = 'kandidat'`,
   `status = 'neu'`, `gate = 'gf'`. frage = title, frist = gate_frist. Zeilen, deren Quelle inzwischen erledigt, archiviert, verworfen
   oder nicht mehr gate gf ist, bekommen status `hinfaellig` (nur wenn status offen oder vertagt war). Rückgabe: eingefügt, aktualisiert,
   hinfällig.
4. Datenbankfunktion `hh_entscheidung_entscheiden(p_id, p_ergebnis, p_by)` in einer Transaktion: status entschieden, ergebnis, entschieden_am,
   entschieden_von; Rückschreiben ins Original: Punkt → erledigt true, erledigt_at, erledigt_by, plus Verlaufseintrag im Vorhaben (art
   entscheidung, status bestaetigt, text „Entschieden: <Ergebnis>“, created_by 'kompass'); Thema → board_lane 'entschieden', decision
   = Ergebnis, resolved_at, und ein Eintrag in `gfweekly_decisions` wie decision_add; Kandidat → status 'uebernommen', decided_by, decided_at,
   archiv_grund 'entschieden'. Rückgabe: was geändert wurde, für Rückgängig.
5. `hh_entscheidung_vertagen(p_id, p_bis, p_by)`: status vertagt, vertagt_bis; bei Punkt die Frist des Punktes nachziehen, bei Thema und Kandidat
   gate_frist. `hh_entscheidung_abgeben(p_id, p_an, p_by)`: status abgegeben, abgegeben_an; im Original gate auf p_an (Thema, Kandidat) bzw.
   Punkt.wer auf die Person; Verlaufseintrag beim Vorhaben. `hh_entscheidung_zurueck(p_id, p_by)`: offen, Original zurück (nur innerhalb 24 h).
6. Seed: keiner. Die Erstbefüllung macht `hh_entscheidungen_sammeln()` beim ersten Aufruf von `entscheidungen_list`. Erwartung am
   Bestand vom 25.10.: 9 Punkte, 24 Themen, 5 Kandidaten, also 38 Zeilen; davon haben etwa 9 Themen Frist oder nächsten Schritt, 15 Themen
   weder noch (Abschnitt 3, „noch keine Frage“).

## 2 · Edge Function `gfweekly` (Datei supabase/functions/gfweekly/index.ts, Passwortschutz wie alle Actions, Schreiben nur by Alex oder Lea)

`entscheidungen_list {status? offen|vertagt|abgegeben|entschieden|alle, sync? true}`: ruft bei sync (Standard true) zuerst
`hh_entscheidungen_sammeln()`, liefert dann Zeilen mit Herkunft aufgelöst (Vorhaben-Titel und -Slug, Thema-Titel und id, Kandidat-Titel,
source_url), Zustand der Frist (überfällig, heute, diese Woche, nächste zwei Wochen, ohne), `reif` = frage_form oder frist oder vorschlag
vorhanden, Zähler (offen, diese Woche, überfällig, mit Vorschlag, unreif). Sortierung: überfällig, dann Frist aufsteigend, dann ohne Frist nach
updated_at. `entscheidung_set {id, frage?, frist?, vorschlag?, by}` (setzt frage_von = by, frage_form true).
`entscheidung_entscheiden {id, ergebnis (Pflicht, ≥ 5 Zeichen), by}`, `entscheidung_vertagen {id, bis, by}` (bis ≥ heute),
`entscheidung_abgeben {id, an alex|lea|team, by}`, `entscheidung_zurueck {id, by}`. Alle schreiben über die Funktionen aus Abschnitt 1,
Doppelaufruf erzeugt keine Dublette, Fehler kommen als verständlicher Text. `korb_list` und `korb_set {kind thema|kandidat, id, vorhaben_id|null,
aktion zuordnen|neu|verwerfen|archivieren, titel?, by}` für Abschnitt 4. `score_event` bleibt vorhanden, wird aber von keiner Seite mehr
aufgerufen. `gate_list` unverändert. Vor dem Deploy Live-Stand gegen die Repo-Datei diffen; Deploy mit
`npx supabase@latest functions deploy gfweekly --project-ref bnfmupnmqyrcltrphfak --no-verify-jwt`, danach `ping`.

## 3 · Seite `entscheidungen.html` (umgebaut; Nav: Gruppe Heute, zwischen Für dich und Vorhaben; aus GF_SUBNAV entfernen)

Vorlage ist die Tafel „Weg 3 · Entscheidungsliste“ im Canvas. Kopfbild wie Besprechung. Vier Kacheln: offen, diese Woche, mit Vorschlag,
überfällig. Abschnitte nach Fristzustand: Überfällig, Diese Woche, Nächste zwei Wochen, Ohne Frist, zuletzt „Noch keine Frage“ (unreif:
Thema ohne Frist, Vorschlag und Frageform) eingeklappt mit Zähler. Je Zeile: Frage (17 px, 600), darunter Herkunft (Art, Vorhaben oder
Thema, Frist mit Zustand, Quelle-Datum), darunter „Vorschlag: …“ wenn vorhanden. Rechts drei Knöpfe: „Entschieden“ (öffnet Blatt mit
Pflichtfeld Ergebnis, ein Satz), „Vertagen“ (Datumsfeld, Standard plus 7 Tage), „Abgeben“ (Chips Alex, Lea, Team). Tippen auf die Frage
klappt auf: Original-Text der Quelle, Link zur Vorhaben-Akte (`vorhaben.html?id=`) oder zum Thema (`board.html?topic=`) oder zur Mail,
Stift für Frage, Frist, Vorschlag (entscheidung_set). Nach jeder Aktion verschwindet die Zeile mit Hinweis 10 s „Rückgängig“
(entscheidung_zurueck). Fußleiste: „Besprechung heute: n überfällig und diese Woche“ und Primärknopf „Zur Besprechung“ (besprechung.html).
Unten der bisherige Abschnitt „Beschlüsse“ (decisions_list) als Klappe. Filter „Entschieden“ zeigt die letzten 30 Tage gedämpft.
Mobil 390: Knöpfe unter der Frage, 44 px; keine Zeile über drei Textzeilen ohne Aufklappen. Stile in `styles.css` als Block „Stufe 1“
(`.en-*`), nur Tokens, keine Hex-Werte außerhalb der Token-Blöcke, keine Gedankenstriche in Oberflächentexten.

## 4 · Korb auf `vorhaben.html`

Neuer Abschnitt „Ohne Vorhaben“ unter der Liste: Kandidaten (status neu) und Themen (offen) ohne vorhaben_id, je Eintrag Titel, Art,
Datum, Vorschlag des Laufs als Chip (vorhaben_vorschlag, mit Vorhaben-Titel), Knöpfe „Zuordnen“ (zum Vorschlag oder Auswahl aus den
aktiven Vorhaben als Chip-Reihe), „Neues Vorhaben“ (öffnet die bestehende Anlage mit Titel vorbelegt, danach Zuordnung), „Verwerfen“
(Kandidat → status verworfen) bzw. „Archivieren“ (Thema → archived, archiv_grund 'korb'). „Alle Vorschläge übernehmen“ mit Zähler in der
Rückfrage. Zuordnen setzt vorhaben_id und schreibt einen Verlaufseintrag (art notiz, text „Aus dem Korb zugeordnet: <Titel>“). Kein
Umbau der übrigen Vorhaben-Seite in dieser Stufe.

## 5 · Besprechung (`besprechung.html`)

Agenda = `entscheidungen_list {status offen}` plus vertagte mit vertagt_bis ≤ heute, in der Reihenfolge der Liste. Kopfzeile „Heute: n
Entscheidungen, k überfällig, m diese Woche“. Der bestehende Abarbeitungsblock (Besprechung starten, Timer, Zähler, Beenden mit Protokoll)
bleibt; je Punkt die drei Knöpfe aus Abschnitt 3 plus „Überspringen“. Die bisherigen Knöpfe für Themen (Entschieden mit decision_add, In
Klärung, Erledigt, Vertagen 1 Woche/1 Monat, An Lea, An Alex, Ins Team, Kann warten, Als Thema übernehmen, Verwerfen) entfallen in der
Agenda; die Aktionen laufen über die Entscheidungsfunktionen. Unter der Agenda eine Klappe „Material: Einträge mit Ausgang GF ohne
Entscheidung“ (gate_list, nur lesen) für die Übergangszeit bis Stufe 2. Protokoll (gfProtocolText): je Entscheidung Frage, Ergebnis
oder Vertagt bis oder Abgegeben an, dann Teilnehmende und Dauer; session_end wie bisher. Leerzustand: „Keine offenen Entscheidungen.
Zuletzt entschieden: …“. Die Startseite verlinkt „Zur Besprechung“ weiter; `index.html` Block „Deine Entscheidung“ liest künftig
`entscheidungen_list` (höchstens fünf, Rest „und n weitere“), statt gate_list.

## 6 · Lauf-Regeln (Dateien im Repo; Einspielen in die geplanten Aufträge macht Cowork nach dem Push, nicht die Terminal-Sitzung)

Als `docs/auftraege/STUFE1-NEUIGKEITEN-ABSCHNITTE.md` ablegen, Wortlaut zum Einsetzen in den Auftrag „GF Weekly · Neuigkeiten täglich“
(Alex) und spiegelbildlich in Leas Tagesabgleich:

B) Postfach entscheidet. (1) Vor dem Anlegen eines Kandidaten aus einer Mail den Verlauf lesen (get_thread, METADATA_ONLY). Ist die
letzte Nachricht von alex@wildemoehre.org oder lea@wildemoehre.org, oder wurde die auslösende Mail weitergeleitet: kein Kandidat, nur ein
Ticker (kind ticker, source mail, title „bearbeitet: <Betreff kurz>“, body ein Satz, source_ref `mail:<threadId>:bearbeitet:<messageId>`).
(2) Aus in:sent entsteht nie ein Kandidat. (3) Ein Verlauf, ein Kandidat: source_ref `mail:<threadId>:k<n>` ohne Datumssuffix; neue Mail im
Verlauf aktualisiert body, happened_at, run_id per ON CONFLICT DO UPDATE und schreibt einen Verlaufseintrag. (4) Täglich für jeden offenen
Mail-Kandidaten: gibt es seit created_at eine Antwort oder Weiterleitung von Alex oder Lea, status 'archiviert', archiv_grund
'bearbeitet: <Datum>, <Empfänger>'. Kommt danach wieder eine Mail an, Regel 3. (5) Grenze: Leas Antworten sieht Alex' Lauf nur mit Alex im
Verlauf; Leas Auftrag bekommt dieselben Regeln.

E) Entscheidungen. (1) `SELECT id, quelle_art, frage, vorschlag, frist FROM hh_entscheidungen WHERE status='offen' AND frage_form=false`.
Für jede Zeile die Frage als echte Entscheidungsfrage formulieren (ein Satz, Fragezeichen, mit Betrag, Datum oder Name, wenn in der Quelle
vorhanden), Vorschlag aus next_action, recommendation, naechster_schritt oder dem Quelltext ableiten, Frist nur übernehmen, nie erfinden.
UPDATE frage, vorschlag, frage_form=true, frage_von='lauf', run_id. Zeilen mit frage_von in (Alex, Lea) nie anfassen. (2) Für Kandidaten
und Themen ohne vorhaben_id: `vorhaben_vorschlag` setzen, wenn der Bezug eindeutig ist (Partnername, Festival, Vertrag, Person in ihrer
Rolle), sonst NULL lassen. (3) Vorschläge im Vorhaben-Verlauf (status vorschlag) nur noch schreiben, wenn sie einen offenen Punkt betreffen;
ältere als 14 Tage ohne Antwort auf status 'verfallen' setzen (Spalte existiert: status; Wert ergänzen, wenn der CHECK es verlangt, in
der Migration dieses Pakets).

Einmalig nach dem Push (Cowork): Dubletten zusammenführen (Tickets for Good, Crew-Vertrag, Helge), Erstlauf E1 über alle 38 Zeilen.

## 7 · Schrift, Dichte, Spielschicht

1. Tokens in `styles.css`: `--fs-body` 0.9375rem, `--fs-title` 1rem (Gewicht 600), `--fs-sm` 0.8125rem, Kacheln 1.375rem, h1 1.375rem,
   `--leading-text` 1.4. Chips 32 px hoch, Zielgröße 44 px über Padding. Lesebreite 880 px für Fließtext. Gilt für alle Seiten; Sichtprüfung
   auf index, entscheidungen, vorhaben, besprechung, neuigkeiten, aufraeumen bei 1440 und 390, dunkel und hell.
2. Spielschicht aus, nichts löschen: in `core.js` Konstante `GF_SPIEL = false`; damit werden nicht geladen oder nicht gerendert: game.js,
   eggs.js, der Block #gameBar (Taler, Lagerplatz, Flammen), Abzeichen- und Habitat-Punkte-Blöcke (V16/V17) auf index.html, der Aufruf
   `score_event` in gfTextModal, Überraschungen an Marke und Avataren. Check-in-Karte bleibt, ohne Taler-Anzeige. Tabellen
   gfweekly_score_*, gfweekly_badges, gfweekly_checkins und `site/assets/game/` bleiben unberührt. Im Technikstand: wie es wieder
   eingeschaltet wird (eine Konstante).
3. Navigation: „Entscheidungen“ in Gruppe Heute nach „Für dich“; aus GF_SUBNAV unter Themen entfernen; Rest unverändert (Stufe 3).

## 8 · Prüfweg, automatisch, mit Stopp-Gründen

1. **Branch und Sperre:** `stufe-1/entscheidungen` von `origin/main`, Eintrag in `docs/ARBEITSPAKETE.md`. Läuft parallel ein Paket mit
   Änderungen an denselben Dateien (zuletzt Verkauf 2027, paket/blick-board): Konflikte so lösen, dass beide bleiben; Asset-Version auf die
   höhere Zahl plus eins, einheitlich auf allen Seiten.
2. **Eigene Prüfung:** `pruefung/abnahme.sh` vollständig, einschließlich `pruefung/webstandard-pruefung.mjs` und Wächter. Neue Probe
   `pruefung/entscheidungen-probe.mjs`: sammeln ist idempotent (zweimal aufrufen, gleiche Zeilenzahl), entscheiden schreibt ins Original
   und ist per zurueck umkehrbar, vertagen zieht die Frist nach, abgeben setzt gate bzw. wer, hinfällig bei archivierter Quelle, Korb
   zuordnen und verwerfen, Leerzustand, Fehlerzustand (leeres Ergebnis wird abgelehnt). Wirkungsprobe gegen das echte Backend mit
   Testvorhaben, Testpunkt und Testthema, danach aufräumen (Testzeilen löschen, hh_entscheidungen bereinigen). Schirme mit Playwright
   1440 und 390, dunkel und hell, ohne Konsolenfehler; Check-in-Karte im Test wie gewohnt unterdrücken.
3. **Standards nachführen:** `docs/webapp-standard/FUNKTIONSINVENTAR.md`, `REGELZUORDNUNG.md`, `PRUEFMATRIX.md` mit den Testfällen und Beleg.
4. **Unabhängige Gegenprüfung durch Codex:** Prüfauftrag `docs/reviews/STUFE1-pruefauftrag.md` nach dem Muster `VERKAUF-pruefauftrag.md`,
   ergänzt um: Rückschreiben ins Original ohne Datenverlust, Idempotenz von sammeln, Rechte (nur Alex, Lea schreiben), RLS der neuen Tabelle,
   Spielschicht wirklich aus ohne Konsolenfehler, Tokens ohne Hex, Mobil 390, ORG-001 bis ORG-003, WEBAPP-PILOT-0.2. Je Runde eigener
   Worktree am eingefrorenen Commit, `codex exec -m gpt-6-sol --sandbox read-only`, Auftragstext wörtlich im Prompt. Ergebnis
   `docs/reviews/STUFE1-runde-N.md`. **Jeden Befund behandeln:** schwer und mittel werden korrigiert, leicht werden korrigiert, wenn es
   unter zehn Minuten kostet, sonst mit Grund verworfen; Antwort als `STUFE1-antwort-N.md`. Nach jeder Korrektur abnahme.sh und die
   Probe erneut, dann nächste Runde. Höchstens drei Runden.
5. **Stopp-Gründe, kein Push, Zeile in `FRAGEN_FUER_MORGEN.md` mit genauem Schritt:** nach Runde 3 bleibt ein schwerer oder mittlerer
   Befund; Migration lässt sich nicht anwenden; Live-Stand der Edge Function weicht vom Repo ab und die Abweichung ist nicht aus git
   erklärbar; abnahme.sh schlägt nach Korrekturen weiter fehl; ein Konflikt mit einem parallelen Paket lässt sich nicht so lösen, dass beide
   bleiben. In allen anderen Fällen weiter.
6. **Deploy und Push:** Edge Function deployen (Diff vorher), `ping`; Merge nach `main`, Push; Live-Prüfung auf kompass.wildehabitate.de
   (entscheidungen.html, besprechung.html, vorhaben.html, index.html) bei 1440 und 390.
7. **Stand in fünf Kategorien** in README und `docs/TECHNIKSTAND.md`: umgesetzt, technisch geprüft, unabhängig geprüft (Runden und Befunde),
   veröffentlicht, fachlich angenommen (offen, bis Alex und Lea die Testaufgabe aus Abschnitt 9 gemacht haben). Keine Annahme behaupten,
   die nicht stattgefunden hat. Dazu `docs/STAND-STUFE-1.md`: Zahlen nach dem Erstlauf (Entscheidungen gesamt, reif, unreif), was Alex
   tun muss, was er wissen muss, in höchstens zehn Sätzen.

Commit-Nachrichten: „feat(entscheidungen): Entscheidungsliste, Besprechung darauf, Korb, Spielschicht aus“, danach „fix(stufe1): Runde N“.

## 9 · Abnahme mit echten Fällen (Stand 25.10.) und Testaufgabe

| Fall | Erwartung |
|---|---|
| Punkt „Entscheidung zu Gehalt, Start 01/2027, Proof in Q4“ (Vorhaben Rolle Helge, wer GF gemeinsam, Frist 31.12.) | Erscheint unter „Ohne Frist“ bzw. nach Frist 31.12.; Entschieden mit Ergebnis setzt den Punkt erledigt und schreibt Verlauf; Rückgängig stellt her |
| Thema „Entscheidungsgrundlage: Xceed-Abschluss …“ (gate gf, Frist 26.10., next_action vorhanden) | Unter „Diese Woche“ mit Vorschlag; Entschieden setzt board_lane entschieden und einen Beschluss |
| Kandidat „Aufsichtsrat verlangt bis 02.11. …“ (gate gf nach Aufräumen) | Erscheint mit Frist 02.11.; Abgeben an Lea setzt gate lea, Zeile verschwindet |
| Vorhaben GLS-Kredit (Ball GF, Frist 30.09. vorbei, kein GF-Punkt) | Erscheint nicht; im Korb nicht; im Technikstand als Beispiel für „Ball GF ohne Punkt“ notieren (Stufe 2 schließt die Lücke) |
| 15 Themen mit gate gf ohne Frist, Vorschlag, nächsten Schritt | Unter „Noch keine Frage“ eingeklappt, Zähler 15 (±, je nach Tagesstand) |
| Besprechung starten mit 3 Entscheidungen dieser Woche | Timer, drei Knöpfe je Punkt, Protokoll nennt Frage und Ergebnis |
| Korb: Kandidat „Härting …“ mit Vorschlag Liquidität | Zuordnen setzt vorhaben_id, Verlaufseintrag, Zeile verschwindet |
| Spielschicht | Keine Taler, kein Lagerplatz, keine Flammen, keine Abzeichen, keine Überraschung; `GF_SPIEL = true` schaltet alles zurück |
| Mobil 390 | alle Knöpfe 44 px erreichbar, keine Konsolenfehler, Schrift 15/16/13 |

Testaufgabe Alex und Lea (fachliche Annahme, ORG-003): am Handy in unter fünf Minuten die Liste lesen, zwei Entscheidungen treffen, eine
vertagen, eine abgeben, dann eine Besprechung starten und beenden. Erst danach gilt Stufe 1 als fachlich angenommen; das Tor zu Stufe 2 ist
die erste echte gemeinsame Besprechung über das Werkzeug.

## 10 · Stufen 2 bis 4 (Vormerkung, je eigenes Paket nach dem Tor)

Stufe 2, ein Behälter: 53 Themen auflösen (31 an Vorhaben → Punkte oder Verlauf, 22 → Vorhaben oder Archiv; Lauf schlägt vor, Alex und
Lea bestätigen, geschätzt zwei Stunden), Kandidaten nur noch als Vorschläge an Vorhaben, Board, Kacheln, Liste, Aufräumen aus der
Navigation (Dateien bleiben). Tor: null offene Themen, Agenda nur aus Entscheidungen.
Stufe 3, weniger Seiten: Jahr in Saison, Eingabe als Einwurf-Knopf auf Vorhaben, Vertretung auf einer Seite, Wichtige Seiten und Bearbeiten
weg, Navigation auf drei Gruppen, Einstellungen mit Läufen. Tor: Testaufgaben am Handy.
Stufe 4, Ruhe halten: Läufe auf Vorschläge mit Bezug zu offenen Punkten begrenzt (Teil E3 beginnt das schon), Alterung, vier Wochen
Beobachtung der Erfolgskriterien. Tor: Besprechungen finden statt, Liste unter 15.
Der Ansatz „Große Fragen“ (Tafel 3) bleibt als mögliche Meta-Ebene über der Entscheidungsliste vorgemerkt, falls die Liste dauerhaft über
15 Einträge liegt. Nicht Teil dieser Stufen.

## 11 · Nicht anfassen

Vorhaben-Abgleich (Alex, Lea) läuft unverändert weiter. Themen-Board bleibt bis Stufe 2 nutzbar. Aufräumen bleibt, bekommt keine neuen
Funktionen. Neuigkeiten, Themenlage und Laufband unverändert. Keine Löschung in den Spieltabellen.

## 12 · Für die Terminal-Sitzung

Startbefehl (eine Zeile, mit Rückfragen des Werkzeugs bei Dateiänderungen, Befehlen und Push):

```
cd ~/Documents/GitHub/gfweekly && git fetch origin && git checkout -b stufe-1/entscheidungen origin/main && cp "$HOME/Documents/Claude/02 Projects/Geschäftsführung Wilde Möhre/Claude outputs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md" docs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md && claude "Lies docs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md vollständig. Führe die Abschnitte 1 bis 8 in dieser Reihenfolge aus und arbeite ohne Rückfragen durch: triff Detailentscheidungen selbst und notiere sie im Technikstand. Stoppe nur bei einem Stopp-Grund aus Abschnitt 8.5 und schreibe dann die Zeile in FRAGEN_FUER_MORGEN.md. Am Ende docs/STAND-STUFE-1.md schreiben und mir die zehn Sätze daraus ausgeben."
```

Soll die Sitzung ohne jede Bestätigung durchlaufen, auch bei Befehlen, Deploy und Push, vor `claude` den Schalter setzen:
`claude --dangerously-skip-permissions "…"`. Das überspringt alle Rückfragen des Werkzeugs; der Stopp bleibt nur über Abschnitt 8.5.

Existiert der Branch schon: `git checkout stufe-1/entscheidungen && git rebase origin/main` statt `checkout -b`.

Nach dem Push meldet Alex „gepusht“ im Cowork-Chat; Cowork spielt dann die Lauf-Regeln aus Abschnitt 6 per update_trigger ein, führt den
Erstlauf E1 und die Dublettenbereinigung aus, legt Leas Auftragsdatei im Projektordner ab und meldet den Stand ins Arbeitsradar.
