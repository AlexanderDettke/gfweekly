Geprüft: 32d, Commit 0ab5bad8a89fddfdc24df492b5681a7572f3269a, 27 Dateien

1. **[schwer] Fremde Eingaben nach der letzten Prüfung werden weiterhin überschrieben**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:739`, zusätzlich Zeile 745.

   Was passiert: Zwischen erneutem Lesen und Schreiben bleibt ein ungeschütztes Zeitfenster. Lokal reproduziert: Eine dort eingefügte Eingabe „Christian nach letzter Prüfung“ wird durch `BN F · FLU Prüfpunkt` ersetzt. Die Antwort enthält `ok: true` und keine fremde Zelle. Abschnitt 14 prüft nur Änderungen vor dem erneuten Lesen.

   Warum falsch: Befund 2 aus Runde 1 ist eingegrenzt, aber nicht behoben. 32d verlangt, fremde Inhalte niemals zu überschreiben. Die dokumentierte Restunsicherheit erfüllt diese Vorgabe nicht.

   Vorschlag: Den automatischen Schreibweg bis zu einem belegten Konfliktschutz gesperrt lassen. Erfordert dieser eine zusätzliche Freigabe für einen geschützten Bereich, muss das als offene Voraussetzung ausgewiesen werden. Eine weitere Leseprüfung allein reicht nicht.

2. **[schwer] Geänderte Datumsspalten werden vor dem Schreiben nicht erkannt**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:739`, zusätzlich Zeilen 733 und 743.

   Was passiert: Das erneute Lesen enthält beide Zeilen, ausgewertet wird jedoch ausschließlich Zeile 6. Lokal reproduziert: F5 wird vor dieser Prüfung zurückgestellt. Der bereits geplante Eintrag für den 06.08.2027 landet dadurch unter dem tatsächlichen Spaltendatum 06.11.2027. Die Antwort meldet `ok: true`, ohne Konflikt.

   Warum falsch: 32d verlangt die korrekte Zuordnung von Datum und Spalte. Dieser Fehler entsteht bereits vor der letzten Prüfung und ist vom verbleibenden Zeitfenster aus Befund 1 unabhängig.

   Vorschlag: Vor jedem Schreibblock auch F5 und die tatsächlichen Datumswerte sämtlicher betroffener Spalten vergleichen. Bei Änderungen den gesamten Plan verwerfen und frisch planen oder mit Konflikt abbrechen. Ebenso geplante Löschungen absichern.

3. **[schwer] Nach Ablauf der Sperre kann ein älterer Lauf neuere Termine zurücksetzen**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:673`, zusätzlich Zeilen 644 und 745.

   Was passiert: Die Sperre gilt 120 Sekunden. Google Anfragen haben keine eigene Zeitgrenze; der Tabellenlauf erneuert oder kontrolliert seine Sperre nicht. Lokal mit simuliertem Sperrablauf reproduziert: Während der ältere Lauf wartet, schreibt ein neuer Lauf Lusatias verschobenen Beginn am 30.07.2027. Anschließend setzt der ältere Lauf `LUS F` wieder auf den 23.07.2027 und entfernt es vom neuen Datum. Beide antworten mit 200.

   Warum falsch: Befund 3 aus Runde 1 ist nur bei durchgehend gültiger Sperre behoben. Die verlangte Idempotenz und Aktualität bleiben bei einer Übernahme nach Ablauf verletzt. Die erneute Inhaltsprüfung hilft nicht, weil der ältere Lauf die neu geschriebenen Zellen als eigene erkennt.

   Vorschlag: Google Anfragen zeitlich begrenzen, ein Gesamtbudget unterhalb der Sperrdauer einhalten und Sperrbesitz vor Schreibvorgängen kontrollieren. Einen abgelösten Lauf abbrechen. Abschnitt 14 um den tatsächlichen Übernahmefall ergänzen.

4. **[schwer] Fehler beim F5 Nachweis erlauben eine erneute Umstellung**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:716`, zusätzlich Zeile 726.

   Was passiert: Ein Lesefehler beim Umstellungsnachweis wird als fehlender Nachweis behandelt. Auch ein Fehler beim anschließenden Speichern wird ignoriert. Beide Fälle lokal reproduziert: Trotz fehlgeschlagener Nachweisabfrage wird F5 erneut geschrieben. Scheitert die Speicherung nach der ersten Umstellung, führt eine spätere Rückstellung zu einem zweiten Schreibvorgang. Der erste Lauf meldet trotzdem `protokoll: true` für seinen allgemeinen Bericht.

   Warum falsch: Befund 4 aus Runde 1 ist im regulären Fall behoben, bei Datenbankfehlern jedoch nicht. Die verlangte einmalige Änderung ist nicht zuverlässig abgesichert.

   Vorschlag: Bei fehlgeschlagener Nachweisabfrage ohne F5 Änderung abbrechen. Die einmalige Berechtigung vor dem externen Schreiben dauerhaft reservieren und einen unklaren Ausgang ausdrücklich speichern. Fehler des Umstellungsnachweises gesondert melden.

