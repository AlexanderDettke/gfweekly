# Hohes Haus · V34 · Auftrag: „So arbeiten wir“ als Wegweiser in Etappen (Stand 11.10.2026, entschieden, vorgezogen)

**Reihenfolge geändert (Alex, 11.10.): V34 kommt vor V35.** Die Google-Anmeldung (V35) funktioniert noch nicht; V34 wird deshalb unabhängig davon auf main gebaut und deployt. V35 bleibt auf dem Branch `paket/v35-anmeldung` liegen und wird danach auf V34 aufgesetzt (Assets dann ?v=35 → ?v=36 prüfen, ?person= wird bei Google-Anmeldung wirkungslos).

**Entschieden (Alex, 10.10.): Variante B „Wegweiser“** im Design des Hohen Hauses. Klickbarer Entwurf: Canvas „So arbeiten wir · drei Einstiege“, Artboard „B · Wegweiser“ (https://claude.ai/artifact/BBXXqVsYjFP254xYjs2cRR). Live ist noch V33 (Tabs Start / Ist-Aufnahme / Umfrage / Systeme); dieser Auftrag ersetzt deren Einstieg.

Vorgaben Alex:
- Ein naheliegender nächster Klick zu jeder Zeit, keine Tab-Suche, executive ready, nicht langweilig.
- **Keine Zeitangaben** auf der Seite (keine „Minuten“). Jede Etappe ist klein genug, dass sie **höchstens 8 Minuten** dauert. Was länger dauern würde, wird in Etappen geteilt.
- Zwischen Etappen speichern und später weitermachen; jede Etappe für sich machbar.

## Aufbau: ein Pfad, drei Schritte, jeder in Etappen

Persönliche Links öffnen direkt den Wegweiser, ohne Tabs und ohne Personenwahl:
- https://hohes-haus.netlify.app/arbeiten.html?person=alex&start=1
- https://hohes-haus.netlify.app/arbeiten.html?person=lea&start=1
Ohne Parameter: Startkarte „Ich bin Alex“ / „Ich bin Lea“, dann derselbe Wegweiser. Die bisherigen Tabs bleiben als „Alles ansehen“ unten erreichbar, nicht im Einstieg.

Kopf: „Guten Tag, Alex.“ / „Wie arbeiten wir zwei heute? Immer nur eine kleine Etappe.“ Darunter zwei Statuskacheln Alex und Lea mit Symbol plus Wort („● Etappe 2 von 3“, „○ Etappe 1 offen“, „✓ abgegeben“). Nur Stand, keine Antworten.

Pfad: drei Karten untereinander. Genau eine ist aktiv (Rahmen Blattgrün, Schatten, Hauptknopf Honiggold), erledigte bekommen ✓ und werden ruhig, spätere sind gestrichelt bzw. --disabled und sagen „danach“.

### Schritt 1 · Wie läuft es heute? (Umfrage, 24 Fragen in 3 Etappen)
- Etappe 1 · Orientierung, Entscheidungen, Anfragen: Fragen 1–9
- Etappe 2 · Fokus, Verlässlichkeit, Systeme: Fragen 10–19
- Etappe 3 · Zusammenarbeit und offene Fragen: Fragen 20–24 (Textfragen 22–24 freiwillig, „Überspringen“)
Falls Etappe 2 beim Test zu lang wirkt: Frage 15 (Text) nach Etappe 3 verschieben.
Drei Etappen-Kacheln in der Karte zeigen den Stand. Knopf „Etappe 1 starten“ bzw. „Etappe 2 starten“. In der Etappe: Fortschrittsbalken, „Etappe 1 · Frage 3 von 9“, Aussage groß, sechs Antwortknöpfe „trifft gar nicht zu · eher nicht · teils · eher · trifft voll zu · passt nicht zu mir“; Tippen speichert und geht nach 200 ms weiter; Zurück-Pfeil. Frage 12 als Stepper (Stunden), Frage 21 als vier Karten.
Nach jeder Etappe: „✓ Etappe 1 geschafft“ / „Gespeichert. Direkt weiter oder später hier einsteigen.“ / Knöpfe „Etappe 2 starten“ und „Später“. Nach Etappe 3: „Antworten abgeben“. Abgabe zurücknehmen wie bisher (solange die andere Person nicht abgegeben hat).
Nach Abgabe beider: in der Karte Knopf „Vergleich ansehen“ → bestehende Auswertung, oben die drei wichtigsten Punkte.
Bereits vorhandene Antworten (z. B. wenn Alex vorher in V33 geantwortet oder abgegeben hat) werden übernommen; der Wegweiser zeigt dann den passenden Stand.

### Schritt 2 · Deine Abläufe (Steckbriefe, ein Ablauf pro Etappe)
Wird aktiv, sobald Schritt 1 abgegeben ist. Vorschlag drei Abläufe → drei Etappen-Kacheln „Ablauf 1 / 2 / 3“, weitere optional („Noch einen Ablauf“).
Ein Ablauf = eine Etappe mit fünf Bildschirmen, je eine Frage, Chips wo möglich:
1. Welcher Ablauf? (ablauf; Vorschlagschips aus häufigen Abläufen + Freitext)
2. Wann startet er? (startet_wenn) + Wie oft? (haeufigkeit als Chips: täglich / wöchentlich / monatlich / unregelmäßig)
3. Womit läuft er? (werkzeuge; Chips aus gfweekly_sa_systeme, Mehrfachwahl)
4. Wer ist beteiligt, betrifft es die andere Person? (beteiligte, beruehrt_andere als Ja/Nein)
5. Was hakt, was läuft gut? (hakt, laeuft_gut; beide freiwillig)
Danach „Freigeben“ oder „Erst mal für mich behalten“. schritte und ergebnis_ort als optionale „Mehr Details“ später, nicht im Pflichtpfad.

### Schritt 3 · Unsere Systeme (eine Etappe, bei Bedarf mehrere)
Die 12 Einträge aus gfweekly_sa_systeme nacheinander, je ein Bildschirm: Name, wofür, Beobachtung; Knöpfe „stimmt“ / „korrigieren“ (Feld klappt auf) / „kenne ich nicht“. Hub-Werkzeuge einordnen als eigene Etappe, höchstens 10 Einträge je Etappe.

## Grundsätze
Ein Bildschirm, eine Handlung; kein Erklärtext über zwei Zeilen; keine Zeitangaben; keine Gedankenstriche in Oberflächentexten; Zustände als Symbol plus Wort; ein primary je Ansicht, Verb zuerst. Handy zuerst, Touch-Flächen ≥44 px; Übergänge 120/200 ms, prefers-reduced-motion beachten, keine Konfetti; nur vorhandene Tokens aus styles.css (Waldschwarz/Waldgrün, Honiggold --action, Blattgrün --accent, --disabled), Schrift Archivo in den fünf Stufen. Gespeichert wird sofort, nirgends ein „Speichern“-Knopf. Beim Wiederkommen öffnet der Link an der Stelle, an der man aufgehört hat.

## Technik
- **Basis: main (V33-Stand), nicht der Branch paket/v35-anmeldung.** Vorher `git fetch && git status && git log --oneline -5`; ungepushten docs-Commit auf main (b6641d3) mitnehmen. Nichts aus dem V35-Branch übernehmen.
- site/arbeiten.html: Wegweiser als Standardansicht bei ?start=1 bzw. nach Personenwahl; Person aus ?person= setzen wie die Kopfzeilenauswahl (bleibt umschaltbar, keine Sicherheitsfunktion; Schutz bleibt Passwort und Sichtbarkeitsregeln der Edge Function).
- „passt nicht zu mir“ → gfweekly_sa_antworten.kann_nicht = true (Spalte existiert; prüfen, ob antwort_set sie schon setzt, sonst Edge Function `arbeiten` erweitern; dabei vom Live-Stand der Funktion ausgehen, nicht vom V35-Branch, und vor dem Deploy diffen). In der Auswertung ausnehmen; umgekehrt gepolte Fragen 9, 11, 17 wie bisher.
- Etappen-Stand aus vorhandenen Antworten ableiten (welche Nummern beantwortet sind), keine neue Tabelle nötig. Statuskacheln über lage (nur Stand der anderen Person, keine Inhalte).
- Steckbrief-Etappen schreiben über ist_save in gfweekly_sa_ist (bestehende Felder); Systeme über system_save.
- Assets ?v=34 auf allen Seiten, Commit „V34: So arbeiten wir als Wegweiser in Etappen“, Push auf main, Deploy über den Deploy-Permalink prüfen (nicht Hauptadresse; WebFetch speichert Fehler 15 Min).
- Bedienprüfung als Alex und als Lea, Handy und Desktop: Link → Etappe 1 → nach 3 Fragen neu laden (setzt bei Frage 4 fort) → Etappe 1 fertig → „Später“ → Link erneut („Etappe 2 starten“) → bis Abgabe → Zurücknehmen → Schritt 2 aktiv. Vorhandene echte Antworten von Alex nicht anfassen; Prüfung mit einer eigenen Testrunde oder Testdaten, die danach aus Supabase entfernt werden.
- Danach im V35-Branch vermerken: auf V34 rebasen, Assets ?v=36, arbeiten.html übernimmt die Person aus der Anmeldung.

## Umsetzung (Terminal-Sitzung 11.10.2026)

**Gebaut auf main** (Basis b6641d3, nichts aus `paket/v35-anmeldung`).
- `site/arbeiten.html`: Startkarte („Ich bin Alex“ / „Ich bin Lea“), Wegweiser mit Gruß, zwei Statuskacheln und drei Karten; die bisherigen vier Tabs unverändert unter „Alles ansehen“ (auch direkt über `#start`, `#ist`, `#umfrage`, `#systeme`). „passt nicht zu mir“ auch in der alten Ansicht und der Auswertung; oben in der Auswertung „Die drei wichtigsten Punkte“. „etwa 15 Minuten“ entfernt. Assets `?v=34` auf allen 25 Seiten.
- Edge Function `arbeiten` v3: `lage` liefert zusätzlich `umfrage.andere_beantwortet` (nur Fragenummern, keine Inhalte) für die Statuskachel der anderen Person. Ohne Deploy zeigt die Seite für die andere Person „○ noch offen“ bzw. „✓ abgegeben“ (Rückfall auf v2).
- Prüfungen: `pruefung/arbeiten-probe-ui.mjs` (Oberflächentest mit Double, jetzt mit Wegweiser-Durchlauf als Alex und Lea, 415 Prüfungen, 390/1440, hell/dunkel), `pruefung/v34-bedienpruefung-live.mjs` (live gegen Funktion v2 und echte Datenbank: Lea ganzer Pfad, Alex nur lesend, je 23 Prüfungen bei 390 und 1440), `pruefung/v34-testdaten-entfernen.sql` (löscht nur seit Prüfbeginn, bricht ab, wenn Lea ältere Daten hat; danach Lea 0/0/nicht abgegeben, Alex unverändert, Protokoll wieder 3 Zeilen). `pruefung/schirme.mjs` erwartet seit V33 19 Menüeinträge (vorher veraltet 18), die Abnahme läuft wieder grün.
- Live als Alex bewusst nur lesend: die Vorgabe verbietet, seine echten Antworten anzufassen, und eine eigene Testrunde beträfe beide. Der volle Pfad als Alex läuft im Oberflächentest; der Funktionscode ist für beide Personen derselbe.

**Arbeitsannahmen (nicht bestätigt):**
- Etappen-Stand: eine Frage gilt als beantwortet bei Wert, „passt nicht zu mir“ oder (Textfrage) Text. Nur 22 bis 24 haben „Überspringen“; es verwirft eingegebenen Text und speichert `kann_nicht` ohne Text, damit der Link danach nicht wieder dort öffnet. Frage 15 bleibt Pflicht in Etappe 2.
- Gespeichert wird sofort: Antworten beim Tippen, Ablauf-Felder beim Verlassen, Chips beim Tippen (der Steckbrief entsteht mit dem ersten Namen), Systemkorrekturen beim Verlassen.
- Abgeben im Wegweiser erst, wenn alle drei Etappen fertig sind (die alte Ansicht erlaubt weiter Teilabgaben).
- Schritt 2 gilt mit drei eigenen Abläufen als erledigt; weitere über „Noch einen Ablauf“. Werkzeuge im Steckbrief: Systemnamen als Chips plus Freitext, gespeichert als Liste mit Komma in `werkzeuge`.
- Schritt 3 wird nach drei Abläufen aktiv: eine Etappe „Unsere Systeme“ (alle Einträge), danach die Hub-Werkzeuge mit Status aktiv oder im Aufbau (nicht abgelöst oder archiviert) in Etappen zu höchstens 10 („Werkzeuge 1 bis 10“ …). „Stimmt“ und „Kenne ich nicht“ schreiben nichts; sie merkt sich das Gerät (localStorage je Person), weil es keine Tabelle je Person dafür gibt. Die Seite sagt das dazu. Ein dauerhafter Stand je Person wäre eine neue Tabelle (Folgepaket). „Korrigieren“ speichert über `system_save`, die Einordnung eines Werkzeugs über `hub_stand_set` (gemeinsam für beide).
- Wo man aufgehört hat (Etappe, Ablauf, Bildschirm), merkt sich das Gerät ebenfalls im localStorage; auf einem anderen Gerät öffnet der Pfad an der nächsten offenen Etappe.

**Offen für Alex:** Funktion `arbeiten` deployen (`npx --yes supabase@latest functions deploy arbeiten --project-ref bnfmupnmqyrcltrphfak --no-verify-jwt`), Push auf main, Deploy-Permalink ansehen.

## Terminal-Start

cd ~/Documents/GitHub/gfweekly && git checkout main && claude "Lies docs/PAKET-V34-WEGWEISER.md und setze V34 vollständig auf main um, ohne den V35-Branch, inklusive Bedienprüfung"
