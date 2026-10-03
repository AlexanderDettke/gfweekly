Geprüft: 31d, Commit 3f04c4c, 11 Dateien

1. [mittel] Gekürzter Verlauf lädt den fehlenden Teil nicht nach  
Fundstelle: `site/index.html:143` und `site/index.html:145`  
Was passiert: „Alles gesehen“ speichert bei einer gekürzten Liste den Zeitpunkt des ältesten geladenen Eintrags. Die nächste Abfrage verwendet `seit:bis`. Die Datenbank liefert damit erneut die neueren Einträge statt der noch fehlenden älteren. Bei weiterhin mehr als 2.000 Einträgen kann sich dieser Ablauf wiederholen.  
Warum falsch: Die Antwort auf Befund 3 aus Runde 2 verspricht, den Rest nachzuladen. Abschnitt 31d verlangt den Verlauf seit dem letzten Besuch.  
Vorschlag: Den Gesehenzeitpunkt erst nach vollständigem Laden fortschreiben. Für weitere Seiten einen eigenen Cursor verwenden, der ältere Einträge abfragt und Einträge mit gleichem Zeitstempel eindeutig behandelt.

2. [mittel] Personenwechsel kann den Verlauf der vorherigen Person anzeigen  
Fundstelle: `site/index.html:252` und `site/index.html:285`  
Was passiert: Ein Wechsel zwischen Alex und Lea startet einen neuen Ladevorgang, bricht den alten aber nicht ab. Antwortet der alte Aufruf zuletzt, überschreibt er `SEIT` und zeichnet dessen Daten unter der inzwischen gewählten Person.  
Warum falsch: „Seit du zuletzt da warst“ ist laut Abschnitt 31d personenbezogen. Die Antwort aus Runde 1 behauptet ein Neuladen der Seite; der Code startet lediglich `load()` erneut.  
Vorschlag: Jeden Ladevorgang mit Person und laufender Kennung versehen. Ergebnisse nur übernehmen, wenn beides beim Eintreffen noch aktuell ist.

3. [mittel] Link aus der Rückkehr führt nicht verlässlich zum restlichen Verlauf  
Fundstelle: `site/rueckkehr.html:171` und `supabase/functions/gfweekly/index.ts:2819`  
Was passiert: Die Rückkehr zeigt fünf Einträge und verweist für weitere auf die Akte. `vorhaben_get` liefert dort höchstens 200 Verlaufseinträge insgesamt. Ältere Einträge seit Beginn einer längeren Abwesenheit können daher trotz des Links unerreichbar bleiben.  
Warum falsch: Abschnitt 31d verlangt die Einträge seit Beginn der Abwesenheit. Der Hinweis „weitere in der Akte“ verspricht mehr, als die Akte in diesem Fall lädt.  
Vorschlag: Den Rückkehrverlauf vollständig aufklappbar oder seitenweise abrufbar machen. Die Akte nur dann als Ziel nennen, wenn sie die betreffenden Einträge tatsächlich laden kann.

4. [schwer] Rückübergabe kann teilweise abgeschlossen bleiben  
Fundstelle: `supabase/functions/gfweekly/index.ts:1917` und `supabase/functions/gfweekly/index.ts:1930`  
Was passiert: `absence_end` setzt die Abwesenheit zuerst auf „beendet“. Scheitert danach die Rückgabe der Vorhabenbälle, antwortet die Aktion mit Fehler, während der neue Status bereits gespeichert ist. Themen werden in weiteren einzelnen Schreibvorgängen bearbeitet.  
Warum falsch: Eine fehlgeschlagene Rückübergabe kann so eine beendete Abwesenheit mit weiterhin gebundenen Bällen hinterlassen. Das gefährdet den Rückweg des in Abschnitt 31d beschriebenen Übergabeablaufs.  
Vorschlag: Statuswechsel, Rückgabe der Themen und Vorhaben sowie Protokoll in einer Datenbanktransaktion ausführen. Bis dahin bei einem Teilfehler die verbliebenen Bindungen ausdrücklich melden und einen überprüfbaren Wiederholungsweg anbieten.

## Empfehlungen

1. Im Urlaubskorb nach dem Senden die verbleibenden offenen Zeilen direkt anzeigen.
2. Bei einer gekürzten Rückkehrliste die angezeigten Anzahlen ausdrücklich als Ausschnitt kennzeichnen.
3. Vor dem 13.10. den konkreten Urlaubskorb vom 14. bis 25.10. als Lea und als Alex durchspielen und die Rückgabe prüfen.

Die übrigen sechs Antworten aus Runde 2 sind im Code grundsätzlich nachvollziehbar, darunter das Zurücksetzen des Teamnamens nach einem Teilfehler, die ausdrückliche Abwesenheitswahl und das Sperren der Rückübergabe bei Ladefehler. Der Inhaltswert in `pruefung/letzte-abnahme.json` stimmt mit `pruefung/stand.mjs` überein. Browserdarstellung bei 1440 und 390 Pixeln, Tastatur und Bildschirmleser sowie tatsächliche Datenbankwirkung, Nebenläufigkeit und Aufräumung konnte ich ohne Browser und Backendzugang nicht bestätigen. Ich habe nichts geändert.