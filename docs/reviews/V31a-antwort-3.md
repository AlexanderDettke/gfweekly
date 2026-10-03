# Antwort auf V31a, Runde 3 (Commit 99ffaca), letzte Runde für 31a

Alle fünf Befunde am Code bestätigt und übernommen. Eine vierte Runde sieht das Paket nicht vor; die Korrekturen prüft die Gesamtprüfung über `origin/main..HEAD` mit.
Belege: Migration `supabase/migrations/20261003174603_hh_vorhaben_v31a_runde3.sql` (angewendet am 03.10.2026), v38 neu deployt, `pruefung/vorhaben-probe.mjs` 82 von 82,
dazu eine einmalige Live-Prüfung eines Vorschlags in der Form des Mail-Abgleichs (per SQL angelegt, nur `vorhaben_slug`, ohne Revision und ohne `ball_gesehen`), Ausgabe:

```
vertraulicher Punktstand: 400 Der vorgeschlagene Stand zu „Abgleich-Probe“ enthält möglicherweise vertrauliche Angaben. Bitte ohne diesen Punkt übernehmen.
falscher gesehener Ball: 409 Der Ball liegt inzwischen bei Lea, bitte den Einwurf neu öffnen
übernehmen: 200 {"punkte":["7fd580cb-…"],"neu":[["Folgepunkt der Probe",null]],"ball":"alex","schritt":"Probe abschließen","verlauf":"mail / Testperson an Alex","ueber":[]}
Punkt erledigt: true
aufräumen: {"ok":true,"vorhaben":0,"einwuerfe":2,"ticker":0,"abwesenheiten":0,"aktiv_uebrig":false}
```

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | `hh_einwurf_apply` prüft an der Transaktionsgrenze jedes anwendbare Feld mit `hh_vertraulich`: Verlaufstext, wer, Stichwort, Punktstand, Titel und Person neuer Punkte, nächster Schritt, Tickertext. Daten fremder Vorschläge nur über `hh_datum` (gültig oder leer), Ball nur aus der Liste. Live: „vertraulicher Punktstand: 400“. |
| 2 | mittel | übernommen | Ein Vorschlag ohne `vorhaben_id` gilt als passend, wenn `vorhaben_slug` dem gewählten Vorhaben entspricht. Live: Punkt, neuer Punkt, Ball und nächster Schritt aus einem reinen Slug-Vorschlag übernommen. |
| 3 | schwer | übernommen | Neuer Parameter `p_expect_ball` (aus dem Dialog), sonst `ball_gesehen` aus der KI-Prüfung (`einwurfPruefen` speichert ihn). Weicht der aktuelle Ball ab, 409 mit dem aktuellen Ball. Live: „falscher gesehener Ball: 409“. Für Abgleich-Vorschläge ohne `ball_gesehen` schickt der Dialog (31c) den gesehenen Ball mit. |
| 4 | mittel | übernommen | `hh_handover_set` schreibt `gfweekly_handover_log` nur, wenn sich Status, Ampel, Vertretung, Frist oder Regel geändert haben. Probe: „genau ein Übergabeprotokoll trotz doppeltem Setzen“. |
| 5 | mittel | übernommen | Einwürfe der Probe tragen `source_ref = probe:v31:<lauf>:<n>` (nur dieses Muster nimmt `einwurf_add` an); `probe_aufraeumen` löscht nur darüber, nicht mehr über den Text. |

Empfehlungen: 1 einmalig live geprüft (oben), nicht in der wiederholbaren Probe, weil die Probe keinen Datenbankzugang hat. 2 teilweise: Protokollzahl in der Probe; den Ballwechsel zwischen Vorschlag und Übernahme belegt die Live-Prüfung. 3 übernommen im Technikstand. 4 übernommen (Laufkennung).
