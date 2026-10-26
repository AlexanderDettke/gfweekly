# Antwort auf Codex-Runde 2 · Stufe 3 · Lauf im Kompass

Geprüfter Stand: `3a8117f`. Befunde in `STUFE3-runde-2.md` (4 schwer, 6 mittel). Korrekturen in Migration
`20261026140000_stufe3_runde2.sql` (angewendet am 26.10.2026) und im Commit „fix(stufe3): Runde 2“; Wirkungsprobe danach 26 von 26.

| Nr | Schwere | Bewertung | Was geändert ist |
| --- | --- | --- | --- |
| 1 | schwer | bestätigt | `hh_lauf_cursor.rest_bis`: ist ein Stapel voll, wird die älteste gelesene Mail obere Grenze des ungelesenen Rests; der nächste Tick liest zuerst darunter weiter, bis das Fenster leer ist, dann rückt `bis_at` vor. Gmail-Seiten werden so ohne Seitentoken abgearbeitet. |
| 2 | schwer | bestätigt | Automatisches Erledigen nur mit konkretem Belegsatz (mindestens 20 Zeichen, nicht herausgefiltert); sonst wird aus `erledigt` ein `vorschlag`. |
| 3 | schwer | bestätigt (Teil) | Wortliste um „untragbar“, „versag…“, „dumm“, „idiot“, „nicht tragbar“ erweitert; der Beleg muss konkret sein (2). Eine Wortliste erkennt keine Umschreibungen; das bleibt die bekannte Grenze (Technikstand), die Prompt-Regel und die Sichtung in der Akte tragen den Rest. |
| 4 | schwer | bestätigt | Einwurf-Mails aus der Nutzlast legen außerhalb des Probelaufs keinen Einwurf an (`uebersprungen` mit Hinweis); Einwürfe entstehen nur aus Gmail-Quellen. Probe: Einwurf-Fixture im Modus live → kein Einwurf. |
| 5 | mittel | bestätigt | `laufAktion` gibt bei `unklar` immer `nichts`; Kandidaten erst ab `wahrscheinlich`. Probe erweitert. |
| 6 | mittel | bestätigt | Trefferquote = übernommene Vorschläge und Kandidaten plus bleibende Lauf-Erledigungen, geteilt durch alles Bewertete (dazu verworfene, verfallene, archivierte, zurückgenommene); noch offene Vorschläge zählen weder als Treffer noch als Fehlschlag. Antwort nennt `bewertet`. |
| 7 | mittel | bestätigt | Rücknahmen werden über die Kennung in `source_ref` (`rueckgaengig:lauf:<Eintrag>`) ihrer Erledigung zugeordnet; die Selbstabschaltung bewertet zwei Erledigungskohorten (diese Woche, Vorwoche). Probe mit Kennungen. |
| 8 | mittel | bestätigt (Teil) | Im Rückblick (`kontext_ab`) zählen auch abgeschlossene Vorhaben, sofern sie seither erledigte Punkte haben. Der volle Vier-Wochen-Rückblick bleibt eine offene Voraussetzung (Google-Zugang); im Technikstand als Stichprobe benannt, die Kriterien a, b, d gelten erst nach dem Rückblick als belegt. |
| 9 | mittel | verworfen | Wie in Runde 1 (Befund 13): Reiter statt zusammengeführter Dateien ist die dokumentierte Lesart; sie erfüllt den Zweck (eine Gruppe, 14 Einträge) ohne Umbau von fünf Seiten. |
| 10 | mittel | bestätigt | Ein Zeitplan alle zwei Stunden 04:07 bis 21:07 UTC; `hh_lauf_tick` prüft die Berliner Stunde (6 bis 22) selbst, damit der Wechsel der Sommerzeit auf den Tag genau stimmt. |
