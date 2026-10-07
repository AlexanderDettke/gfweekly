Geprüft: 32d, Commit e3fec73231ab5881f7b4332789a15638570c254d, 22 Dateien

1. **[schwer] Unvollständiger Zellhinweis erlaubt das Überschreiben fremder Inhalte**

   Fundstelle: `site/assets/komm-logik.js:459`, zusätzlich `supabase/functions/gfweekly/komm.ts:650`

   Was passiert: Beginnt der Hinweis mit `komm:`, fehlt aber die Zeile `Inhalt:`, liefert `zelleFrei` grundsätzlich `true`. Lokal reproduziert: Eine fremde Formel mit Hinweis `komm:fix-2027-07-23` wird durch `LUS F` ersetzt. Derselbe Prüfpfad erlaubt auch das Leeren solcher Zellen.

   Warum falsch: 32d verbietet das Überschreiben fremder Inhalte und Formeln. Die in Antwort 32a, Runde 3 zugesagte Erkennung manueller Änderungen ist bei unvollständigem Hinweis unwirksam.

   Vorschlag: Nur einen vollständig validierten eigenen Hinweis mit passender Kennung und exakt übereinstimmendem gespeichertem Inhalt akzeptieren. Fehlende Inhaltsnachweise als Konflikt melden.

2. **[schwer] Änderungen zwischen Lesen und Schreiben gehen verloren**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:613`, zusätzlich Zeilen 625 und 657

   Was passiert: Der Abgleich liest die Zellen und schreibt später ohne weitere Konfliktprüfung. Die Datenbanksperre schützt ausschließlich andere Abgleichläufe. Lokal reproduziert: Christian trägt nach dem Lesen einen fremden Text ein. Der anschließende Schreibaufruf ersetzt ihn durch `LUS F`; im Bericht fehlt der Konflikt. Dasselbe Zeitfenster besteht beim Ersetzen von F5.

   Warum falsch: Die Vorgabe „fremde Inhalte nie überschreiben“ gilt auch während paralleler Bearbeitung der Redaktionstabelle.

   Vorschlag: Einen belegten Konfliktschutz für den gesamten Schreibzeitraum herstellen. Eine erneute Prüfung unmittelbar vor dem Schreiben verkleinert das Zeitfenster, garantiert allein aber keinen Schutz. Solange dieser fehlt, darf der automatische Schreibweg nicht als sicher abgenommen werden.

3. **[schwer] Älterer Abgleich kann neuere Festivaltermine zurücksetzen**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:579`, zusätzlich Zeilen 585 und 596

   Was passiert: Festivaltermine und Schreibplan entstehen vor Erwerb der Tabellensperre. Lokal reproduziert: Ein älterer Lauf pausiert vor der Sperre. Ein zweiter Lauf schreibt Lusatias verschobenen Beginn am 30.07.2027. Anschließend erhält der ältere Lauf die Sperre, entfernt diesen Eintrag und setzt `LUS F` wieder auf den 23.07.2027. Beide antworten mit 200.

   Warum falsch: 32d verlangt einen idempotenten Abgleich auf Grundlage der aktuellen Plattformtermine. Die aus 32a bekannten Korrekturen gegen veraltete Berechnungen wurden hier nicht übernommen.

   Vorschlag: Die Sperre vor dem Lesen der Festivaltermine erwerben und den Schreibplan darunter frisch erzeugen. Den beschriebenen Ablauf als gezielte Probe ergänzen.

4. **[schwer] F5 wird nicht auf eine einmalige Umstellung begrenzt**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:620`

   Was passiert: Jeder Lauf ersetzt die bekannte alte Formel erneut. Der Eintrag `komm_tabelle_f5` wird geschrieben, aber nicht als einmaliger Umstellungsnachweis geprüft. Lokal reproduziert: Nach erfolgreicher Umstellung wird F5 manuell auf `=DATE($B$2,1,1)` zurückgestellt. Der nächste Lauf schreibt F5 erneut.

   Warum falsch: Der Prüfauftrag verlangt ausdrücklich, F5 nur einmal aus der bekannten Formel zu setzen. Auch der Technikstand beschreibt die Änderung als einmalig.

   Vorschlag: Die Umstellung dauerhaft als abgeschlossen kennzeichnen. Eine spätere Rückstellung als Konflikt melden und ohne erneute Freigabe erhalten.

5. **[mittel] Vergangene Prüfpunkte verschwinden aus der Redaktionstabelle**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:585`, zusätzlich `site/assets/komm-logik.js:444` und `supabase/functions/gfweekly/komm.ts:653`

   Was passiert: Fixtermine erhalten Prüfpunkte ausschließlich aus den noch kommenden Veröffentlichungen. Nach Ablauf eines Prüfpunkts entfernt der tägliche Abgleich dessen Eintrag. Lokal reproduziert: `LUS Lineup · LUS Prüfpunkt` am 08.06.2027 wird beim Lauf mit Stichtag 09.06.2027 zu `LUS Lineup`.

   Warum falsch: 32d verlangt Fixtermine einschließlich Prüfpunkten. Das automatische Entfernen vergangener, weiterhin gültiger Meilensteine ist nicht vorgesehen.

   Vorschlag: Prüfpunkte unabhängig vom heutigen Datum erzeugen. Eigene Einträge nur entfernen, wenn der zugrunde liegende Termin tatsächlich entfällt oder verschoben wird.

**Empfehlungen**

1. Abschnitt 12 um die fünf reproduzierten Fehlerfälle erweitern.
2. Unbekanntes F5, doppelte Datumswerte und unzureichende Kalenderabdeckung ausdrücklich prüfen und als unvollständigen Abgleich melden.
3. Schreibmasken und Feldgrenzen in der Probe prüfen, einschließlich erhaltener Auswahllisten und Formatierungen.

**Prüfnachweis und Grenzen**

`node pruefung/komm-test.mjs`: **67 erfolgreich, 0 Fehler**. Die lokale Aktionsprobe mit PGlite und nachgebildeten Dienstantworten: **66 erfolgreich, 0 Fehler**, mit gesperrtem Netzwerk ausgeführt. Die zusätzlichen Fehlerproben liefen ausschließlich im Speicher.

Die Schreibrequests adressieren ausschließlich Zeile 6 ab F sowie F5. Ihre Feldmasken enthalten keine Auswahllisten oder Zellformatierungen. Nach der F5 Umstellung werden die Datumswerte erneut gelesen; die Zuordnung funktioniert im simulierten regulären Kalender. Die frühere Korrektur für fremde Formeln mit leerem Ergebnis besteht.

Die drei Runden und Antworten von 32a und 32b wurden berücksichtigt. Die einschlägigen Aktionskorrekturen bestehen in der lokalen Probe; eine erneute Oberflächenabnahme von 32b war nicht Gegenstand dieser Prüfung.

Google Laufzeit, tatsächliche Tabellenstruktur, Berechtigungen und Livewirkung wurden nicht geprüft. Keine Dateien geändert, keine externen Dienste aufgerufen, keine weiteren Prüfer gestartet.

**32d ist wegen der genannten Befunde noch nicht freigabefähig.**