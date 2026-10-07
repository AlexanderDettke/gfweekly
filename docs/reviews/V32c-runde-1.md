Geprüft: 32c, Commit dada236982402ceb7a66e671183037a75d34ff85, 23 Dateien

1. [schwer] Unterbrochener Projektwechsel verliert Aufgaben dauerhaft  
Fundstelle: `supabase/functions/gfweekly/komm.ts:418`, ergänzend Zeilen 472 und 481  
Was passiert: Nach dem ersten Versandversuch steht bereits das neue Projekt im Protokoll. Scheitert die Übernahme einer Aufgabe, erkennt der nächste Aufruf keinen Projektwechsel mehr. Er aktualisiert die gemerkte Aufgabe im alten Projekt, ohne sie ins neue aufzunehmen. Lokal reproduziert: erster Aufruf mit einem Fehler, zweiter ohne Fehler; im Zielprojekt stehen nur 59 der 60 Aufgaben.  
Warum falsch: 32c verlangt, dass der Rahmen im angegebenen Kommunikationsprojekt ankommt. Die Korrektur aus 32a Runde 3 funktioniert nur bei vollständig erfolgreicher Übernahme.  
Vorschlag: Für jede gemerkte Aufgabe ihre Zugehörigkeit zum Zielprojekt prüfen. Fehlende Übernahmen unabhängig vom letzten Projektprotokoll nachholen, vorhandene Abschnittswahl bewahren.

2. [schwer] Fortsetzungen können ohne Fortschritt denselben Anfang wiederholen  
Fundstelle: `supabase/functions/gfweekly/komm.ts:473`, ergänzend `site/kommunikation.html:398`  
Was passiert: Jeder Aufruf beginnt wieder bei der ersten Aufgabe und aktualisiert zunächst bereits bearbeitete Aufgaben. Verbrauchen diese das Zeitbudget, bleiben spätere Aufgaben dauerhaft unbearbeitet. Lokal mit gleichbleibendem simuliertem Zeitverbrauch reproduziert: drei Aufrufe aktualisieren jeweils dieselben zwölf Aufgaben und melden jeweils 55 verbleibende. Die Seite beendet nach acht Runden und meldet dennoch „Rahmen … gesendet“. Die vorhandene Probe entfernt das knappe Budget vor der Fortsetzung und erfasst diesen Fall nicht.  
Warum falsch: Der echte Versand aus 32c muss vollständig ausführbar sein. Wiederholungen dürfen nicht dauerhaft vor den fehlenden Aufgaben stehen bleiben.  
Vorschlag: Einen Versandlauf mit Fortschritt führen und bei der nächsten unbearbeiteten Aufgabe fortsetzen. Nach acht unvollständigen Runden ausdrücklich „Versand unvollständig“ melden.

3. [schwer] Abgelaufene Sperre erlaubt parallelen Versand und Dubletten  
Fundstelle: `supabase/functions/gfweekly/komm.ts:322`, ergänzend Zeilen 384 und 475 sowie `supabase/migrations/20261007052131_hh_komm_v32a.sql:220`  
Was passiert: Die Sperre verfällt nach 180 Sekunden. Asana Anfragen besitzen keine Zeitbegrenzung; das Zeitbudget wird erst zwischen Aufgaben geprüft. Ein weiterlaufender Aufruf prüft weder Sperrbesitz noch Ablauf. Nach Ablauf kann ein zweiter Aufruf ebenfalls senden. Lokal mit angehaltener erster Aufgabenanlage und gezielt abgelaufener Sperre reproduziert: beide Aufrufe antworten mit 200 und legen zusammen 120 Aufgaben mit nur 60 unterschiedlichen Namen an.  
Warum falsch: Das verletzt die Idempotenz aus 32c und öffnet den Parallelitätsfehler aus 32a erneut bei langen oder hängenden Anfragen.  
Vorschlag: Anfragen innerhalb der verbleibenden Sperrzeit begrenzen, Sperren kontrolliert verlängern und vor weiteren Änderungen den Besitz prüfen. Unklare Aufgabenanlagen vor einer Wiederholung abgleichen.