5. **[mittel] Ein Abgleich für ein einzelnes Festival lässt verschobene Termine stehen**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:733`, zusätzlich Zeilen 694 und 780.

   Was passiert: Alte Einträge werden ausschließlich beim Gesamtlauf bereinigt. Lokal reproduziert: Nach Verschiebung von by nature auf den 13.08.2027 schreibt `komm_tabelle_sync {festival: "BN"}` den neuen Beginn. Am 06.08.2027 bleibt gleichzeitig `BN F · FLU Prüfpunkt` stehen. Die Antwort meldet `ok: true`.

   Warum falsch: 32d bietet ausdrücklich den Abgleich je Festival an. Dieser hinterlässt einen sachlich falschen alten Fixtermin bis zum nächsten Gesamtlauf.

   Vorschlag: Alte und neue betroffene Tage gemeinsam abgleichen. Den entfallenen Festivalanteil entfernen und weiterhin gültige Einträge anderer Festivals erhalten. Die entsprechende Probe mit einem Einzelaufruf ergänzen.

6. **[mittel] Ausgelassene Fixtermine werden als erfolgreicher Abgleich gemeldet**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:748`, zusätzlich Zeilen 753 und 880.

   Was passiert: `fremd` beeinflusst weder `ok` noch den Vollständigkeitsstatus. Lokal reproduziert: Ein fremder Eintrag verhindert den Fixtermin am 06.08.2027. Trotzdem lautet die Antwort `ok: true`, Ergebnis „geschrieben“. Der Tick übernimmt lediglich Ergebnis und Schreibzahl und verschweigt die ausgelassenen Termine.

   Warum falsch: Fremde Inhalte bleiben hier korrekt erhalten. Der Bericht unterscheidet aber vollständigen und teilweise verhinderten Abgleich nicht zuverlässig.

   Vorschlag: Verhinderte Schreibvorgänge als unvollständig kennzeichnen und ihre Anzahl im Tick nennen. Das gilt auch für Änderungen, die beim erneuten Lesen erkannt werden.

**Empfehlungen**

1. Abschnitt 14 um die oben reproduzierten Fälle erweitern. Die bestehende Sperrprobe belegt nur die Ablehnung während einer gültigen Sperre.
2. Doppelte Datumswerte, Kalenderlücken und unbekanntes F5 ausdrücklich als Aktionsproben aufnehmen.
3. Im Bericht Schreibzahl, ausgelassene Termine, Konflikte und Protokollfehler getrennt ausweisen.

**Runde 1 und Prüfnachweis**

Befund 1 aus Runde 1 ist behoben: Unvollständige Hinweise und Hinweise mit unpassendem Datum erlauben kein Schreiben. Befund 5 ist ebenfalls behoben: Vergangene Prüfpunkte bleiben erhalten. Befunde 2 bis 4 bleiben in den beschriebenen Fällen offen.

Die drei Runden samt Antworten von 32a und 32b wurden berücksichtigt. Die einschlägigen Aktionskorrekturen bestehen in der lokalen Probe, einschließlich fremder Formeln mit leerem Ergebnis und veralteter Prüfpunktentscheidungen.

`node pruefung/komm-test.mjs`: **70 erfolgreich, 0 Fehler**. Aktionsprobe mit lokalem PGlite und gesperrtem Netzwerk: **95 erfolgreich, 0 Fehler**. Zusätzliche Fehlerproben liefen ausschließlich im Speicher.

Alle erzeugten Schreibrequests adressieren ausschließlich Zeile 6 ab F beziehungsweise F5. Ihre Feldmasken enthalten keine Auswahllisten oder Formatierungen. Nach regulärer Umstellung werden die Datumswerte erneut gelesen und korrekt zugeordnet.

Tatsächliche Google Wirkung, Tabellenstruktur und Berechtigungen wurden nicht geprüft. Keine Dateien geändert, keine externen Dienste aufgerufen, keine weiteren Prüfer gestartet.

**32d ist weiterhin nicht freigabefähig.**