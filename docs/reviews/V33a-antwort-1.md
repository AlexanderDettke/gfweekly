# V33a Antwort auf Runde 1

Stand: 09.10.2026. Befunde 1 bis 5 übernommen und lokal umgesetzt. Kein Befund verworfen. Grundlage sind `docs/PAKET-V33-SO-ARBEITEN-WIR.md`, Teilpaket V33a, und `docs/reviews/V33a-runde-1.md`.

## Befund 1: Rücknahme der Abgabe

Übernommen. In `supabase/functions/arbeiten/index.ts:234` setzt das Update die eigene Abgabe nur zurück, wenn die andere Abgabe im selben Update noch `null` ist. Kein Treffer ergibt 409 mit dem bestehenden Hinweis (`:236`). Ein konkurrierender Aufruf von `abgeben` kann den ersten Zeitpunkt nicht mehr überschreiben: Bedingung auf die eigene Abgabe (`:224`), bei keinem Treffer erneutes Lesen und `schon: true` (`:226`). Die Funktionsversion ist lokal 2 (`:15`).

Geprüft mit dem tatsächlichen Funktionscode, lokal transpiliert und mit einem Datenbankdouble ausgeführt: für beide Personen erlaubte Rücknahme, bereits gesperrte Rücknahme, fremde Abgabe zwischen Lesen und Update, erste Abgabe, Doppelaufruf und konkurrierende eigene Abgabe. Abgelehnte Änderungen schreiben keinen Protokolleintrag. Die Probe steht in `pruefung/arbeiten-probe-ui.mjs:64`, der gezielte konkurrierende Updatefall in `:109`.

Offen: Deployment durch den Prüfer und Wirkungsprobe gegen Supabase. Das lokale Double belegt die bedingte Abfrage und ihre Behandlung, keine echte Datenbanktransaktion.

## Befund 2: Gemeinsame Auswertung

Übernommen. „Wo es bei beiden hakt“ steht wieder vor „Größte Unterschiede“ (`site/arbeiten.html:366`). Berücksichtigt werden nur Skalenfragen mit zwei numerischen, beurteilbaren Antworten. Die Richtung ist bei `umgekehrt` der Wert, sonst `6 minus Wert` (`:354`). Der gemeinsame Mittelwert muss mindestens 3,5 sein; angezeigt werden höchstens sechs Aussagen (`:358`). Die Tabelle zeigt die ursprünglichen Einzelantworten zu den Abläufen. Es gibt keine Summen oder Rangfolge je Person. Der Hinweis nach beidseitiger Abgabe nennt die gemeinsame Sicht wieder (`:340`).

Geprüft: Auswertung erst nach beiden Abgaben, Schwellenwert einschließlich 3,5, Begrenzung auf sechs Aussagen, beide Skalenrichtungen, Ausschluss fehlender und nicht beurteilbarer Antworten. Die Browserprobe enthält zusätzlich die gemeinsame Tabelle im Ablauf mit zwei Abgaben.

Offen: Darstellung bei 390 und 1440 px in beiden Themen durch den Prüfer.

## Befund 3: Hub am Handy

Übernommen. Werkzeuge erscheinen zunächst als geschlossene `details` mit Name, Bearbeitungsbeschriftung und Status samt aktueller Einordnung und vorhandenem Reifegrad (`site/arbeiten.html:383`, `:388`). Lange Namen werden in der kompakten Zeile gekürzt dargestellt; der vollständige Name bleibt im Text und in der geöffneten Bearbeitung. Zweck, Link, Kümmerer, Notiz und beide Chipreihen bleiben erreichbar. Die Zusammenfassung wird nach erfolgreichem Speichern aktualisiert (`:586`). Öffnen schließt andere Werkzeugbearbeitungen (`:476`). Der Filter „noch offen“ ergänzt die bestehenden Filter; Suche und „x von y“ bleiben (`:400`).

Geprüft mit 93 Werkzeugen: geschlossene Renderausgabe, Filter „noch offen“, Suche, leere Suche, bestehender GF Filter, Speichern der Einordnung und Schließen der anderen Bearbeitung. Die Browserprobe wurde um Tastaturbedienung, aktualisierte Zusammenfassung, genau eine offene Bearbeitung und Höhe höchstens 90 px bei 390 px ergänzt, auch für den langen Werkzeugnamen (`pruefung/arbeiten-probe-ui.mjs:370`, `:376`).

