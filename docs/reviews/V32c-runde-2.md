Geprüft: 32c, Commit 518d25d06f6a0593edb705e765f9c16543ef37a5, 27 Dateien

1. [schwer] Fehlgeschlagener Abgleich nach verlorener Antwort erzeugt Dubletten  
Fundstelle: `supabase/functions/gfweekly/komm.ts:540`, ergänzend Zeilen 543 bis 545  
Was passiert: Nach einer Aufgabenanlage mit verlorener Antwort sucht der Versand die Aufgabe im Projekt. Scheitert auch diese Suche, wird der Fehler verschluckt und unmittelbar erneut angelegt. Lokal reproduziert: Die erste Anlage war erfolgreich, ihre Antwort ging verloren, der anschließende Abgleich scheiterte. Ergebnis: 62 Aufgaben mit 61 unterschiedlichen Namen, Antwort 200 ohne Fehler.  
Warum falsch: 32c verlangt idempotenten Versand. Ein fehlgeschlagener Abgleich beweist nicht, dass die erste Anlage ausgeblieben ist.  
Vorschlag: Bei unklarem Ausgang und gescheitertem Abgleich den Versand unterbrechen. Eine weitere Anlage erst nach erfolgreicher Klärung zulassen. Auch einen zunächst leeren Abgleich nach unklarer Anlage vorsichtig behandeln.

2. [schwer] Sperrverlust verhindert eine zweite Projektanlage weiterhin nicht  
Fundstelle: `supabase/functions/gfweekly/komm.ts:444`, ergänzend Zeilen 446 bis 447 und 568  
Was passiert: Die Sperre wird vor `teamFinden()` geprüft. Nach dieser zusätzlichen Anfrage wird das Projekt ohne erneute Prüfung angelegt. Lokal reproduziert: Erster Aufruf wartet in der Teamsuche, Sperre wird gezielt abgelaufen, zweiter Aufruf übernimmt und legt das Projekt an. Anschließend legt der erste Aufruf ein zweites gleichnamiges Projekt an und bricht erst bei der Abschnittsanlage ab. Ergebnis: zwei aktive Projekte, Antworten 502 und 200. Außerdem überschreibt ein Aufruf nach erkanntem Sperrverlust weiterhin den Versandfortschritt. In der bestehenden Sperrprobe steht nach dem erfolgreich abgeschlossenen zweiten Aufruf wieder `abgeschlossen: false` mit null erledigten Aufgaben.  
Warum falsch: Die Idempotenz aus 32c und Befund 3 aus Runde 1 sind damit nur teilweise abgesichert. Ein abgelöster Aufruf darf weder neue Projekte anlegen noch den Fortschritt seines Nachfolgers zurücksetzen.  
Vorschlag: Sperrbesitz unmittelbar vor jeder externen Änderung prüfen, einschließlich weiterer Versuche und Projektänderungen. Fortschritt atomar nur unter gültigem Sperrbesitz speichern. Nach Sperrverlust keine abschließende Fortschrittsänderung ausführen.

3. [schwer] Projektwechsel während einer Fortsetzung lässt Aufgaben zurück  
Fundstelle: `supabase/functions/gfweekly/komm.ts:495`, ergänzend Zeile 506; `supabase/migrations/20261007073224_hh_komm_v32c.sql:5`  
Was passiert: Der Versandlauf speichert erledigte Aufgabennamen, aber kein Zielprojekt. Wird das Projekt zwischen zwei Teilen archiviert, findet oder erstellt die Fortsetzung ein Ersatzprojekt. Bereits erledigte Aufgaben werden vor der Zugehörigkeitsprüfung herausgefiltert und deshalb nicht übernommen. Lokal reproduziert: Nach einer bearbeiteten Aufgabe wurde das Projekt archiviert. Im Ersatzprojekt standen anschließend 67 von 68 Aufgaben; die Antwort meldete `weiter: false` ohne Fehler.  
Warum falsch: 32c verlangt den vollständigen Rahmen im Zielprojekt. Die Korrektur zu Runde 1, Befund 1 greift nicht für Aufgaben, die der neue Fortschrittsfilter überspringt.  
Vorschlag: Versandläufe an das Zielprojekt binden. Bei Projektwechsel die Zugehörigkeit sämtlicher Rahmenaufgaben erneut prüfen und fehlende Übernahmen nachholen, einschließlich bereits erledigter Aufgaben.

