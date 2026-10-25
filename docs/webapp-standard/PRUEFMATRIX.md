# Prüfmatrix · Webapp Standard (Pilot zur Erprobung)

Testfälle T-01 bis T-22 aus `WEBAPP-PILOT-0.2`, Abschnitt F. Statuswerte: bestanden, fehlgeschlagen, nicht ausgeführt, nicht zutreffend mit Grund. Art der Prüfung: **Bedienprüfung** (Browser bedient die Seite, Edge Function abgefangen, synthetische Daten), **Messung** (gerenderte Werte im Browser), **Codeprüfung** (Quelltext gelesen), **Simulation** (Antworten nachgestellt). Keine Prüfung lief gegen die echte Datenbank, Asana oder Mail. Die Fassung jeder Messung steht im Kopf der Belegdateien unter `belege/`.

Prüfumgebung: lokaler statischer Server über `site/`, Chromium Headless Shell Revision 1248 über Playwright 1.63, `locale de-DE`, `timezoneId Europe/Berlin`, Breiten 320, 390, 1280, 1440 CSS px, dunkel und hell. Ausgangsstand für den Vergleich: `origin/main` bei `05af97b` (ohne Pilot), gemessen mit derselben Prüfdatei.

## 1. Ausgangs- und Endmessung (`pruefung/webstandard-pruefung.mjs`, 28 Ansichten)

| Messgröße | Ausgang `05af97b` | Pilot | Regel |
| --- | ---: | ---: | --- |
| Textelemente unter 12 px | 1.486 | 0 | G-01 |
| Trefferflächen unter 24 px | 22 | 0 | G-03 |
| Trefferflächen 24 bis 44 px | 739 | 0 | G-03 |
| Bedienelemente ohne Namen | 0 | 0 | G-04 |
| Eingaben ohne Bezeichnung | 92 | 0 | B-03 |
| Eingaben nur mit Platzhalter | 35 | 0 | B-03 |
| Zeigerziele ohne Tastaturzugang | 13 | 0 | B-08 |
| Tastaturfokus nicht sichtbar | 0 | 0 | B-08 |
| Laufende Animationen bei reduzierter Bewegung | 0 | 0 | G-06 |
| Seiten mit Überlauf bei 320 px | 2 | 0 | G-05 |
| Seiten mit Überlauf bei 200 % Text | 3 | 0 | G-05 |
| Gemeinsame Dialoge mit Fokus, Escape, Rückgabe | 0 von 2 | 2 von 2 | B-08 |
| Kurzmeldung als Statusmeldung angesagt | nein | ja | P-04 |
| Kopieren meldet bei Verweigerung keinen Erfolg | nein | ja | B-04 |
| Ladefehler sichtbar ohne stehendes „lädt …“ (4 Seiten) | 1 von 4 | 4 von 4 | B-07 |
| Gezielte Bedienproben | 0 von 9 (vor Runde 1 der Gegenprüfung) | 17 von 17 | siehe 3 |
| Harte Befunde insgesamt | 70 | 0 | — |
| Gemessene Kontrastfälle aus `pruefung/schirme.mjs` | 137 Treffer, 64 Einträge | 8 Treffer, 4 Einträge (Messgrenzen) | G-02 |

Belege: `belege/ausgang-05af97b.json`, `belege/ende.json`.

## 2. Testprotokoll T-01 bis T-22

