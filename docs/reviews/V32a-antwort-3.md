# Antwort auf Review V32a, Runde 3 (Codex, Commit 291dbfe), letzte Runde

Alle vier Befunde bestätigt und behoben. Nach der dritten Runde keine weitere Review von 32a; die Korrekturen an den Aktionen für 32c und 32d prüfen die Reviews dieser Teilpakete mit.

1. **mittel, Prüfpunkt gegen Neuberechnung.** `hh_komm_pruefpunkt_set` nimmt dieselbe Advisory-Sperre wie `hh_komm_einspielen` und prüft in der Transaktion, dass es am Datum einen Prüfpunkt gibt (sonst PT409, „bitte neu laden“); die Aktion läuft zusätzlich unter der Festivalsperre. SQL-Probe ergänzt (28 ok).
2. **schwer, zweites Projekt bei unklarem Ausgang.** Nach einem Fehler beim Anlegen wird zuerst nach dem Projektnamen gesucht. Ein zweiter Versuch ohne `owner` nur, wenn Asana mit 400 das Feld `owner` ablehnt; sonst 502 ohne Anlegen.
3. **schwer, Projektwechsel.** Ist das gemerkte Projekt ein anderes als das Versandziel (archiviert, gelöscht), werden gemerkte Aufgaben mit `addProject` in das neue Projekt und den Monatsabschnitt gestellt, bevor Fälligkeit und Beschreibung aktualisiert werden; der Versandbericht nennt den Wechsel (`projektwechsel`).
4. **schwer, fremde Formel mit leerem Ergebnis.** Geprüft wird der eingegebene Inhalt (`userEnteredValue`, bei Formeln die Formel), nicht der Anzeigewert. Eigene Zellen tragen im Hinweis zusätzlich den geschriebenen Inhalt; weicht die Zelle davon ab (von Hand geändert), gilt sie als fremd und wird weder überschrieben noch geleert. Proben in `komm-test.mjs` (67 ok).

Empfehlung 1 (Aktionen mit simulierten Antworten) folgt mit 32c.
