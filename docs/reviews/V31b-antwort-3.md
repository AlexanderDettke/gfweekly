# Antwort auf V31b, Runde 3 (Commit 833bbad), letzte Runde für 31b

Alle drei Befunde übernommen; eine vierte Runde sieht das Paket nicht vor, die Gesamtprüfung prüft mit. Belege: v38 neu deployt nach Diff (Live gleich HEAD), Wirkungsprobe 90 von 90, Bedienung „Alle Bedienproben in Ordnung“.
Hinweis: `--output-last-message` hat für diese Runde keine Datei geschrieben; der Bericht stammt aus der letzten Antwort im Protokoll des Laufs.

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | Ballwechsel schickt neben `expect_ball` auch `expect: { ball_name }`; `hh_vorhaben_save` prüft ihn mit (allgemeiner `expect`, `ball_name` gehört zu den erlaubten Feldern). Wirkungsprobe: „Teamname mit veraltetem Stand (409)“. |
| 2 | schwer | übernommen | `vorhaben_verknuepfen` nimmt `expect_vorhaben_id` (auch null) und ändert nur, wenn der Bezug noch gilt, sonst 409 mit dem aktuellen Bezug. „Zuordnung lösen“ schickt die Akte als erwarteten Bezug, „Rückgängig“ erwartet null. Wirkungsprobe: „Zuordnung mit veraltetem Bezug (ändert nichts)“ an einem echten Thema ohne Wirkung; Bedienung: „Zuordnung lösen schickt den gesehenen Bezug“. |
| 3 | mittel | übernommen | Nicht gespeicherter Text bleibt als Entwurf im Feld (mit „nicht gespeichert, gespeichert ist: …“), der Reiterwechsel wartet auf das laufende Speichern, und ein Entwurf wird nicht von selbst erneut gesendet. Bedienung: „nach Konflikt steht der eigene Text noch im Feld, mit Hinweis“. |

Empfehlungen: 1 übernommen (siehe 1 und 2). 2 übernommen für Stand und nächsten Schritt (eigener Text und gespeicherter Wert nebeneinander). 3 bleibt wie im Paket („am Ende status archiviert“): die Probe löscht den archivierten Bestand beim nächsten Lauf, steht im Technikstand.