| Test | Fassung · Rolle · Daten | Handlung | Erwartung | Beobachtung | Status | Beleg |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 Bestand und Umfang | Pilot · Alex · synthetisch | Inventar aller 25 Seiten aus dem Code; alle bestehenden Prüfungen vor und nach dem Umbau | Keine Fähigkeit unbemerkt entfernt | 430 Fähigkeiten erfasst; alle bestehenden Prüfungen (Schirme 100 Bilder, Bedienung, Organisation 116, Kommunikation 70 und 56, Launch 154, Matrix, Tokens, Wächter) vor und nach grün | bestanden (Bedien- und Codeprüfung) | `FUNKTIONSINVENTAR.md`, Abschnitt Änderungen |
| T-02 Schrift und Layout | Pilot · beide Themen | Gerenderte Schriftgröße aller Textelemente, lange deutsche Wörter bei 200 % | Rollen ab 12 px, kein verlorener Inhalt | 0 unter 12 px; „Vollständig“ im Abzeichenband brach vorher nicht um, jetzt ja | bestanden (Messung) | Abschnitt 1 |
| T-03 Kontrast und Zustände | Pilot · dunkel und hell | Gemessener Kontrast aller Texte, Platzhalter, Werte, Pseudoelemente (`pruefung/schirme.mjs`), Token-Paare (`pruefung/kontrast.py`) | 4,5:1, Zustände mit Wort oder Symbol | 0 neue Fälle; bekannte Schuld 137 auf 8 Treffer (Checkbox-Wert, Hintergrundbild: Messgrenzen WP-05) | bestanden (Messung) | `pruefung/kontrast-ausnahmen.json` |
| T-04 Schmale Ansicht und Zoom | Pilot · hell bei 320, dunkel bei 1280 mit 200 % Text | Seitlicher Überlauf je Seite; Grundschrift wächst mit | Kein Überlauf, Text skaliert | 0 Seiten mit Überlauf; Grundschrift 32 px bei 200 % | bestanden (Messung, Emulation); echtes Touchgerät nicht ausgeführt | Abschnitt 1; Lücke L7 |
| T-05 Tastatur und Assistenz | Pilot · 1440 dunkel | Bis zu 150 Tabschritte je Startansicht, Fokus sichtbar; Namen und Bezeichnungen aller sichtbaren Bedienelemente; Dialoge, Detailbereich und ⇄-Menü gezielt geöffnet und mit Escape geschlossen | Sichtbarer Fokus, keine Falle, Namen | 0 Fokus ohne Ring, 0 ohne Namen; Dialoge, Detailbereich, ⇄-Menü mit Fokus und Rückgabe | teilweise bestanden (Bedienprüfung): Tabweg nur je Startansicht, Inhalte hinter geschlossenen Details und späteren Zuständen nur für Board, Dialoge und Eingabe gezielt; Vorlesesoftware nicht ausgeführt | Abschnitt 1, 3 |
| T-06 Details und Rückwege | Pilot · Board | Karte per Enter öffnen, Escape | Fokus zurück auf der Karte, Kontext erhalten | Fokus kehrt zur Karte zurück; Filter und Ansicht bleiben | bestanden (Bedienprüfung) | Probe 7 |
| T-07 Suche, Filter, Auswahl | Pilot | Suchfelder mit Bezeichnung; Filter unverändert | Geltung erkennbar | Bezeichnung und Suchbereich vorhanden; Filter- und Zählerlogik unverändert durch bestehende Proben | bestanden (Messung, bestehende Proben); seitenübergreifende Auswahl nicht zutreffend (keine Mehrfachauswahl) | `pruefung/bedienung.mjs` |
| T-08 Formular und Validierung | Pilot · Eingabe | Leeres Pflichtfeld, gültige Eingabe, Fehler | Fehler am Feld, Werte bleiben | Fehler am Feld mit `aria-invalid` und Fokus; Werte bleiben bei Fehler | bestanden (Bedienprüfung); Dateifelder nicht zutreffend (keine) | Proben 1 und 3 |
| T-09 Speichern und Wiederholung | Pilot · Eingabe, Liste, Board, Saison-Rad · Simulation | Langsame Antwort (1,2 s) mit Doppelklick; Serverfehler; Antwort ohne Inhalt (unklar); Speichern während weiterer Eingabe | Keine doppelte Wirkung, keine falsche Erfolgsmeldung, keine verlorene Eingabe | Genau eine Anfrage; Fehler bleibt am Knopf; unklare Antwort als „Unklare Antwort … Stand prüfen“, Eingabe bleibt; jüngste Eingabe wird nachgespeichert; Kopieren ohne falschen Erfolg | bestanden (Simulation) | Proben 2, 3, 11, 13 bis 15, 17; Dialogprobe |
| T-10 Fachliche Zustände | Pilot | Statusbedeutungen geprüft, Erledigt-Darstellung | Nur Darstellung geändert | Keine Statuslogik geändert; Übergänge in Vorhaben durch bestehende Proben | bestanden (Codeprüfung, bestehende Proben) | `pruefung/bedienung.mjs` |
| T-11 Zuordnung und Konflikt | Pilot · Board | Umsortieren ohne Ziehen; ⇄ per Tastatur | Gleiche Wirkung wie Ziehen | Speicheraufruf `update` mit `lane_order` ausgelöst (gleicher Weg wie beim Ablegen) und neue Reihenfolge angezeigt; dauerhafte Speicherung nach Neuladen nicht belegt, weil die Simulation keinen Zustand hält | bestanden für Aufruf und Anzeige (Simulation); Kapazität und Zeitkonflikt nicht zutreffend für das Board, Lücke L1 | Proben 4 bis 6, 10 |
| T-12 Zeiten und Mengen | Pilot · feste Uhr in Europe/Berlin (STICHTAG 25.10.2026, Ende der Sommerzeit) | Kalendertag, „morgen“ und Frist-Wort kurz vor und nach Mitternacht und nach der Zeitumstellung, zusätzlich mit Gerätezeitzone UTC; Codeprüfung aller Datumsstellen | Tag und Zeit eindeutig | `gfIsoTag`, `gfTomorrow` und `gfFrist` liefern in allen drei Fällen den richtigen Kalendertag; Vortag-Fehler in allen Seiten (Board, Entscheidungen, Check-in, Liste, Vertretung, Übergabe, Saison-Rad, Rückfallwerte in Launch, Kommunikation, Saison, Besetzung) und festes Datum in Organisation behoben | bestanden für Kalendertage (Simulation mit fester Uhr); über Mitternacht reichende Zeiträume nicht zutreffend (keine Schichten oder Termine mit Uhrzeit über Mitternacht im Inventar); Mengen und 0-Werte nur als Codeprüfung | Proben 12, 16 |
| T-13 Gleiche Daten in Ansichten | Pilot | Board, Liste, Detail mit denselben Testthemen | Kennung und Zustand gleich | Unverändert, bestehende Proben grün | bestanden (bestehende Proben) | `pruefung/schirme.mjs` |
| T-14 Export und Rücklesen | — | — | — | Kein Datei-Export in der Webapp | nicht zutreffend (Inventar: nur Kopieren und `mailto:`) | `FUNKTIONSINVENTAR.md` 4.9 |
| T-15 Externe Wirkung | Pilot | Rückfragetexte vor Asana geprüft | Ziel, Anzahl, Folge | Launch nennt Anzahl; andere nennen Ziel und Folge | nicht ausgeführt als Versand (keine Freigabe für Testempfänger); Texte als Codeprüfung | Lücke L8 |
| T-16 Rechte und Sitzung | Pilot · Tor | Falsches Passwort; Ladefehler nach dem Tor | Keine Wirkung, Meldung, Passwort bleibt | Meldung mit `role="alert"`; Ladefehler auf der Seite, Passwort bleibt | bestanden (Simulation); Rollen nicht prüfbar, L5 | Proben 8 und 9 |
| T-17 Gleichzeitige Bearbeitung | — | — | Keine stille Überschreibung | Vorhandener Schutz (Vorhaben, Organisation, Übergabe) unverändert; sonst fehlt er | fehlgeschlagen als Bestand, nicht im Pilot behoben (Backend), L2 | `FUNKTIONSINVENTAR.md` 4.3 |
| T-18 Lange Liste und Leistung | Pilot und `05af97b` · gleiche Daten | Zeit bis zum gefüllten Inhalt, Median aus 5 Läufen; zusätzlich 600 synthetische Themen | Keine Verschlechterung über die Toleranz | Kleine Menge: 330 bis 520 ms beide, im Rauschen. 600 Themen: Board und Liste im Rauschen, Bearbeiten 2,0 bis 2,1 s statt 1,3 bis 1,8 s | nicht bestanden als Nachweis: Toleranz nicht vorab festgelegt (L6) | Abschnitt 4 |
| T-19 Bewegung und Leere | Pilot | Reduzierte Bewegung aktiv; Ladefehler und leere Zustände; zeitgesteuertes Schließen (Spielkarten) | Keine Animation, keine selbst verschwindende Information, Ursache und nächster Schritt | 0 laufende Animationen nach dem Laden; Spielkarten schließen bei reduzierter Bewegung nicht selbst (Codeprüfung); Ladefehler mit „Erneut laden“; Besprechung trennt Fehler und leer | bestanden (Messung, Simulation, Codeprüfung für Spielkarten) | Abschnitt 1 |
| T-20 Rückweg und Nachbarseiten | Pilot `d8dd92e` in isolierter Kopie | Alle 15 Pilot-Commits per `git revert` zurückgenommen | Ausgangsstand wiederhergestellt | Baum gleich `origin/main` (leerer Diff), Bedienproben und 100 Schirmbilder ohne Meldung | bestanden | Abschnitt 5 |
| T-21 Fachlicher Versuch | — | — | Alexander schließt Aufgaben ab | Steht aus | nicht ausgeführt | `ARBEITSSTAND.md` |
| T-22 Lieferumfang und Status | Pilot | Bericht, Vorschau, Ausnahmen, Regeln geprüft | Kein offener kritischer Fehler als fertig | Getrennte Stände im README; L1 bis L8 offen und benannt | bestanden für die Lieferung, nicht für die fachliche Annahme | `README.md` |

