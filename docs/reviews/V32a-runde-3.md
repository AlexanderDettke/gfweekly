Geprüft: 32a, Commit 291dbfec51e90a953e2a085a1c42155fd514ff75, 14 Dateien

1. **[mittel] Prüfpunktentscheidung kann nach einer Neuberechnung unsichtbar werden**  
Fundstelle: `supabase/functions/gfweekly/komm.ts:280`, zusätzlich `supabase/migrations/20261007052131_hh_komm_v32a.sql:235`  
Was passiert: Die Aktion prüft zunächst, ob am angegebenen Datum ein Prüfpunkt existiert. Verschiebt eine gleichzeitige Neuberechnung anschließend diesen ungesendeten Prüfpunkt, speichert die SQL Funktion die Entscheidung trotzdem am alten Datum. Sie meldet Erfolg, während `komm_list` beim neuen Termin wieder „offen“ liefert.  
Warum falsch: 32a verlangt nachvollziehbare Prüfpunktentscheidungen. Die Transaktion schützt konkurrierende Entscheidungen, koordiniert sich aber nicht mit der Neuberechnung.  
Vorschlag: Existenz und Datum des Prüfpunkts innerhalb der Schreibtransaktion erneut prüfen und gegen dessen Verschiebung sperren. Bei inzwischen verändertem Termin 409 zurückgeben.

2. **[schwer] Fehler bei der Projektanlage kann ein zweites Asana Projekt erzeugen**  
Fundstelle: `supabase/functions/gfweekly/komm.ts:409`  
Was passiert: Jeder Fehler beim ersten Anlegen führt unmittelbar zu einem zweiten `POST /projects`, diesmal ohne Eigentümer. Wurde das erste Projekt bereits angelegt und ging lediglich die Antwort verloren, entsteht ein weiteres Projekt.  
Warum falsch: 32c verlangt idempotenten Versand. Dies ist ein schwerer Fehler im bereits eingebauten späteren Teilpaket.  
Vorschlag: Den zweiten Versuch auf eine eindeutig belegte Ablehnung des Eigentümerfelds begrenzen. Bei unklarem Ausgang zuerst nach dem möglicherweise angelegten Projekt suchen.

3. **[schwer] Ersatzprojekt erhält die bereits gespeicherten Aufgaben nicht**  
Fundstelle: `supabase/functions/gfweekly/komm.ts:330`, zusätzlich Zeilen 449 und 453  
Was passiert: Ist das bisherige Projekt archiviert, sucht der Versand ein aktives Projekt oder legt ein neues an. Anschließend verwendet er weiterhin die gespeicherten Aufgabenkennungen und aktualisiert diese Aufgaben, ohne sie dem neuen Projekt hinzuzufügen. Aufgaben im archivierten Projekt werden damit aktualisiert, während das neue Projekt als Versandziel protokolliert wird.  
Warum falsch: Der Rahmen aus 32c muss im angegebenen Kommunikationsprojekt ankommen.  
Vorschlag: Bei einem Projektwechsel vorhandene Aufgaben nicht ungeprüft übernehmen. Entweder den Wechsel ausdrücklich blockieren oder ihre Zugehörigkeit zum Zielprojekt sicherstellen und protokollieren.

4. **[schwer] Fremde Formel mit leerem Ergebnis wird überschrieben**  
Fundstelle: `supabase/functions/gfweekly/komm.ts:599`, zusätzlich `site/assets/komm-logik.js:454`  
Was passiert: Der Tabellenabgleich bewertet ausschließlich den angezeigten Zelltext. Eine fremde Formel wie `=""` ohne Kennung `komm:` gilt deshalb als leere Zelle und wird durch einen Fixtermin ersetzt.  
Warum falsch: 32d und die Grenzen verbieten das Überschreiben fremder Inhalte und Formeln. Dies ist ein schwerer Fehler im späteren Teilpaket.  
Vorschlag: Ohne eigene Kennung nur Zellen beschreiben, deren `userEnteredValue` tatsächlich keinen Inhalt enthält. Fremde Formeln unabhängig vom Anzeigewert als Konflikt melden.

**Empfehlungen**

1. Die Aktionen mit simulierten Datenbankantworten und Asana Antworten prüfen, insbesondere Terminverschiebung während einer Entscheidung, verlorene Projektantwort und archiviertes Projekt.
2. Die Tabellenprobe um eine fremde Formel mit leerem Ergebnis ergänzen.
3. SQL Proben für Berechtigungen weiterhin ausdrücklich von einer Prüfung der effektiven Produktionsrechte unterscheiden.

**Vorherige Runden**

Die Korrekturen zu den beschriebenen Befunden aus Runde 1 und Runde 2 sind nachvollziehbar implementiert. Dazu gehören die gemeinsame Festivalsperre vor dem Lesen, frische Termine unter dieser Sperre, Restschritte vergangener Veröffentlichungen und die getrennte Protokollierung der Projektanlage. Befund 1 dieser Runde betrifft einen zusätzlichen Konflikt zwischen Entscheidung und Neuberechnung.

**Prüfnachweis und Grenzen**

1. `node pruefung/komm-test.mjs`: **65 erfolgreich, 0 Fehler**. Die geforderten Lusatia Zahlen stimmen; Logikkopien und Regelwerkkopien sind bytegleich.
2. `node pruefung/komm-vergleich.mjs`: **alle fünf Festivals ohne Abweichung in den verglichenen CSV Feldern**.
3. Lokale SQL Probe mit dem angegebenen PGlite Modul: **27 erfolgreich, 0 Fehler**.

Die Aktionen aus 32a liegen hinter dem Passwortschutz. Der Anbindungsschlüssel öffnet ausschließlich die drei aufgelisteten Anbindungsaktionen. Die Migration aktiviert RLS, legt keine Policies an und entzieht `anon` sowie `authenticated` die Tabellenrechte. `hh_komm_einspielen` schreibt keine Partnerfelder oder Freigabefelder.

Die neuen Befunde beruhen auf dem Code. Produktionsmigration, effektive Produktionsrechte, Edge Laufzeit, Deploy und Livewirkung wurden nicht geprüft. Keine Dateien geändert, keine Netzwerkdienste aufgerufen und keine weiteren Prüfer gestartet.

**32a ist wegen Befund 1 noch nicht freigabefähig. Die schweren Befunde 2 bis 4 müssen vor Nutzung der späteren Aktionen behoben werden.**