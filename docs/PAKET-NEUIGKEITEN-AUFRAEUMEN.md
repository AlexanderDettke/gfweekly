# Paket · Neuigkeiten aufräumen („Nur was Handeln braucht“) · Stand 22.10.2026

Auftraggeber: Alex. Repo: gfweekly · Live: https://kompass.wildehabitate.de/neuigkeiten.html · Supabase: bnfmupnmqyrcltrphfak · Edge Function: gfweekly

## Auftrag (wörtlich)

Alex am 21.10.2026: „Wie könnten wir die Neuigkeiten aufräumen? Mit 300 Neuigkeiten kann keiner was anfangen. Das killt einen. Man will ja eigentlich schenll das wichtigste finden. kannst du mir die besten drei Variaten als Auswahl darstellen?“

Aus drei Varianten gewählt: **A · Nur was Handeln braucht**. Beschreibung der Variante, wie vorgelegt: „Prinzip Posteingang: oben stehen höchstens 10 Dinge (Kandidaten „hoch“ der letzten 7 Tage und Neues zu Vorhaben mit Ball bei dir). Alles andere verfällt nach 14 Tagen von selbst ins Archiv, ist aber durchsuchbar. Einmalig werden die 320 alten Kandidaten abgeräumt.“

Umsetzungsvorschlag, auf den Alex mit „ja“ geantwortet hat:
1. Oben „Braucht dich“, höchstens 10: Kandidaten „hoch“ der letzten 7 Tage plus Neues zu Vorhaben mit Ball bei dir. Je Zeile Übernehmen, Verwerfen, Zum Vorhaben.
2. Darunter „Zu deinen Vorhaben“: je Vorhaben nur eine Zahl.
3. „Alles andere“ (Ticker, Sichtungskorb, Themenlage) und „Archiv durchsuchen“ zugeklappt.
4. Verfall: Ticker und Kandidaten, die älter als 14 Tage und unbearbeitet sind, ins Archiv. Nichts wird gelöscht, die Suche findet sie.
5. Einmaliges Aufräumen: die offenen Kandidaten seit Juli ins Archiv, mit eigener Markierung, mit einem Befehl rückgängig zu machen.
Vorgaben: Frist 14 Tage, „Braucht dich“ höchstens 10, Kandidaten „hoch“ der letzten 7 Tage bleiben beim Aufräumen; Laufband, Themenlage und täglicher Lauf unverändert.

## Annahmen (ohne Rückfrage getroffen, hier festgehalten)

- Grundlage ist `origin/main` (05af97b). Der Branch `paket/webstandard-pilot` ist nicht gepusht und nicht getestet; er muss vor seinem Push die Asset-Version auf `?v=37` heben, dieses Paket nimmt `?v=36`.
- „Älter als 14 Tage“ zählt ab dem jüngeren von Ereignis, Eintragung durch den Lauf und letzter Zuteilung durch eine Person (`happened_at`, `created_at`, `gate_at`). Was der Lauf gestern nachgetragen hat, verfällt also nicht über Nacht; wer etwas zuteilt, gibt ihm 14 neue Tage. Termine in der Zukunft verfallen nicht.
- „Unbearbeitet“ heißt Status `neu` oder `gesehen`. Übernommene und verworfene bleiben, wie sie sind (sie stehen im Korb nur unter „Erledigte zeigen“).
- Das einmalige Aufräumen nimmt die offenen Kandidaten, deren Eintragung, letzte Zuteilung und letztes Zurückholen mehr als 7 Tage zurückliegen (Stand 22.10.2026: 293 von 320). Was in den letzten 7 Tagen kam, bleibt, auch „mittel“ zu einem Vorhaben mit Ball bei dir (Review Runde 1), und verfällt regulär nach 14 Tagen. Darunter sind 108 Kandidaten, die Alex am 20. bis 22.09.2026 über den Pförtner zugeteilt hat (61 an Lea, 21 an Alex, 15 an das Team, 6 an die Plattform, 4 warten, 1 GF); sie sind seither unberührt und fallen unter „320 alte Kandidaten“. Der erste Verfall direkt danach trägt den Grund `aufraeumen-20261022-verfall`. Rückweg für beides: `update gfweekly_news set status='neu', archiv_grund=null, archiviert_at=null, aktiv_ab=now() where archiv_grund in ('aufraeumen-20261022','aufraeumen-20261022-verfall');`
- „Braucht dich“: Kandidaten „hoch“ mit Status `neu`, in den letzten 7 Tagen eingetragen, dazu offene Kandidaten zu Vorhaben, deren Ball bei der Person liegt (wie „Bei mir“ auf der Vorhabenseite), höchstens 10, sortiert: Vorhaben mit Ball bei mir, dann zugeteilt an mich oder GF, dann neueste.
- „Zu deinen Vorhaben“: je Vorhaben mit Ball bei mir die Zahl der Neuigkeiten (Ticker und Kandidaten) der letzten 7 Tage. Ein Tipp filtert Ticker und Korb auf dieser Seite auf das Vorhaben (die Akte zeigt Tickerzeilen nicht), dazu ein Link zur Akte.
- Archiviert ist ein eigener Status `archiviert` mit `archiv_grund` (`verfall-14` oder `aufraeumen-20261022`) und `archiviert_at`; `decided_by` bleibt leer, weil niemand entschieden hat. „Zurück in den Korb“ hebt beides auf und setzt `aktiv_ab`, ab dem der Verfall erneut 14 Tage zählt.
- `news_list` lässt Archiviertes weg, außer es wird ausdrücklich verlangt (`archiv:true` mit Suchbegriff, oder Status `archiviert` im Filter).
- Der Verfall läuft täglich um 04:50 UTC als Datenbankfunktion über pg_cron.