## 3. Gezielte Bedienproben (Teil von `pruefung/webstandard-pruefung.mjs`)

1. Eingabe: leeres Pflichtfeld zeigt Fehler am Feld und fokussiert es.
2. Eingabe: während des Sendens gesperrt, Doppelklick erzeugt genau eine Anfrage.
3. Eingabe: Senden fehlgeschlagen bleibt am Knopf sichtbar, Eingabe bleibt erhalten.
4. Board: ⇄ öffnet per Tastatur mit Fokus im Menü, Escape schließt und gibt den Fokus zurück.
5. Board: Umsortieren ohne Ziehen wird angeboten.
6. Board: „Eine Stelle nach unten“ löst den Speicheraufruf mit `lane_order` aus und zeigt die neue Reihenfolge (Simulation, kein Neuladen).
7. Board: Detailbereich öffnet per Enter mit Namen und Fokus, Escape schließt mit Fokus auf der Karte.
8. Tor: sichtbare Bezeichnung, falsches Passwort als Meldung mit `role="alert"`.
9. Ladefehler nach der Anmeldung: Meldung mit „Erneut laden“ auf der Seite, Tor bleibt zu, Passwort bleibt.
10. Board: nach Außenklick und Öffnen an einer anderen Karte schließt Escape das richtige Menü mit Fokus auf dessen Auslöser (aus Runde 1 der Gegenprüfung).
11. Liste: „heute besprochen“ zeigt bei Serverfehler den Fehler statt einer Erfolgsmeldung (aus Runde 1 der Gegenprüfung).
12. Datum: Kalendertag und „morgen“ in Berlin kurz vor und nach Mitternacht und am Tag der Zeitumstellung (aus Runde 2).
13. Board: abgelehntes Rückgängig zeigt den Fehler und den gespeicherten Stand statt der alten Position (aus Runde 2; fand dabei, dass „Rückgängig“ mit der Maus nicht anklickbar war).
14. Board: Wechsel zu einem anderen Thema bleibt bei abgelehntem Speichern beim Entwurf mit Eingaben (aus Runde 2).
15. Eingabe: Antwort ohne Inhalt gilt als unklar, kein Erfolgszustand, Eingabe bleibt (aus Runde 3).
16. Datum: auch bei Gerätezeitzone UTC gilt der Berliner Kalendertag (aus Runde 3).
17. Saison-Rad: Schließen während laufenden Speicherns speichert die jüngste Eingabe nach (aus Runde 3).

