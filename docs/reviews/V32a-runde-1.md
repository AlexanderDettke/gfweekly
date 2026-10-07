Geprüft: 32a, Commit a845881665000e5bde4229dff94457b3d884c723, 8 Dateien

1. [schwer] Bereits versendete Beiträge können nach einem Teilfehler verändert oder gelöscht werden  
Fundstelle: `supabase/migrations/20261007052131_hh_komm_v32a.sql:142`, zusätzlich `komm.ts:411`  
Was passiert: Der Versand speichert `asana_task_gid` und `gesendet_am` in zwei getrennten Datenbankaufrufen. Gelingt nur der erste, behandelt `hh_komm_einspielen` den bereits extern angelegten Beitrag weiterhin als ungesendet. Plan, Briefing und Schritte können überschrieben werden; entfällt die Veröffentlichung, kann Zeile 185 sie löschen.  
Warum falsch: 32a verlangt, gesendete Veröffentlichungen zu erhalten und Terminänderungen als `zu_pruefen` zu kennzeichnen.  
Vorschlag: Auch eine vorhandene `asana_task_gid` als Schutzmerkmal behandeln. Kennung und Sendedatum gemeinsam speichern und diesen Teilfehler gezielt prüfen.

2. [schwer] Gleichzeitiger Versand kann doppelte Projekte und Aufgaben erzeugen  
Fundstelle: `supabase/functions/gfweekly/komm.ts:341`, zusätzlich Zeilen 379 und 398  
Was passiert: Zwei gleichzeitige Aufrufe können beide kein Projekt beziehungsweise keine vorhandene Aufgabe finden und anschließend beide neu anlegen. Es gibt keine gemeinsame Versandsperre; die lokalen Maps schützen nur innerhalb eines Aufrufs.  
Warum falsch: 32c verlangt idempotenten Versand. Dies ist ein schwerer Befund im bereits eingebauten späteren Teilpaket.  
Vorschlag: Versand je Festival durch eine atomar erworbene, zeitlich begrenzte Datenbanksperre absichern. Einen zweiten laufenden Versand mit einem Konfliktstatus beantworten.

3. [mittel] Wochenlast verliert laufende Arbeit nach dem Veröffentlichungstag  
Fundstelle: `supabase/functions/gfweekly/komm.ts:167`, zusätzlich Zeile 169  
Was passiert: Für die Wochenlast werden nur Veröffentlichungen mit künftigem T verwendet. Bereits gestartete Anzeigenkampagnen verschwinden dadurch einschließlich ihrer wöchentlichen Kontrollen. Ebenso entfallen noch bevorstehende Auswertungen und Betreuungsschritte vergangener Beiträge.  
Warum falsch: 32a verlangt eine belastbare Wochenlast. Der Veröffentlichungszeitpunkt beendet die Arbeit laut Regelwerk nicht.  
Vorschlag: Die Auswahl für kommende Veröffentlichungen von der Auswahl für Arbeitslast trennen. Für die Last gespeicherte Schritte berücksichtigen, deren Arbeitszeitraum noch relevant ist.

4. [mittel] Wochenlast schneidet Aftermovie Arbeit ab  
Fundstelle: `supabase/functions/gfweekly/komm.ts:213`  
Was passiert: Der Horizont endet 31 Tage nach dem letzten Festivalende. Das Regelwerk plant Aftermovies dagegen bei Z+60, einschließlich ihrer Produktionsschritte. Mit den Referenzterminen endet die Last am 29.09.2027, obwohl beispielsweise Fluiditys Aftermovie am 28.10.2027 liegt.  
Warum falsch: Die Wochenlast aus 32a bildet damit einen Teil der berechneten Arbeit nicht ab.  
Vorschlag: Den Horizont aus den spätesten Schrittterminen und Wochenaufgaben ableiten.

