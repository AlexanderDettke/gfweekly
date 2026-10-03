Geprüft: 31b, Commit 833bbad, 37 Dateien

Die Antworten aus Runde 1 und 2 sind für die dort genannten Korrekturen am Code nachvollziehbar. Die folgenden Fälle bleiben offen.

1. [schwer] Namensänderung beim gleichen Ball kann überschrieben werden  
Fundstelle: site/vorhaben.html:258  
Was passiert: Beim Weitergeben wird nur `expect_ball` gesendet. Ändert Lea etwa „Team: Helge“ zu „Team: Niclaas“, während Alex noch den alten Stand sieht, bleibt die Ballart `team`. Alex kann danach den Namen ohne Konfliktmeldung überschreiben. Die Datenbank prüft ebenfalls nur die Ballart in `supabase/migrations/20261003175631_hh_vorhaben_v31b_erwartet.sql:32`.  
Warum falsch: Ein gleichzeitiger Ballwechsel kann die neuere Zuordnung verlieren, obwohl die Antwort zu Runde 2 einen Konfliktschutz für gleichzeitig bearbeitete Werte beschreibt.  
Vorschlag: Den gesehenen `ball_name` zusammen mit `ball` unter der Zeilensperre prüfen. Eine Wirkungsprobe mit zwei verschiedenen Teamnamen ergänzen.

2. [schwer] Veraltete Zuordnung kann Leas Änderung entfernen  
Fundstelle: site/vorhaben.html:379  
Was passiert: „Zuordnung lösen“ und „Rückgängig“ schreiben ohne Prüfung der aktuellen `vorhaben_id`. Hat Lea einen Eintrag inzwischen einem anderen Vorhaben zugeordnet, kann Alex ihn aus einer alten Akte lösen oder mit „Rückgängig“ zurückholen. Auch `supabase/functions/gfweekly/index.ts:2882` prüft den bisherigen Wert nicht.  
Warum falsch: Das erzeugt bei gleichzeitiger Bearbeitung ein falsches Datenbankergebnis. Der Knopf ist im Paketabschnitt „Zuordnung“ bestellt, seine Wirkung muss aber den aktuellen Bezug achten.  
Vorschlag: Den gesehenen Bezug mitsenden und die Änderung nur ausführen, wenn er noch gilt. Bei Abweichung 409 melden und die Akte neu laden.

3. [mittel] Eingabe geht nach Speicherkonflikt beim Reiterwechsel verloren  
Fundstelle: site/vorhaben.html:370  
Was passiert: Der Reiterwechsel zeichnet die Akte sofort neu. Das Verlassen eines bearbeiteten Textfelds startet lediglich den asynchronen Speicherversuch in Zeile 361. Kommt danach ein 409, erscheint eine Meldung, aber der eingegebene Text ist bereits aus der Oberfläche entfernt.  
Warum falsch: Alex oder Lea können ihren eigenen Entwurf nach einem Konflikt nicht mehr prüfen oder erneut verwenden.  
Vorschlag: Den Reiterwechsel bis zum Speicherergebnis zurückstellen oder den nicht gespeicherten Text bei einem Konflikt im Feld erhalten.

## Empfehlungen

1. Die Wirkungsprobe um gleichzeitige Änderungen von `ball_name` und `vorhaben_id` ergänzen. Die bisherigen Konfliktproben decken diese Werte nicht ab.
2. Bei 409 den aktuellen Wert und die eigene Eingabe nebeneinander zeigen, damit Alex oder Lea unmittelbar entscheiden können.
3. Den bekannten Rest der Wirkungsprobe ausdrücklich weiterführen: Sie lässt archivierte Testvorhaben und beendete Testabwesenheiten bis zum nächsten Lauf stehen. Das ist im Technikstand beschrieben, erfüllt aber das Aufräumen aus Abschnitt 31a nicht vollständig.

Ich konnte weder einen Browser starten noch die Datenbank erreichen. Darstellung bei 1440 und 390 px, die gemeldeten Oberflächenläufe, die behauptete Live Anwendung der Migration und die tatsächliche Datenbankwirkung sind daher nicht unabhängig geprüft. Die Syntaxprüfungen der beiden Prüfscripte liefen durch; der berechnete Prüfstand stimmt mit `pruefung/letzte-abnahme.json` überein.
