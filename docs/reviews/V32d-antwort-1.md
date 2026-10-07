# Antwort auf Review V32d, Runde 1 (Codex, Commit e3fec73)

Alle fünf Befunde bestätigt. Vier sind behoben, einer ist so weit eingegrenzt, wie die Sheets-API es zulässt. Proben in `pruefung/komm-aktionen-probe.ts` Abschnitt 14 (88 ok).

1. **schwer, unvollständiger Hinweis.** `zelleFrei(roh, notiz, datum)` erkennt eine eigene Zelle nur mit vollständigem Hinweis: Kennung `komm:fix-<Datum>` passend zur Spalte und Zeile „Inhalt:“, die genau dem Zellinhalt entspricht. Fehlt etwas, ist die Zelle ein Konflikt; sie wird weder überschrieben noch geleert.
2. **schwer, Änderungen zwischen Lesen und Schreiben.** Unmittelbar vor dem Schreiben wird die Zeile frisch gelesen; geschrieben werden nur Zellen, deren Inhalt und Hinweis seit der Planung unverändert sind, alle anderen stehen mit Grund im Bericht. Ebenso für `F5`. **Grenze:** Die Sheets-API kennt kein bedingtes Schreiben. Zwischen dieser Prüfung und dem Schreiben bleiben Sekundenbruchteile, in denen eine gleichzeitige Eingabe in genau derselben Zelle überschrieben werden könnte. Das ist im Technikstand benannt; ein vollständiger Schutz wäre nur mit einem geschützten Bereich in Christians Tabelle möglich, den das Paket ausschließt (nur Zeile 6 und F5).
3. **schwer, älterer Abgleich setzt neuere Termine zurück.** Die Sperre wird vor dem Lesen der Festivaltermine genommen; Termine und Schreibplan entstehen darunter frisch. Probe: gesperrt 409 ohne Lesen der Tabelle.
4. **schwer, F5 mehrfach.** F5 wird genau einmal umgestellt (Nachweis `komm_tabelle_f5`). Steht danach wieder die alte Formel, bleibt sie, und der Bericht nennt den Konflikt (`ok: false`).
5. **mittel, vergangene Prüfpunkte.** Fixtermine nehmen die Prüfpunkte unabhängig vom heutigen Tag (auch vergangene Veröffentlichungen über `vergangen_voll`); eigene Einträge verschwinden nur, wenn der Termin entfällt oder sich verschiebt.

Empfehlungen: doppelte Daten in Zeile 5 werden nicht beschrieben und gemeldet, fehlende Abdeckung bis 31.12.2027 und Termine außerhalb führen zu „geschrieben, unvollständig“ und `ok: false`; die Probe prüft die Feldmasken (nur `userEnteredValue,note`, nur Zeile 6 und F5).
