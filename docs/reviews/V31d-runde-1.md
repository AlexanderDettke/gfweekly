Geprüft: 31d, Commit 40d1463, 10 Dateien.

1. [schwer] Bereits entschiedene Vertretungen werden erneut gesetzt  
Fundstelle: `site/vorhaben.html:505` und `site/vorhaben.html:541`  
Was passiert: Der Dialog nimmt auch bestätigte Vorhaben Zeilen in die Auswahl auf. Eine bestehende Vertretung durch eine andere Person wird als „Alex übernimmt“ beziehungsweise „Lea übernimmt“ vorausgewählt. „Übergabe senden“ schickt anschließend **alle** Zeilen an `handover_set_many`. Die Datenbankfunktion wendet eine geänderte Vertretung erneut an und stellt den Ball um.  
Warum falsch: Eine bestehende Entscheidung kann dadurch ohne bewusste Neuwahl überschrieben werden. Das gefährdet die Übergabe am 13.10. und widerspricht der Auswahl je Zeile in Paketabschnitt 31d.  
Vorschlag: Bestätigte Zeilen mit ihrer tatsächlichen Vertretung anzeigen. Nur ausdrücklich geänderte Zeilen senden. Für eine Änderung die bisherige Zuordnung und den gesehenen Stand prüfen.

2. [schwer] Gleichzeitige Änderungen am Urlaubskorb sind nicht abgesichert  
Fundstelle: `site/vorhaben.html:544`  
Was passiert: Der Dialog sendet nur Zeilenkennung, Ampel und Vertretung. Ändern Alex und Lea dieselbe Zeile nacheinander, kann der spätere Aufruf die erste Entscheidung überschreiben; `hh_handover_set` sperrt zwar während eines einzelnen Schreibvorgangs, vergleicht aber keinen vom Dialog gesehenen Stand.  
Warum falsch: Die Oberfläche meldet eine erfolgreiche Übergabe, obwohl eine zwischenzeitliche Entscheidung ersetzt wurde.  
Vorschlag: Einen Änderungsstand je Korbzeile mitsenden und in der Datenbank atomar vergleichen. Bei Abweichung einen Konflikt anzeigen und die Zeile neu laden.

3. [mittel] Der Dialog kann die falsche Abwesenheit auswählen  
Fundstelle: `site/vorhaben.html:440` und `site/vorhaben.html:498`  
Was passiert: `laufend()` nimmt die erste geplante oder aktive Abwesenheit der Person, unabhängig von Anlass und Zeitraum. Eine spätere geplante Reise kann so im Dialog für den Urlaub vom 14. bis 25.10. landen. Der Dialog bietet dann keine Datumsauswahl mehr.  
Warum falsch: Paketabschnitt 31d verlangt die passende laufende Abwesenheit oder eine neue. Eine Übergabe könnte im falschen Korb protokolliert werden.  
Vorschlag: Passende Abwesenheiten nach Zeitraum und Anlass ermitteln. Bei mehreren Treffern die konkrete Abwesenheit zur Auswahl stellen.

4. [mittel] Der Testschalter kann echte Vorhaben bewegen  
Fundstelle: `site/vorhaben.html:463` und `site/vorhaben.html:517`  
Was passiert: „Probe“ setzt `test: true` an der Abwesenheit. Der anschließend gebaute Korb enthält dennoch Vorhaben mit echtem Ball; „Übergabe senden“ kann diese Bälle umhängen. „Später“ lässt die Testabwesenheit und mögliche Änderungen bestehen.  
Warum falsch: Die Beschriftung verspricht eine Probe, während echte Vorhaben betroffen sein können. Die spätere Rückgabe setzt zudem voraus, dass die Abwesenheit beendet wird.  
Vorschlag: Im Dialog ausdrücklich auf die Wirkung auf echte Bälle hinweisen oder für eine reine Probe keine echten Vorhaben schreiben. Einen klaren Abschlussweg für Testabwesenheiten anbieten.

5. [mittel] „Seit du zuletzt da warst“ kann Einträge still verlieren  
Fundstelle: `supabase/functions/gfweekly/index.ts:2783`  
Was passiert: Die Abfrage begrenzt zunächst alle Verlaufseinträge auf 400 und filtert erst danach aktive Vorhaben und eigene Einträge heraus. Ältere fremde Einträge im gewünschten Zeitraum können fehlen. Die Oberfläche zeigt weder eine Begrenzung noch einen Hinweis.  
Warum falsch: Paketabschnitt 31d beschreibt den Verlauf seit dem gespeicherten Zeitpunkt. Anzahl und jüngster Eintrag je Vorhaben können unvollständig sein.  
Vorschlag: Bis zum Ende des Zeitfensters seitenweise lesen oder die Filterung vor der Begrenzung in der Datenbank ausführen. Eine unvermeidliche Obergrenze sichtbar kennzeichnen.

6. [mittel] Rückkehrdaten scheitern unsichtbar  
Fundstelle: `site/rueckkehr.html:148` und `site/rueckkehr.html:153`  
Was passiert: `ladeVorhaben()` wird nicht abgewartet. Bei einem Fehler kehrt die Funktion kommentarlos zurück; „Deine Vorhaben zurück“ bleibt verborgen, während die Rückübergabe bestätigt werden kann.  
Warum falsch: Der in Paketabschnitt 31d verlangte Überblick fehlt genau dann, wenn die Datenabfrage scheitert.  
Vorschlag: Ladezustand, Fehler mit erneutem Versuch und echten Leerzustand im Abschnitt anzeigen. Vor dem Abschluss zumindest den Fehler sichtbar machen.

7. [mittel] Der Prüfnachweis gehört zum vorherigen Stand  
Fundstelle: `pruefung/letzte-abnahme.json:2` und `docs/TECHNIKSTAND.md:694`  
Was passiert: Die Abnahmedatei nennt Commit `833bbad`, während der Technikstand für 31d bereits „Schirme 84 Bilder, 0 Meldungen“ und die neuen Oberflächenproben als geprüft ausweist.  
Warum falsch: Der abgelegte Nachweis belegt den geänderten Stand `40d1463` nicht. Die Bedienproben fangen zudem die Edge Function ab und belegen keine Datenbankwirkung.  
Vorschlag: Den Oberflächenlauf für den genauen Commit dokumentieren und die Wirkungsprobe getrennt ausweisen. Die genannten Aussagen bis dahin als nicht aktuell belegt markieren.

## Empfehlungen

1. Im Urlaubsdialog nur offene und ausdrücklich geänderte Zeilen zum Senden anbieten.
2. Nach einer teilweisen Übergabe direkt die verbleibenden Zeilen des Korbs öffnen.
3. Beim Wechsel zwischen Alex und Lea laufende Ladevorgänge verwerfen, damit verspätete Antworten keine Ansicht der falschen Person anzeigen.
4. Die Rückkehrseite mit einer kurzen Zusammenfassung beginnen: zurückgegeben, noch vertreten, geruht.
5. Für den 13.10. eine gezielte Probe mit der konkreten Abwesenheit vom 14. bis 25.10. und den tatsächlich zu übergebenden Vorhaben festhalten.

Ich habe nur den Code gelesen und nichts geändert. Browserdarstellung bei 1440 und 390 Pixeln, Tastaturbedienung sowie tatsächliche Datenbankwirkung konnte ich ohne Browser und Backendzugang nicht bestätigen.