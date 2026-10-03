# Antwort auf V31b, Runde 2 (Commit 1069863)

Alle drei Befunde am Code bestätigt und übernommen. Belege: Migration `supabase/migrations/20261003175631_hh_vorhaben_v31b_erwartet.sql` (angewendet am 03.10.2026),
v38 neu deployt, Wirkungsprobe 86 von 86, Bedienung „Alle Bedienproben in Ordnung“.

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | `hh_punkt_save` und `hh_vorhaben_save` prüfen `p_patch.expect` (je Feld der zuletzt gesehene Wert) unter der Zeilensperre, Abweichung ergibt 409 „Inzwischen geändert (<Feld>)“. Das Punktformular schickt nur geänderte Felder mit ihrem gesehenen Wert; Stand und nächster Schritt in der Akte ebenso. Wirkungsprobe: „Änderung an einem anderen Feld lässt die fremde Änderung stehen“, „dasselbe Feld mit altem Wert (409)“, „Stand mit altem Wert (409)“, „expect mit unbekanntem Feld (400)“. Bedienung: „Punkt ändern schickt nur das geänderte Feld mit erwartetem Wert“, „Stand speichert mit dem gesehenen Wert“. |
| 2 | mittel | übernommen | Der Name wird nur vorbelegt, wenn die gewählte Ballart der bisherigen entspricht; ein Wechsel leert das Feld und die Fehlermeldung. Bedienung: „Wechsel von Team zu extern leert den Namen“. |
| 3 | mittel | übernommen | `gfModalAuf` in `core.js`: der Rest der Seite ist `inert`, Tab und Umschalt-Tab bleiben im Dialog, beim Schließen kehrt der Fokus zum auslösenden Knopf zurück (auch zu Knöpfen, die nur bei Fokus in der Karte sichtbar sind). Gilt für den Ball-Dialog und den Einwurf. Bedienung: „Tab bleibt im Dialog“, „Hintergrund ist inert“, „Escape schließt und gibt den Fokus zurück“. |

Empfehlungen: 1 übernommen (beide Fälle in Bedienung und Wirkungsprobe). 2 übernommen (nach einem Ballwechsel lädt die offene Akte mit). 3 übernommen („Rückgängig“ bleibt nach einem Fehlschlag stehen).
