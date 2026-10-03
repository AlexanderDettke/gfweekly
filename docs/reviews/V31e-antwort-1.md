# Antwort auf V31e, Runde 1 (Commit a59d534)

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | mittel | übernommen | Vorschläge tragen ihre Wirkung im Knopf: „Übernehmen und „<Punkt>“ abhaken“ (Punkt erledigt), „Stand am Punkt übernehmen …“ (öffnet den Punkt mit dem Stand aus dem Text nach „jetzt so steht:“, Speichern schreibt ihn mit `expect` und bestätigt den Vorschlag), sonst „In den Verlauf übernehmen“. Bedienung: „Stand-Vorschlag öffnet den Punkt mit dem neuen Stand“, „Speichern schickt den Stand … und bestätigt den Vorschlag“. |
| 2 | mittel | übernommen | `docs/ABGLEICH-VORHABEN.md`: Quelle C schließt `to:alex+einwurf@…` aus (bei Lea `lea+einwurf`). Der eingerichtete Cowork-Auftrag braucht den neuen Text, steht in `FRAGEN_FUER_MORGEN.md`. |
| 3 | mittel | übernommen | Neue Funktion `hh_vorhaben_quelle(id, quelle)` setzt den Eintrag einer Quelle unter Zeilensperre; der Abgleichtext nutzt sie statt UPDATE auf `quellen`. |
| 4 | mittel | erledigt | Ein Lauf mit Wirkung ist belegt: am 03.10.2026 um 20:18 Uhr (Berliner Zeit) schrieb `abgleich-alex` fünf Verlaufseinträge mit `source_ref` `abgleich:alex:…` (drei Mails, zwei Vorschläge zum Stand von XCeed-Punkten) und setzte `quellen` „Gmail Alex“ an Draußenbande und XCeed; Ball, Stand, nächster Schritt, Frist, Status und `updated_by` beider Vorhaben unverändert (Abfrage am 03.10.2026). |
| 5 | mittel | übernommen | Quelle C2 im Abgleichtext: eigene Suche `to:alex+xceed@wildemoehre.org` ohne Kategorie-Ausschluss; „ohnehin“ in `docs/XCEED-SCHNITTSTELLE.md` ersetzt durch die Bedingung. |
| 6 | mittel | übernommen | README, `ARBEITSSTAND.md` und `FRAGEN_FUER_MORGEN.md` werden zum Abschluss von V31 nachgezogen (Paket, Abnahme Punkt 5). |

Empfehlungen: 1 nicht übernommen in V31 (der Abgleich ist ein Cowork-Auftrag, eine wiederholbare Probe dafür gehört in dessen Einrichtung; steht in den Fragen). 2 übernommen (siehe 1). 3 übernommen (Hinweis „Recherche in öffentlichen Quellen, nicht bei XCeed bestätigt“). 4 übernommen, soweit es die Daten hergeben: die Akte zeigt `quellen` mit Zeit.