4. [mittel] Aufräumen verliert fehlgeschlagen gelöschte Testaufgaben  
Fundstelle: `supabase/functions/gfweekly/komm.ts:528`, ergänzend Zeile 531  
Was passiert: Scheitert das Löschen einer Aufgabe, wird das Projekt trotzdem gelöscht. Die Aufgabe bleibt bestehen, ihre Kennung wird nicht dauerhaft zum Nachholen gespeichert. Lokal reproduziert: erster Aufruf löscht 65 Aufgaben und das Projekt, meldet einen Fehler. Der zweite meldet `ok: true`, obwohl die verbliebene Aufgabe weiterhin existiert.  
Warum falsch: Die Abnahme verlangt ein aufgeräumtes Testprojekt. Laut Technikstand sollen auch keine Aufgaben in „Meine Aufgaben“ zurückbleiben.  
Vorschlag: Das Projekt bei fehlgeschlagenen Aufgabenlöschungen erhalten. Zusätzlich die erzeugten Testaufgabenkennungen speichern und das Aufräumen daran wiederholbar machen.

5. [mittel] Ratenlimit wird vor Ablauf der vorgegebenen Wartezeit erneut angefragt  
Fundstelle: `supabase/functions/gfweekly/komm.ts:328`, ergänzend Zeilen 494 bis 497  
Was passiert: `Retry-After` wird auf höchstens zehn Sekunden gekürzt. Bei beispielsweise 60 Sekunden erfolgt die Wiederholung bereits nach zehn Sekunden. Scheitert sie erneut, arbeitet der Versand weitere Aufgaben ab und erzeugt zusätzliche Anfragen.  
Warum falsch: Die Fehlerbehandlung berücksichtigt die vom Dienst verlangte Wartezeit nicht. Dadurch können viele Aufgaben scheitern und der Versand unnötig lange laufen.  
Vorschlag: Die angegebene Wartezeit respektieren. Passt sie nicht in das verbleibende Budget, den gesamten Lauf geordnet unterbrechen und einen frühesten Fortsetzungszeitpunkt zurückgeben.

**Empfehlungen**

1. Die vier lokal reproduzierten Fehlerfälle dauerhaft in die Aktionsprobe aufnehmen, insbesondere wiederholt knappes Zeitbudget und Sperrablauf während einer offenen Anfrage.
2. Versandberichte um erfolgreich bearbeitete Aufgabenkennungen ergänzen, damit Fortsetzungen und Fehler nachvollziehbar bleiben.
3. Den Technikstand aktualisieren: Die vorhandene Aktionsprobe liefert aktuell 66 erfolgreiche Prüfungen, dort stehen 62.

**Prüfnachweis und Grenzen**

1. `node pruefung/komm-test.mjs`: **67 erfolgreich, 0 Fehler**.
2. Aktionsprobe mit vorhandenem lokalem Deno und PGlite, ohne Netzwerkberechtigung: **66 erfolgreich, 0 Fehler**.
3. Zusätzliche Fehlerproben ausschließlich im Arbeitsspeicher durchgeführt. Keine Dateien geändert.
4. Die früheren Korrekturen sind im normalen Versandweg nachvollziehbar: gemeinsame Festivalsperre, atomare Speicherung von Kennung und erstem Sendedatum, getrenntes Projektprotokoll sowie Aktualisierung vorhandener Aufgaben ausschließlich über Fälligkeit und Beschreibung. Zuständigkeit, Unteraufgaben und Kommentare werden dabei nicht überschrieben.
5. Aufgabenklassen, Monatsbündel, Briefing, Schrittliste und Prüfpunktlinks entsprechen im Code dem verlangten Rahmen. Passwortschutz und Beschränkung auf die Rollenangabe Alex oder Lea sind vorhanden.
6. Livewirkung, effektive Produktionsrechte und tatsächliche Darstellung der Beschreibung in Asana wurden nicht erneut geprüft. Der dokumentierte Test bei Alex belegt keine echte Übergabe an Christian. Keine externen Dienste und keine weiteren Prüfer aufgerufen.

**32c ist wegen der schweren Befunde noch nicht freigabefähig. Den echten Versand für die fünf Festivals erst nach deren Behebung ausführen.**