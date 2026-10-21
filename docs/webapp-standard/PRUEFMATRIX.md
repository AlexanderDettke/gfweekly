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
| Gezielte Bedienproben | 0 von 9 | 9 von 9 | siehe 3 |
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
| T-05 Tastatur und Assistenz | Pilot · 1440 dunkel | 45 Tabschritte je Seite, Fokus sichtbar; Namen, Bezeichnungen; Dialoge öffnen und mit Escape schließen | Sichtbarer Fokus, keine Falle, Namen | 0 Fokus ohne Ring, 0 ohne Namen; Dialoge, Detailbereich, ⇄-Menü mit Fokus und Rückgabe | bestanden (Bedienprüfung); Vorlesesoftware nicht ausgeführt | Abschnitt 1, 3 |
| T-06 Details und Rückwege | Pilot · Board | Karte per Enter öffnen, Escape | Fokus zurück auf der Karte, Kontext erhalten | Fokus kehrt zur Karte zurück; Filter und Ansicht bleiben | bestanden (Bedienprüfung) | Probe 7 |
| T-07 Suche, Filter, Auswahl | Pilot | Suchfelder mit Bezeichnung; Filter unverändert | Geltung erkennbar | Bezeichnung und Suchbereich vorhanden; Filter- und Zählerlogik unverändert durch bestehende Proben | bestanden (Messung, bestehende Proben); seitenübergreifende Auswahl nicht zutreffend (keine Mehrfachauswahl) | `pruefung/bedienung.mjs` |
| T-08 Formular und Validierung | Pilot · Eingabe | Leeres Pflichtfeld, gültige Eingabe, Fehler | Fehler am Feld, Werte bleiben | Fehler am Feld mit `aria-invalid` und Fokus; Werte bleiben bei Fehler | bestanden (Bedienprüfung); Dateifelder nicht zutreffend (keine) | Proben 1 und 3 |
| T-09 Speichern und Wiederholung | Pilot · Eingabe · Simulation | Langsame Antwort (1,2 s) mit Doppelklick; Serverfehler | Keine doppelte Wirkung, keine falsche Erfolgsmeldung | Genau eine Anfrage; Fehler bleibt am Knopf; Kopieren ohne falschen Erfolg | bestanden (Simulation) | Proben 2, 3; Dialogprobe |
| T-10 Fachliche Zustände | Pilot | Statusbedeutungen geprüft, Erledigt-Darstellung | Nur Darstellung geändert | Keine Statuslogik geändert; Übergänge in Vorhaben durch bestehende Proben | bestanden (Codeprüfung, bestehende Proben) | `pruefung/bedienung.mjs` |
| T-11 Zuordnung und Konflikt | Pilot · Board | Umsortieren ohne Ziehen; ⇄ per Tastatur | Gleiche Wirkung wie Ziehen | Reihenfolge gespeichert (Aufruf `update` mit `lane_order`) und angezeigt | bestanden (Simulation); Kapazität und Zeitkonflikt nicht zutreffend für das Board, Lücke L1 | Proben 4 bis 6 |
| T-12 Zeiten und Mengen | Pilot | Kalendertag in Ortszeit; Codeprüfung der Datumshelfer | Tag und Zeit eindeutig | Vortag-Fehler in Board, Entscheidungen, Check-in, Vertretung und festes Datum in Organisation behoben | bestanden (Codeprüfung); Mitternacht und Zeitumstellung nicht ausgeführt, L3 | `site/assets/core.js` `gfIsoTag` |
| T-13 Gleiche Daten in Ansichten | Pilot | Board, Liste, Detail mit denselben Testthemen | Kennung und Zustand gleich | Unverändert, bestehende Proben grün | bestanden (bestehende Proben) | `pruefung/schirme.mjs` |
| T-14 Export und Rücklesen | — | — | — | Kein Datei-Export in der Webapp | nicht zutreffend (Inventar: nur Kopieren und `mailto:`) | `FUNKTIONSINVENTAR.md` 4.9 |
| T-15 Externe Wirkung | Pilot | Rückfragetexte vor Asana geprüft | Ziel, Anzahl, Folge | Launch nennt Anzahl; andere nennen Ziel und Folge | nicht ausgeführt als Versand (keine Freigabe für Testempfänger); Texte als Codeprüfung | Lücke L8 |
| T-16 Rechte und Sitzung | Pilot · Tor | Falsches Passwort; Ladefehler nach dem Tor | Keine Wirkung, Meldung, Passwort bleibt | Meldung mit `role="alert"`; Ladefehler auf der Seite, Passwort bleibt | bestanden (Simulation); Rollen nicht prüfbar, L5 | Proben 8 und 9 |
| T-17 Gleichzeitige Bearbeitung | — | — | Keine stille Überschreibung | Vorhandener Schutz (Vorhaben, Organisation, Übergabe) unverändert; sonst fehlt er | fehlgeschlagen als Bestand, nicht im Pilot behoben (Backend), L2 | `FUNKTIONSINVENTAR.md` 4.3 |
| T-18 Lange Liste und Leistung | Pilot und `05af97b` · gleiche Daten | Zeit bis zum gefüllten Inhalt, Median aus 5 Läufen; zusätzlich 600 synthetische Themen | Keine Verschlechterung über die Toleranz | Kleine Menge: 330 bis 520 ms beide, im Rauschen. 600 Themen: Board und Liste im Rauschen, Bearbeiten 2,0 bis 2,1 s statt 1,3 bis 1,8 s | nicht bestanden als Nachweis: Toleranz nicht vorab festgelegt (L6) | Abschnitt 4 |
| T-19 Bewegung und Leere | Pilot | Reduzierte Bewegung aktiv; Ladefehler und leere Zustände | Keine Animation, Ursache und nächster Schritt | 0 laufende Animationen; Ladefehler mit „Erneut laden“; Besprechung trennt Fehler und leer | bestanden (Messung, Simulation) | Abschnitt 1 |
| T-20 Rückweg und Nachbarseiten | Pilot in isolierter Kopie | Alle 6 Pilot-Commits per `git revert` zurückgenommen | Ausgangsstand wiederhergestellt | Baum gleich `origin/main` (leerer Diff), Bedienproben und 100 Schirmbilder ohne Meldung | bestanden | Abschnitt 5 |
| T-21 Fachlicher Versuch | — | — | Alexander schließt Aufgaben ab | Steht aus | nicht ausgeführt | `ARBEITSSTAND.md` |
| T-22 Lieferumfang und Status | Pilot | Bericht, Vorschau, Ausnahmen, Regeln geprüft | Kein offener kritischer Fehler als fertig | Getrennte Stände im README; L1 bis L8 offen und benannt | bestanden für die Lieferung, nicht für die fachliche Annahme | `README.md` |