Die Proben 16 und 17 scheitern am Stand von Runde 3 (`596aed7`) und bestehen am Endstand (Gegenprobe im Vergleichsbaum).

Die Proben fanden während der Umsetzung zwei echte Fehler, die dann behoben wurden: Enter auf ⇄ öffnete zusätzlich die Details (schon im Bestand), und das Umsortieren zählte eine unsichtbare wiederkehrende Karte mit.

### 3a. Bedienproben Stufe 1 (25.10.2026, `pruefung/bedienung.mjs`, Gruppe „Stufe 1“)

| Probe | Erwartung | Beleg |
| --- | --- | --- |
| Entscheidungsliste: Kacheln, Abschnitte, Zeile | 4 Kacheln mit Zahlen; Abschnitte Überfällig, Diese Woche, Nächste zwei Wochen, Später, Ohne Frist; „Noch keine Frage“ eingeklappt mit Zähler; Zeile mit Herkunft, Fristzustand, Vorschlag, drei Knöpfen | Bedienprobe |
| Entschieden, Vertagen, Abgeben | Pflichtfeld Ergebnis; Vertagen Standard plus 7 Tage; Abgeben nur mit Wahl; Zeile verschwindet; Hinweis mit Rückgängig; Rückgängig stellt her | Bedienprobe, `entscheidungen-probe.mjs` (Wirkung) |
| Fehler beim Speichern | Blatt bleibt offen mit Meldung, Zeile bleibt | Bedienprobe |
| Bearbeiten | nur geänderte Felder, by | Bedienprobe |
| Filter Entschieden, Fußleiste, Klappe Beschlüsse | gedämpft mit Ergebnis ohne Knöpfe; Fußleiste mit Link; Klappe lädt erst beim Öffnen | Bedienprobe |
| Ladefehler | sichtbar benannt, kein „lädt …“ | Bedienprobe, `webstandard-pruefung.mjs` (B-07) |
| 390 px | Knöpfe unter der Frage, 44 px, kein Überlauf, Frage höchstens drei Zeilen, Blatt passt | Bedienprobe |
| Besprechung | Kopfzeile, Agenda in Listenreihenfolge, keine Themen-Knöpfe, Material-Klappe, Start, Entschieden ohne Text abgelehnt, Entschieden, Vertagen, Abgeben, Überspringen, Protokoll mit vier Gruppen, Leerzustand | Bedienprobe |
| Für dich | höchstens fünf, „und n weitere“, Zur Besprechung | Bedienprobe |
| Korb | drei Einträge, Vorschlag als Marke, Zuordnen zum Vorschlag, Chip-Reihe, Archivieren, Neues Vorhaben, Verwerfen, „Alle Vorschläge übernehmen“ mit Zähler | Bedienprobe, `entscheidungen-probe.mjs` (Wirkung) |
| Spielschicht | kein game.js, kein `#gameBar`, `GF_SPIEL` false, Check-in mit Tagesschlüssel nicht gesendet | Bedienprobe |

