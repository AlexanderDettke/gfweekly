Geprüft: 32a, Commit 3789c3d5828f4fd299bb323100d1f44a072f691e, 11 Dateien

1. **[schwer] Neuberechnung kann einen laufenden Versand unbemerkt verändern**  
Fundstelle: `supabase/functions/gfweekly/komm.ts:346`, zusätzlich Zeilen 367 und 442; `supabase/migrations/20261007052131_hh_komm_v32a.sql:127`  
Was passiert: Der Versand liest Veröffentlichungen vor Erwerb seiner Sperre. Die Neuberechnung verwendet eine unabhängige Sperre. Während Asana den alten Termin erhält, kann `hh_komm_einspielen` die noch unmarkierte Veröffentlichung auf einen neuen Termin ändern oder löschen. Anschließend speichert `hh_komm_gesendet` lediglich Kennung und Sendedatum. Bei einer Änderung unterscheiden sich Datenbank und Asana ohne `zu_pruefen`; nach einer Löschung liefert die Speicherung null aktualisierte Zeilen, was der Versand nicht kontrolliert.  
Warum falsch: 32a verlangt, extern gesendete Veröffentlichungen zu erhalten und Terminverschiebungen sichtbar zu kennzeichnen. Die Korrektur aus Runde 1 schützt gespeicherte Versandmerkmale, aber nicht diesen Zeitraum.  
Vorschlag: Versand und Berechnung je Festival gemeinsam koordinieren, vor dem Lesen sperren und beim Speichern die tatsächlich versendete Fassung sowie die Anzahl aktualisierter Zeilen prüfen.

2. **[mittel] Eine ältere Berechnung kann einen neueren Plan überschreiben**  
Fundstelle: `supabase/functions/gfweekly/komm.ts:131`, zusätzlich Zeile 140; `supabase/migrations/20261007052131_hh_komm_v32a.sql:127`  
Was passiert: Ein Gesamtlauf liest alle Festivaltermine einmal vor seiner Schleife. Ändert sich danach ein Termin und spielt ein zweiter Aufruf die neue Berechnung ein, kann der Gesamtlauf anschließend seine ältere Berechnung speichern. Die SQL Sperre ordnet nur die Schreibvorgänge; sie erkennt veraltete Eingangsdaten nicht. Offene Termine können zurückspringen, bei gesendeten Beiträgen kann `t_neu` wieder einen alten Vorschlag enthalten.  
Warum falsch: Laut 32a und Quellenabschnitt muss der Plan auf den aktuellen Plattformterminen beruhen. Gleichzeitige Aufrufe dürfen einen neueren Stand nicht unbemerkt zurücksetzen.  
Vorschlag: Die verwendeten Termine oder eine Quellversion mitgeben und innerhalb der Transaktion gegen den aktuellen Stand prüfen. Veraltete Ergebnisse zurückweisen und frisch berechnen.

3. **[mittel] Wochenlast bleibt beim ersten Berechnen nach T unvollständig**  
Fundstelle: `site/assets/komm-logik.js:197`; `supabase/functions/gfweekly/komm.ts:189`; `pruefung/komm-test.mjs:188`  
Was passiert: Vergangene Veröffentlichungen werden entfernt, bevor ihre Schritte entstehen. Die korrigierte Wochenlast berücksichtigt deren verbleibende Arbeit nur, wenn die Veröffentlichung früher gespeichert wurde. Konkretes Beispiel: Beim dokumentierten ersten Lauf am 07.10.2026 fehlt Draußenbandes `V-START` vom 01.10.2026 einschließlich des Schritts N2 am 08.10.2026. Auch eine erstmals während ihrer Laufzeit berechnete Anzeigenkampagne verliert ihre zukünftigen Kontrollen. Die neue Probe übergibt dagegen eine bereits vor T erzeugte Kampagne direkt an `wochenlast`.  
Warum falsch: Die Wochenlast aus 32a soll die noch anstehende Arbeit abbilden. Runde 1, Befund 3 ist für vorhandene Daten behoben, für den erstmaligen Aufbau nur teilweise.  
Vorschlag: Verbleibende Schritte vergangener Veröffentlichungen gesondert für die Last berechnen. Vergangene Veröffentlichungen dabei weiterhin aus Versand und Vorschau ausschließen. Den Erstlauf nach T ausdrücklich testen.

4. **[mittel] Projektanlage erscheint bereits als gesendeter Rahmen**  
Fundstelle: `supabase/functions/gfweekly/komm.ts:158`, zusätzlich Zeilen 204 und 390  
Was passiert: Direkt nach der Projektanlage entsteht ein `komm_send` Eintrag mit Projektkennung, aber ohne versendete Aufgaben. Scheitert danach beispielsweise das Lesen der Abschnitte, verwendet `komm_list` diesen Eintrag trotzdem als `rahmen.gesendet_am`. Dabei erscheinen `weiter: false` und null Fehler, obwohl noch keine Aufgabe übergeben wurde.  
Warum falsch: Die Statusauskunft darf Vorbereitung und erfolgreichen Versand nicht gleichsetzen. Das betrifft die von 32a gelieferten Kennzahlen.  
Vorschlag: Projektanlage und Versandabschluss unterscheiden. Einen abgebrochenen oder unvollständigen Versand ausdrücklich ausweisen und den Erfolgsstatus erst aus einem abgeschlossenen Versandbericht ableiten.

**Empfehlungen**

1. Die korrigierten SQL Funktionen mit gezielten Proben für wiederholte Aufrufe, Parallelität und Teilfehler prüfen. Die 63 aktuellen Proben testen weder diese Funktionen noch die Aktionen der Edge Function.
2. Dem Vergleichsskript eine Variante ohne temporäre Dateien geben, damit es auch in einer ausschließlich lesenden Prüfumgebung ausführbar ist.

**Runde 1**

Die ursprünglichen Fehlerfälle der Befunde 1, 2, 4, 5, 6 und 7 sind im Code behoben. Befund 3 ist für bereits gespeicherte Veröffentlichungen behoben; die verbleibende Lücke beschreibt Befund 3 dieser Runde. Explizite Rechte für `service_role` und die atomare Regelwerkaktivierung sind ergänzt.

**Prüfnachweis und Grenzen**

`node pruefung/komm-test.mjs`: **63 erfolgreich, 0 Fehler**. Der Lusatia Vergleich besteht in beiden Modi. Logikkopien und Regelwerkkopien sind bytegleich.

`node pruefung/komm-vergleich.mjs`: Abbruch vor der Berechnung mit `EPERM` beim Anlegen des temporären Ordners. Den dokumentierten Vergleich aller fünf Festivals konnte ich deshalb hier nicht reproduzieren.

Die drei Aktionen aus 32a liegen hinter dem Passwortschutz. Der Anbindungsschlüssel öffnet ausschließlich die ausdrücklich aufgelisteten Aktionen. RLS ist aktiviert, Policies werden nicht angelegt; `hh_komm_einspielen` schreibt keine Partnerfelder oder Freigabefelder.

Migration, effektive Datenbankrechte, Deno Laufzeit, Deploy und Livewirkung wurden nicht geprüft. Die Befunde beruhen auf dem Code. Keine Dateien geändert, keine Netzwerkdienste aufgerufen, keine weiteren Prüfer gestartet.

**32a ist noch nicht freigabefähig.**