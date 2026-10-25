# Antwort auf Runde 2 · Stufe 1 (25.10.2026)

Geprüfter Stand: `7f45cca`. Alle vier Befunde sind bestätigt und behoben; Korrekturen in der dritten Migration
`20261025180000_stufe1_runde2.sql` (in einer zurückgerollten Transaktion geprobt, dann live angewendet) und im Code.

| Nr | Schwere | Befund | Antwort |
| --- | --- | --- | --- |
| 1 | schwer | Zweiter Aufruf mit anderem Ergebnis gilt als gespeichert | Bestätigt. `hh_entscheidung_entscheiden` behandelt nur denselben Wortlaut als folgenlos; ein anderes Ergebnis auf eine entschiedene Zeile ist PT409 mit dem gespeicherten Ergebnis im Text; die Seiten zeigen den Konflikt und laden neu. Probe (SQL und Live) ergänzt. |
| 2 | schwer | Rückgängig erkennt eine spätere Archivierung nicht | Bestätigt. `hh_en_original` nimmt bei Themen `archived` und `archiv_grund` (bei Kandidaten `archiviert_at`, bei Punkten `titel`) in den Vergleichsstand auf; Rückgängig nach Archivierung ist PT409, der Beschluss bleibt. Live-Probe: Thema entschieden, archiviert, Rückgängig 409; Archivierung zurück, Rückgängig gelingt. |
| 3 | mittel | Korb ordnet erledigte oder verworfene Einträge zu | Bestätigt. `hh_korb_zuordnen` prüft unter der Sperre: Thema nicht archiviert und im Board (zu besprechen, in Klärung), Kandidat mit Status neu; sonst PT409. Probe (SQL: archiviertes Thema, verworfener Kandidat; Live: verworfener Kandidat). |
| 4 | mittel | Check-in als Toast, Server vergibt weiter Taler | Bestätigt. `gfCheckinKarte` zeigt eine Karte (Gruß, Tag in Folge, „Weiter“; schließt nach 9 s, außer bei reduzierter Bewegung, Zeiger oder Fokus). Der Aufruf schickt `ohne_spiel:true`; die Edge Function schreibt dann nur den Tag und die Serie, ohne Taler, Ziele oder Abzeichen. Bedienprobe mit frischem Tagesschlüssel ergänzt. |

Empfehlungen: beide umgesetzt (gezielte Proben für zwei Ergebnisse, Archivierung vor Rückgängig, veralteten Korbeintrag; Check-in mit frischem Tagesschlüssel bei `GF_SPIEL=false`).