### 3b. Bedienproben Stufe 2 (25.10.2026, `pruefung/bedienung.mjs`, Gruppen „Rückkehr (Stufe 2)“ und „Stufe 2“; Wirkung `pruefung/stufe2-probe.mjs`)

| Probe | Erwartung | Beleg |
| --- | --- | --- |
| Vorschlagsfrist | Datum aus der Quelle steht als Knopf „Vorschlag: bis … übernehmen“, nicht als Frist; Übernehmen sendet `entscheidung_set` mit `expect_updated_at`, Quelle hand | Bedienprobe, `stufe2-probe.mjs` |
| Fokus zuerst | Abschnitt Fokus vor Überfällig, Reihenfolge Launch, Formatpartner, Systembau, dann Frist; Phasenmarke in der Herkunft; Besprechung und Für dich gleich | Bedienprobe |
| Mehrfachauswahl | Auswählen zeigt Kontrollkästchen und Leiste; Nicht jetzt mit Datum (Standard vier Wochen), Abgeben, Hinfällig mit Rückfrage; Konflikt je Zeile benannt; Rückgängig nimmt alle zurück | Bedienprobe, `stufe2-probe.mjs` (Konflikt, Rückweg) |
| Akte | Chips Phase (vier) und Fokus senden `vorhaben_phase`; „Rückgängig (vom Lauf erledigt)“ nur an Lauf-Einträgen bis 7 Tage | Bedienprobe, `stufe2-probe.mjs` (`lauf_rueckgaengig`) |
| Übergabe | je Zeile „Erledigt“ (`handover_set status erledigt`); Korb nur Vorhaben | Bedienprobe, `stufe2-probe.mjs` |
| Rückkehr | Begrüßung, drei Kacheln, Brief (fehlt: Hinweis; bearbeiten über `rueckkehr_brief_set`), Phasenblöcke Launch, Formatpartner, Weiteres mit Entschieden, Bewegt, Wartet; Nach Menschen Lea, Alex, übrige; „Willkommen zurück“; Ladefehler sperrt Beenden | Bedienprobe, `stufe2-probe.mjs` (`rueckkehr_lage`, 404) |
| Lauf-Bilanz | Klappe lädt erst beim Öffnen, Trefferquote und Tabelle je Woche | Bedienprobe, `stufe2-probe.mjs` |
| Navigation | 18 Haupteinträge ohne Themen, Eingabe, Aufräumen; `board.html?topic=` erreichbar | Schirme, `stufe2-probe.mjs` |