Offen: Tatsächliche Zeilenhöhe, Fokus und Darstellung prüft der Prüfer mit Browser. Diese Messungen wurden hier nicht ausgeführt.

## Befund 4: Skalenenden

Übernommen. Die Skala verwendet weiterhin genau ein verstecktes Feld und eine `gfChips` Gruppe (`site/arbeiten.html:316`). Die sichtbare Reihenfolge ist „trifft gar nicht zu“, 1 bis 5, „trifft voll zu“, danach getrennt „kann ich nicht beurteilen“. Das Raster hält die Zahlen zusammen und setzt die Nichtbeurteilung in eine eigene Zeile (`:70`). Autosave und Sperre nach Abgabe gelten weiter für alle Chips.

Geprüft: Reihenfolge im erzeugten Markup, ein gemeinsames Antwortfeld, Speichern der Skala und Nichtbeurteilung sowie Sperre nach Abgabe. Die Browserprobe prüft zusätzlich die tatsächliche Position unter dem Skalenende und den Wechsel zwischen Zahl und Nichtbeurteilung mit genau einem gedrückten Chip (`pruefung/arbeiten-probe-ui.mjs:332`).

Offen: Visuelle Prüfung durch den Prüfer.

## Befund 5: Inaktive Fragen

Übernommen. `antwort_set` lädt die Frage jetzt nur mit `aktiv = true` (`supabase/functions/arbeiten/index.ts:202`). Eine inaktive oder fehlende Frage ergibt wie bisher 404, bevor eine Antwort geschrieben wird.

Geprüft mit dem tatsächlichen Funktionscode und Datenbankdouble für beide Personen: inaktiv ergibt 404 ohne Antwort, aktiv bleibt beantwortbar, fehlende Frage ergibt ebenfalls 404 (`pruefung/arbeiten-probe-ui.mjs:117`).

Offen: Wirkungsprobe gegen Supabase durch den Prüfer.

## Befund 6 und Empfehlungen

Befund 6 bleibt wie beauftragt beim Prüfer. Seed und Datensatz wurden nicht geändert.

Als kleine, sichere Empfehlung umgesetzt: Auf dem Starttab dieser Seite steht „24 Fragen, etwa 15 Minuten“ als Orientierung (`site/arbeiten.html:174`). Die Seite „Für dich“ blieb unverändert. Die Empfehlungen zum lokalen Anlegen neuer Steckbriefe, zur Anordnung der Beispiele und zur Gruppierung der Systeme wurden in dieser Runde nicht umgesetzt, da sie weitere Änderungen an Speicherablauf oder Darstellung erfordern.

## Prüfnachweis und Übergabe

1. `node pruefung/arbeiten-probe-ui.mjs --logic-only`: 76 Prüfungen bestanden, davon 19 am tatsächlichen Funktionscode mit Datenbankdouble. Keine Browserabnahme. Die Probe benötigt für die lokale TypeScript Ausführung Node ab 22.13 und lädt Playwright erst im Browsermodus.
2. `node --check pruefung/arbeiten-probe-ui.mjs`: bestanden. Inline JavaScript wird zusätzlich durch die Logikprobe syntaktisch geprüft.
3. `python3 pruefung/tokens.py`: 0 Abweichungen. Die Logikprobe prüft außerdem alle verwendeten Seitentokens und Farben sowie Gedankenstriche.
4. Prüfsumme von `supabase/functions/gfweekly/index.ts` vor und nach der Bearbeitung identisch.

Geänderte Dateien: `site/arbeiten.html`, `supabase/functions/arbeiten/index.ts`, `pruefung/arbeiten-probe-ui.mjs`, `docs/reviews/V33a-antwort-1.md`.

Kein Netz verwendet, kein Commit, kein Deployment, keine weiteren Agenten. Der Prüfer übernimmt Commit, Browserprobe ohne `--logic-only`, Deployment von `arbeiten` Version 2 und die Wirkungsprobe im Rahmen V33b. Echte Bildschirmleserprüfung bleibt offen.
