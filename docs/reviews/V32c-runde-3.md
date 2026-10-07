Geprüft: 32c, Commit 0ab5bad8a89fddfdc24df492b5681a7572f3269a, 29 Dateien

1. [schwer] Unklare Aufgabenanlage kann beim Folgeaufruf weiterhin eine Dublette erzeugen  
Fundstelle: `supabase/functions/gfweekly/komm.ts:556`, ergänzend Zeilen 498, 529 und 546  
Was passiert: Der unklare Ausgang wird nicht dauerhaft an der betroffenen Aufgabe gespeichert. Fehlt die bereits angelegte Aufgabe beim nächsten Lesen noch in der Projektliste, legt die Fortsetzung sie erneut an. Lokal mit verlorener Antwort und einmalig verzögerter Sichtbarkeit simuliert: zwei gleichnamige Prüfpunktaufgaben; der Folgeaufruf meldet abgeschlossen und keine Fehler.  
Warum falsch: Die Idempotenz aus 32c bleibt verletzt. Runde 2, Befund 1 ist für sofort sichtbare Aufgaben behoben, für einen zunächst leeren Abgleich weiterhin offen. Ein leeres Suchergebnis klärt eine möglicherweise noch laufende Anlage nicht zuverlässig.  
Vorschlag: Unklare Anlagen dauerhaft je Aufgabe und Zielprojekt festhalten. Eine erneute Anlage erst nach belastbarer Klärung zulassen; ungeklärte Fälle ausdrücklich als offen führen.

2. [schwer] Fortschritt wird weiterhin ohne atomare Prüfung des Sperrbesitzes geschrieben  
Fundstelle: `supabase/functions/gfweekly/komm.ts:512`, ergänzend Zeilen 513 bis 515  
Was passiert: Sperre prüfen und Fortschritt schreiben sind zwei getrennte Datenbankaufrufe. Verliert der erste Lauf zwischen beiden seine Sperre, kann sein verspätetes `upsert` den Nachfolger überschreiben. Lokal durch angehaltene Fortschrittsspeicherung reproduziert: Der Nachfolger hatte vollständig abgeschlossen und 61 erledigte Aufgaben gespeichert. Danach setzte der abgelöste Lauf den Stand auf nicht abgeschlossen und null erledigte Aufgaben zurück.  
Warum falsch: Runde 2, Befund 2 verlangte ausdrücklich eine atomare Speicherung unter gültigem Sperrbesitz. Die erneute Prüfung vor dem Schreiben schließt das Zeitfenster nicht.  
Vorschlag: Sperrprüfung und Fortschrittsspeicherung in einer gemeinsamen SQL Funktion ausführen, koordiniert über dieselbe Sperrzeile. Ein abgelöster Lauf darf keinen Fortschritt mehr ändern.

3. [schwer] Fehlgeschlagene Abschnittsanlage hinterlässt dauerhaft falsch einsortierte Aufgaben  
Fundstelle: `supabase/functions/gfweekly/komm.ts:490`, ergänzend Zeilen 545 bis 547 und 584  
Was passiert: Scheitert eine Monatsabschnittsanlage, läuft der Versand weiter und legt die betroffenen Aufgaben ohne Abschnitt an. Lokal mit einmaligem Fehler 503 reproduziert: Eine Aufgabe blieb ohne Monatsabschnitt. Beim erneuten Senden wurde der Abschnitt angelegt, die Aufgabe blieb jedoch außerhalb. Der zweite Bericht meldete abgeschlossen und keine Fehler.  
Warum falsch: 32c verlangt Abschnitte je Monat. Die reguläre Wiederholung repariert diesen eigenen Versandfehler nicht, weil bereits vorhandene Abschnittswahlen erhalten bleiben.  
Vorschlag: Aufgaben eines Monats erst anlegen, wenn dessen Abschnitt erfolgreich vorhanden ist. Bei fehlendem Abschnitt diesen Teil unvollständig lassen und später fortsetzen. Damit bleibt eine nachträgliche Änderung fremder Abschnittswahlen unnötig.

