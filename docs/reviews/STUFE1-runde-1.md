Geprüft: Stufe 1, Commit fd6c992d538f20868849c964a247dcc4de7fc11a, 48 Dateien

1. [schwer] Rückgängig kann spätere Änderungen am Original überschreiben  
Fundstelle: `supabase/migrations/20261025150500_stufe1_entscheidungen.sql:330`  
Was passiert: `hh_entscheidung_zurueck` schreibt gespeicherte Werte für Zuständigkeit, Frist und weitere Quellfelder ohne Prüfung des aktuellen Stands zurück. Ändert jemand diese Felder nach der Entscheidung, gehen die Änderungen beim Rückgängig verloren.  
Warum falsch: Abschnitt 1 verlangt Rückschreiben ohne Datenverlust.  
Vorschlag: Betroffene Quellzeilen sperren und nur zurücksetzen, wenn sie noch dem durch die Aktion erzeugten Stand entsprechen. Sonst einen Konflikt melden.

2. [schwer] Entscheidungen wirken auf inzwischen ungültige Quellen  
Fundstelle: `supabase/migrations/20261025150500_stufe1_entscheidungen.sql:182`  
Was passiert: Die Funktionen prüfen den Status der Entscheidungszeile, aber nicht erneut, ob etwa ein Thema inzwischen archiviert oder sein Ausgang geändert wurde. Ein alter Aufruf kann so ein archiviertes Thema entscheiden. Auch eine bereits abgegebene Zeile lässt sich noch entscheiden.  
Warum falsch: Das widerspricht der Quellenregel und dem Verschwinden abgegebener Entscheidungen aus dem offenen Arbeitsweg in Abschnitt 1 bis 3.  
Vorschlag: Quelle innerhalb derselben Transaktion sperren, ihre aktuelle Eignung prüfen und andernfalls mit Konflikt abbrechen.

3. [schwer] Korbzuordnung kann nur teilweise gespeichert werden  
Fundstelle: `supabase/functions/gfweekly/entscheidungen.ts:219`  
Was passiert: „Neues Vorhaben“ legt erst das Vorhaben an und ordnet danach den Eintrag zu. Anschließend wird der Verlauf separat geschrieben. Scheitert ein späterer Schritt, bleiben ein ungenutztes Vorhaben oder eine Zuordnung ohne Verlauf zurück, obwohl die Oberfläche einen Fehler meldet.  
Warum falsch: Abschnitt 4 verlangt Zuordnung mit Verlaufseintrag als zusammengehöriges Ergebnis.  
Vorschlag: Anlage, Zuordnung und Verlauf in eine Datenbankfunktion mit einer Transaktion verlegen.

4. [mittel] Beschlüsse fehlen bei der letzten Besprechung  
Fundstelle: `supabase/migrations/20261025150500_stufe1_entscheidungen.sql:200`  
Was passiert: Der neue Beschluss erhält keine `session_id`. `besprechung.html` lädt die Beschlüsse der letzten Sitzung jedoch ausdrücklich über diese Kennung. Der Abschnitt bleibt nach einer Sitzung mit entschiedenen Themen leer.  
Warum falsch: Abschnitt 5 verlangt, dass die Besprechung die Entscheidungen abarbeitet und ihr Ergebnis nachvollziehbar bleibt.  
Vorschlag: Die laufende Sitzungskennung bis zum Entscheiden übergeben und mit dem Beschluss speichern; den Ablauf in der Bedienprobe prüfen.

5. [mittel] Gleichzeitiges Sammeln kann mit einem Eindeutigkeitsfehler enden  
Fundstelle: `supabase/migrations/20261025150500_stufe1_entscheidungen.sql:95`  
Was passiert: Zwei gleichzeitige Listenaufrufe können beide dieselbe fehlende Quelle ermitteln. Das zweite `INSERT` verletzt dann `UNIQUE (quelle_art, quelle_id)` und sein Listenaufruf scheitert. Die Probe prüft nur zwei Aufrufe nacheinander.  
Warum falsch: Abschnitt 1 und 8 verlangen idempotentes Sammeln; parallele Seitenaufrufe sind im vorgesehenen Betrieb möglich.  
Vorschlag: `INSERT ... ON CONFLICT DO NOTHING` verwenden und einen parallelen Aufruf prüfen.

6. [mittel] Die Materialklappe bezeichnet vertagte Entscheidungen als fehlend  
Fundstelle: `site/besprechung.html:228`  
Was passiert: Der Abgleich berücksichtigt nur aktuell offene `ITEMS`. Ein noch nicht wieder fälliges, vertagtes Thema bleibt in `gate_list`, fehlt aber in `ITEMS` und erscheint deshalb unter „ohne Entscheidung“.  
Warum falsch: Die Herkunft ist bereits als Entscheidung erfasst; Abschnitt 5 sieht dort nur Material ohne Entscheidung vor.  
Vorschlag: Für den Abgleich alle vorhandenen Entscheidungszeilen nach Quellkennung heranziehen.

7. [mittel] Die mobile Begrenzung auf drei Textzeilen fehlt  
Fundstelle: `site/assets/styles.css:1995`  
Was passiert: Frage, Herkunft und Vorschlag können in einer geschlossenen Zeile unbegrenzt umbrechen. Gerade bei 390 px werden damit Zeilen deutlich länger als drei Textzeilen.  
Warum falsch: Abschnitt 3 setzt diese Grenze ausdrücklich.  
Vorschlag: Die geschlossene Ansicht auf drei Zeilen begrenzen und den vollständigen Text im aufklappbaren Bereich anbieten.

8. [mittel] Eine Konstante stellt die Spielschicht nicht vollständig wieder her  
Fundstelle: `site/entscheidungen.html:52`  
Was passiert: Der frühere Abzeichenabschnitt wurde beim Umbau entfernt. `GF_SPIEL=true` lädt zwar die Spielskripte, stellt diesen Abschnitt und seine Sprungmarke aber nicht wieder her; `jahr.html` verlinkt weiterhin darauf.  
Warum falsch: Abschnitt 7 und 9 verlangen, dass eine Konstante die Spielschicht vollständig zurückschaltet.  
Vorschlag: Den Abschnitt bei aktivierter Spielschicht wieder bereitstellen und beide Schalterstellungen prüfen.

9. [mittel] Der geforderte Abschlussstand fehlt im Commit  
Fundstelle: `README.md:7`  
Was passiert: README und Technikstand verweisen auf `docs/STAND-STUFE-1.md`; die Datei existiert im geprüften Commit nicht. Damit fehlen auch die geforderten höchstens zehn Sätze als Abschlussstand.  
Warum falsch: Abschnitt 8.7 und der ursprüngliche Auftrag verlangen diese Datei.  
Vorschlag: Den Stand mit den fünf getrennten Kategorien und den belegten Zahlen erstellen; offene Backendwirkung und fachliche Annahme ausdrücklich offen lassen.

## Empfehlungen

1. Nach den Datenbankkorrekturen gezielt Nebenläufigkeit, veraltete Quellen und fehlgeschlagene Teilschritte prüfen.
2. Eine Besprechung mit echtem Sitzungsbezug bis zur Anzeige ihrer Beschlüsse durchspielen.

Die Datenbankwirkung und die Liveoberfläche konnte ich wegen des ausdrücklich untersagten Netzaufrufs nicht selbst prüfen. Ich habe keine Dateien geändert und keine Tests mit Schreibwirkung gestartet.