## 4. Leistung (T-18)

Zeit vom Aufruf bis zum gefüllten Kerninhalt ohne „lädt …“, Median aus fünf Läufen, gleiche Testdaten, zwei Durchgänge je Stand.

| Seite | `05af97b` | Pilot |
| --- | ---: | ---: |
| Für dich | 439 / 425 ms | 376 / 360 ms |
| Board | 521 / 408 ms | 419 / 353 ms |
| Liste | 418 / 386 ms | 381 / 398 ms |
| Vorhaben | 376 / 361 ms | 373 / 380 ms |
| Kommunikation | 401 / 331 ms | 457 / 356 ms |
| So arbeiten wir | 372 / 369 ms | 411 / 364 ms |
| Bearbeiten mit 600 Themen | 1.294 bis 1.840 ms | 2.026 bis 2.089 ms |

Während der Messung fiel eine echte Verschlechterung auf: die neue Bezeichnungsverknüpfung fragte bei 15.000 Feldern `labels` ab, Bearbeiten brauchte 20,8 s. Behoben in `dff00b9`. Der verbleibende Abstand ist als L6 offen.

## 5. Rückweg (T-20)

Isolierte Kopie bei `d8dd92e` (letzter Code- und Prüfstand; der nachfolgende Commit ändert nur diese Dokumentation), `git revert --no-edit origin/main..HEAD` (15 Commits), danach `git diff origin/main` leer, `pruefung/bedienung.mjs` „Alle Bedienproben in Ordnung“, `pruefung/schirme.mjs` 100 Bilder, 0 Meldungen. Frühere Versuche bei `c330049` (6 Commits) und `9012bfc` (12 Commits) hatten dasselbe Ergebnis. Fremde Änderungen sind nicht betroffen, weil der Pilot nur eigene Commits auf einem eigenen Branch trägt.
