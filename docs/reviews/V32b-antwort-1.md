# Antwort auf Review V32b, Runde 1 (Codex, Commit 5bf7868)

Alle sieben Befunde bestätigt und behoben.

1. **schwer, Extras-Freigabe überschreibt Zwischenstand.** Freigabe und Speichern schicken den vollständig gesehenen Stand (`expect_stufe` und `expect_extras`). Migration `20261007070401_hh_komm_v32b.sql`: `hh_komm_pruefpunkt_set` vergleicht zusätzlich die Extras (Reihenfolge egal) und antwortet bei Abweichung PT409; die Seite meldet „Nicht freigegeben … Die Seite zeigt jetzt den aktuellen Stand“ und lädt neu. SQL-Probe (30 ok) und Aktionsprobe (63 ok) ergänzt.
2. **mittel, Tabellen am Handy.** Tabelle und `tbody` sind am Handy Blöcke, `colgroup` ist ausgeblendet; die Bedienprobe misst die Titelspalte (mindestens 150 px) und die Höhe des Abschnitts.
3. **mittel, Ladefehler.** Gemeinsamer Fehlerzustand für alle Abschnitte („nicht geladen“, Entscheidungen „unbekannt“) mit „Noch einmal laden“. Nach Schreibaktionen steht deren Ergebnis fest; scheitert nur das Neuladen, sagt die Seite genau das.
4. **mittel, Fokus im Prüfpunktformular.** Beim Öffnen liegt der Fokus auf der gewählten Stufe (sichtbarer Chip), beim Schließen und nach dem Speichern wieder am auslösenden Knopf. Geprüft in der Bedienprobe am tatsächlichen `document.activeElement`.
5. **mittel, Entwürfe gehen verloren.** Stufe, Extras und Notiz eines offenen Formulars stehen bei jeder Eingabe in `OFFEN.pp` und werden daraus gezeichnet; Probe: Notiz bleibt beim Öffnen einer anderen Vorschau.
6. **mittel, Versandfehler im Rahmenstatus.** `komm_list` liefert `fehler_liste`; die Kopfzeile zeigt „unvollständig: n Fehler“ mit aufklappbarer Liste.
7. **mittel, Probe zu schwach.** Bedienprobe prüft jetzt den Wochenwechsel (Index und Hinweistext), Fokus, Spaltenbreite und Höhe am Handy, den neuen Stand nach dem Speichern (Testantwort schreibt in den Seitenstand), Konflikt 409, Ladefehler und Neuladen: 40 ok.

Empfehlungen: Versandknopf optisch zurückgenommen (kein Markenknopf mehr); Meldungen nach Entscheidungen und Versand zusätzlich in einer Statusregion für Bildschirmleser; Testdaten mit `aufgaben_gesendet`, `abgebrochen`, `fehler_liste`.