## 3. Gezielte Bedienproben (Teil von `pruefung/webstandard-pruefung.mjs`)

1. Eingabe: leeres Pflichtfeld zeigt Fehler am Feld und fokussiert es.
2. Eingabe: während des Sendens gesperrt, Doppelklick erzeugt genau eine Anfrage.
3. Eingabe: Senden fehlgeschlagen bleibt am Knopf sichtbar, Eingabe bleibt erhalten.
4. Board: ⇄ öffnet per Tastatur mit Fokus im Menü, Escape schließt und gibt den Fokus zurück.
5. Board: Umsortieren ohne Ziehen wird angeboten.
6. Board: „Eine Stelle nach unten“ speichert die Reihenfolge und zeigt sie.
7. Board: Detailbereich öffnet per Enter mit Namen und Fokus, Escape schließt mit Fokus auf der Karte.
8. Tor: sichtbare Bezeichnung, falsches Passwort als Meldung mit `role="alert"`.
9. Ladefehler nach der Anmeldung: Meldung mit „Erneut laden“ auf der Seite, Tor bleibt zu, Passwort bleibt.

Die Proben fanden während der Umsetzung zwei echte Fehler, die dann behoben wurden: Enter auf ⇄ öffnete zusätzlich die Details (schon im Bestand), und das Umsortieren zählte eine unsichtbare wiederkehrende Karte mit.

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

Isolierte Kopie bei `c330049`, `git revert --no-edit origin/main..HEAD` (6 Commits), danach `git diff origin/main` leer, `pruefung/bedienung.mjs` „Alle Bedienproben in Ordnung“, `pruefung/schirme.mjs` 100 Bilder, 0 Meldungen. Fremde Änderungen sind nicht betroffen, weil der Pilot nur eigene Commits auf einem eigenen Branch trägt.