5. [mittel] Versandstatus verschwindet durch die Begrenzung des Protokolls  
Fundstelle: `supabase/functions/gfweekly/komm.ts:153`, zusätzlich Zeilen 172 und 184  
Was passiert: `komm_list` lädt nur die letzten 200 Protokolleinträge und sucht darin den letzten Versand. Nach genügend täglichen Berechnungen und weiteren Einträgen wird `rahmen` wieder `null`, obwohl Veröffentlichungen weiterhin als gesendet gespeichert sind. Auch `berechnet_am` kann dadurch fehlen.  
Warum falsch: Die Kennzahlen aus 32a dürfen einen vorhandenen Versand nicht allein wegen seines Alters verlieren.  
Vorschlag: Den letzten relevanten Eintrag je Festival gezielt abfragen. Die Begrenzung auf 200 Einträge nur für den sichtbaren Verlauf verwenden.

6. [mittel] Prüfpunktentscheidungen verlieren den Namen der verantwortlichen Person  
Fundstelle: `supabase/functions/gfweekly/komm.ts:233`  
Was passiert: `whoNorm` macht aus Christian und sämtlichen anderen Namen außerhalb Alex und Lea den Wert `Team`. Dieser wird als `entschieden_von` und im Protokoll gespeichert.  
Warum falsch: Zuständigkeit und Entscheidungsverlauf sind zentrale Anforderungen des Pakets. Die erlaubte Entscheidung einer Kommunikationsleitung wird dadurch nicht mehr dieser Person zugeordnet.  
Vorschlag: Die Prüfung der besonderen Rechte von der Speicherung des Namens trennen. Den bestätigten Personennamen erhalten.

7. [mittel] Gleichzeitige Prüfpunktänderungen erzeugen einen unzutreffenden Verlauf  
Fundstelle: `supabase/functions/gfweekly/komm.ts:253`  
Was passiert: Vorzustand lesen, Entscheidung schreiben und Protokoll schreiben erfolgen getrennt. Lesen Alex und Lea gleichzeitig denselben Vorzustand, überschreibt der zweite Aufruf die erste Entscheidung. Beide Protokolle können trotzdem denselben alten Zustand als `vorher` nennen.  
Warum falsch: Der Prüfauftrag verlangt einen nachvollziehbaren Verlauf auch bei gleichzeitigen Änderungen. Der tatsächliche Übergang zwischen den Entscheidungen fehlt.  
Vorschlag: Vorzustand, Änderung und Protokoll innerhalb einer Transaktion mit Zeilensperre ausführen oder veraltete Änderungen über eine Versionsprüfung zurückweisen.

**Empfehlungen**

1. Wochenlast mit laufenden Anzeigen, Nachbereitung und Aftermovies ausdrücklich testen. Die vorhandenen 57 Proben enthalten keine Prüfung von `wochenlast`.
2. `service_role` die erforderlichen Tabellenrechte, Sequenzrechte und das Ausführungsrecht für `hh_komm_einspielen` explizit erteilen. Die Migration verlässt sich dafür auf nicht lokal belegte Standardrechte.
3. Aktivierung des Regelwerks atomar ausführen. Derzeit sind Deaktivierung und Einfügen getrennt; Fehler und parallele Versionswechsel können einen inkonsistenten Zustand hinterlassen.
4. Den dokumentierten Vergleich aller fünf Festivals als reproduzierbare lokale Prüfung ins Repo aufnehmen.

**Prüfnachweis und Grenzen**

`node pruefung/komm-test.mjs`: **57 erfolgreich, 0 Fehler**. Der Lusatia Vergleich belegt die geforderten Zahlen und die verglichenen CSV Felder. Die bewusste Slotabweichung ist nachvollziehbar; die beiden Logikkopien und Regelwerkkopien sind bytegleich.

Die drei Aktionen aus 32a liegen hinter dem Passwortschutz. Der Anbindungsschlüssel erlaubt ausschließlich die drei ausdrücklich aufgelisteten Aktionen. Die Migration aktiviert RLS für alle fünf Tabellen, legt keine Policies an und schreibt in `hh_komm_einspielen` keine Partnerfelder oder Freigabefelder.

Migration, effektive Datenbankrechte, Deno Laufzeit, Deploy und Wirkungsprobe wurden nicht ausgeführt. Die Befunde zur Speicherung und Parallelität beruhen auf dem Code. Keine Dateien geändert, keine Netzwerkdienste aufgerufen, keine weiteren Prüfer gestartet. **32a ist wegen der Befunde noch nicht freigabefähig.**