4. [schwer] Fehlgeschlagene Kennungsspeicherung wird bei Fortsetzung übersprungen  
Fundstelle: `supabase/functions/gfweekly/komm.ts:558`, ergänzend Zeilen 561 bis 566  
Was passiert: Eine Aufgabe gilt bereits als erledigt, bevor `hh_komm_gesendet` erfolgreich war. Scheitert dieser Datenbankaufruf, bleibt ihr Name trotzdem im gespeicherten Fortschritt. Die Fortsetzung überspringt sie. Lokal reproduziert: Nach einem einmaligen Speicherfehler und knappem Zeitbudget lief die Fortsetzung ohne Fehler zu Ende. Zwei Veröffentlichungen des bereits angelegten Monatsbündels hatten weiterhin weder Versandkennung noch Sendedatum.  
Warum falsch: Dadurch fehlt der Schutz gesendeter Veröffentlichungen aus 32a. Eine Neuberechnung darf diese extern bereits übergebenen Beiträge wieder verändern oder entfernen. Der spätere fehlerfreie Abschluss verdeckt zudem den offenen Speicherfehler.  
Vorschlag: Aufgaben erst nach erfolgreicher Speicherung aller zugehörigen Veröffentlichungen als erledigt markieren. Bei Speicherfehlern die Kennung für eine gezielte Nachholung erhalten. Speicherung und Fortschrittsänderung möglichst gemeinsam transaktional ausführen.

5. [mittel] Frühester Fortsetzungszeitpunkt wird nicht durchgesetzt  
Fundstelle: `supabase/functions/gfweekly/komm.ts:538`, ergänzend Zeilen 499 bis 500; `pruefung/komm-aktionen-probe.ts:407`  
Was passiert: Bei einem langen Ratenlimit wird `fortsetzen_ab` zurückgegeben, aber nicht gespeichert oder beim nächsten Aufruf geprüft. Die Probe setzt unmittelbar fort und erwartet Erfolg. Lokal reproduziert: Trotz noch rund 120 Sekunden verbleibender Wartezeit führte ein sofortiger Folgeaufruf 64 weitere Asana Anfragen aus und aktualisierte 60 Aufgaben.  
Warum falsch: Runde 1, Befund 5 ist innerhalb eines Aufrufs verbessert, über wiederholte Aufrufe hinweg aber weiterhin offen. Erneutes Senden kann die verlangte Wartezeit unterschreiten.  
Vorschlag: Den frühesten Fortsetzungszeitpunkt dauerhaft speichern und serverseitig prüfen. Vor dessen Ablauf ohne Asana Anfrage antworten. Den Zeitpunkt auch in der Oberfläche anzeigen.

**Empfehlungen**

1. Die fünf reproduzierten Fehlerfälle dauerhaft in Abschnitt 13 aufnehmen. Beim Sperrtest zusätzlich den gespeicherten Fortschritt prüfen.
2. Den Abschluss aus tatsächlich vollständig bearbeiteten und gespeicherten Rahmenaufgaben ableiten.
3. Versandläufe mit Zielprojekt und einer Version des übergebenen Rahmens verknüpfen.
4. Den dokumentierten Asana Test eindeutig einem Commit zuordnen. Die dort genannten wiederholten Aktualisierungen belegen keinen Lauf der neuen Fortschrittslogik.

**Vorherige Runden**

Die normalen Fälle aus Runde 1 sind verbessert: Wiederholt knappes Budget kommt voran, fehlende Projektzugehörigkeit wird nachgeholt, eine fehlgeschlagene Aufgabenlöschung erhält das Testprojekt, und lange Ratenlimits unterbrechen den Aufgabenversand. Die Befunde oben zeigen verbleibende Lücken.

Die früheren Korrekturen aus 32a und 32b sind im normalen Versandweg weiterhin vorhanden: gemeinsame Festivalsperre vor dem Lesen, atomare Speicherung von Kennung und erstem Sendedatum, getrenntes Projektprotokoll, Anzeige von Versandfehlern sowie ausdrückliche Meldung nach acht unvollständigen Teilen.

Aufgabenklassen, Monatsbündel, Briefing, Schrittliste und Prüfpunktlinks entsprechen im Code dem verlangten Rahmen. Vorhandene Aufgaben werden regulär ausschließlich hinsichtlich Fälligkeit und Beschreibung aktualisiert. Zuständigkeit, Unteraufgaben, Kommentare und vorhandene Abschnittswahl werden dabei nicht überschrieben.

**Prüfnachweis und Grenzen**

1. `node pruefung/komm-test.mjs`: **67 erfolgreich, 0 Fehler**.
2. Aktionsprobe mit vorhandenem lokalem Deno und PGlite, ausdrücklich ohne Netzwerkberechtigung: **78 erfolgreich, 0 Fehler**.
3. Zusätzliche Fehlerproben ausschließlich im Arbeitsspeicher durchgeführt. Alle beschriebenen Fehler lokal reproduziert.
4. Passwortschutz und Rollenprüfung über `by` sind vorhanden. Eine personenbezogene Authentifizierung von Alex oder Lea ist dadurch nicht belegt. Die Migrationen aktivieren RLS und entziehen `anon` und `authenticated` die betreffenden Rechte.
5. Produktionswirkung, effektive Produktionsrechte, aktuelle Darstellung in Asana und dynamische Bedienung der Seite wurden nicht erneut geprüft. Der dokumentierte Test bei Alex belegt keine Übergabe an Christian.
6. Keine Dateien geändert, keine externen Dienste aufgerufen, keine weiteren Prüfer gestartet.

**32c ist noch nicht freigabefähig. Den echten Versand für die fünf Festivals erst nach Behebung der schweren Befunde ausführen.**