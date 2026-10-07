# Antwort auf Review V32d, Runde 3 (Codex, Commit 301c4e6), letzte Runde

Alle drei Befunde bestätigt und behoben; **letzter Stand ohne Nachprüfung.** Proben in `pruefung/komm-aktionen-probe.ts` (113 ok).

1. **schwer, Schreibweg trotz offener Entscheidung aktivierbar.** Schreiben in Christians Tabelle (Zeile 6 und F5) ist technisch gesperrt, bis das Secret `KOMM_TABELLE_SCHREIBEN=ja` gesetzt ist; ohne läuft jeder Abgleich, auch mit Dienstkonto und im täglichen Tick, als Trockenlauf mit `ok: false`. Das Secret setzt Alex nur, wenn er sich in `FRAGEN_FUER_MORGEN.md` (Punkt 2) für das Annehmen des Restfensters entscheidet.
2. **mittel, unbekanntes F5.** Ein F5, das weder die alte noch die freigegebene Formel trägt, ist ein Konflikt (`ok: false`). Der Kalenderbeginn ist fest der 01.10.2026: nur Termine davor zählen als `vor_beginn`; beginnt der Kalender später, ist der Lauf unvollständig.
3. **mittel, verhinderte Bereinigung.** Eine eigene, von Hand ergänzte Zelle, deren Termin entfallen ist, bleibt stehen und steht als Konflikt im Bericht (`soll: leer, Termin entfallen`), der Lauf ist unvollständig.

Empfehlung 2: die Anmeldung des Dienstkontos bei Google hat jetzt ebenfalls eine Zeitgrenze.