4. [mittel] Fehlgeschlagene Eigentumsübertragung wird nicht nachgeholt  
Fundstelle: `supabase/functions/gfweekly/komm.ts:465`, ergänzend Zeilen 474 bis 476  
Was passiert: Nach Ablehnung des Feldes `owner` wird das Projekt ohne Eigentümer angelegt. Scheitert auch die anschließende Übertragung, bleibt lediglich ein Fehler im ersten Bericht. Weitere Aufrufe aktualisieren nur die Projektbeschreibung. Lokal reproduziert: Eigentum blieb ungesetzt; der zweite Versand meldete abgeschlossen und keine Fehler.  
Warum falsch: 32c verlangt Projekteigentum bei der verantwortlichen Person. Ein vorübergehender Fehler wird dauerhaft übergangen.  
Vorschlag: Eine noch ausstehende initiale Eigentumsübertragung speichern und gezielt nachholen. Bis dahin die Übergabe als unvollständig kennzeichnen. Spätere bewusste Eigentumsänderungen nicht überschreiben.

5. [mittel] Ratenlimits außerhalb der Aufgabenschleife umgehen die gespeicherte Wartezeit  
Fundstelle: `supabase/functions/gfweekly/komm.ts:481`, ergänzend Zeilen 490, 499 und 553  
Was passiert: Nur Fehler 429 innerhalb der Aufgabenschleife speichern `fortsetzen_ab`. Im Vorlauf wird die Wartezeit verworfen oder lediglich als Fehlertext gemeldet. Lokal beim Lesen der Abschnitte reproduziert: `Retry-After: 120`, erster Aufruf 502, unmittelbarer Folgeaufruf mit 65 weiteren Asana Anfragen; gespeicherter Fortsetzungszeitpunkt weiterhin leer.  
Warum falsch: Runde 2, Befund 5 ist nur für Aufgabenanfragen behoben. Wiederholungen können die verlangte Pause weiterhin unterschreiten.  
Vorschlag: Ratenlimits für sämtliche Asana Anfragen eines Versands zentral behandeln, den frühesten Fortsetzungszeitpunkt speichern und den gesamten Lauf unterbrechen.

**Empfehlungen**

1. Die fünf zusätzlichen Fehlerfälle dauerhaft in die Aktionsprobe aufnehmen.
2. Einen vollständigen Versandabschluss auch von Abschnittsanlage und initialer Eigentumsübertragung abhängig machen.
3. Den dokumentierten Asana Test vor dem echten Versand mit dem korrigierten Stand wiederholen und den genauen Commit im Technikstand nennen.

**Vorherige Runden**

Runde 2, Befunde 3 und 4 sind in Code und Probe behoben: Projektwechsel startet eine vollständige Zugehörigkeitsprüfung; Aufgaben gelten erst nach erfolgreicher Kennungsspeicherung als erledigt. Befunde 1, 2 und 5 bleiben in den oben beschriebenen Fällen teilweise offen.

Die früheren Schutzmaßnahmen aus 32a und 32b bestehen im regulären Versandweg weiterhin: gemeinsame Festivalsperre vor dem Lesen, atomare Speicherung von Kennung und erstem Sendedatum, getrenntes Projektprotokoll, sichtbare Fehlerberichte und ausdrückliche Meldung unvollständiger Fortsetzungen. Vorhandene Aufgaben erhalten regulär ausschließlich neue Fälligkeit und Beschreibung. Zuständigkeit, Unteraufgaben, Kommentare und vorhandene Abschnittswahl werden dabei nicht überschrieben.

Aufgabenklassen, Monatsbündel, Briefing, Schrittliste und Prüfpunktlinks entsprechen dem verlangten Rahmen.

**Prüfnachweis und Grenzen**

1. `node pruefung/komm-test.mjs`: **70 erfolgreich, 0 Fehler**.
2. Aktionsprobe mit lokalem Deno und PGlite, ohne Netzwerkberechtigung: **95 erfolgreich, 0 Fehler**.
3. Alle fünf zusätzlichen Fehlerfälle ausschließlich im Arbeitsspeicher lokal reproduziert. Keine Dateien geändert; Arbeitsverzeichnis weiterhin sauber.
4. Passwortschutz und Rollenprüfung über `by` sind vorhanden. Eine personenbezogene Authentifizierung von Alex oder Lea ist damit weiterhin nicht belegt. Die Migrationen aktivieren RLS und entziehen `anon` sowie `authenticated` die betreffenden Rechte.
5. Produktionswirkung, effektive Produktionsrechte, aktuelle Asana Darstellung und dynamische Oberflächenbedienung wurden nicht geprüft. Der dokumentierte Test lief laut Antwortdatei mit `aa68031`, vor der neuen Fortschrittslogik.
6. Keine externen Dienste aufgerufen und keine weiteren Prüfer gestartet.

**32c ist noch nicht freigabefähig. Den echten Versand an Christian erst nach Behebung der schweren Befunde ausführen.**