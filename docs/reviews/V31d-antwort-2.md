# Antwort auf V31d, Runde 2 (Commit 85e3a84)

Alle sechs Befunde übernommen. Belege: v38 neu deployt (Live vorher gleich HEAD), Wirkungsprobe 92 von 92, Bedienung „Alle Bedienproben in Ordnung“.

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | Nach einem Teilfehler baut der Dialog Wahlen, Namen und Ausgangsstand ganz aus dem frischen Korb neu auf; die Meldung nennt gespeicherte und nicht gespeicherte Zeilen getrennt (Empfehlung 2). |
| 2 | mittel | übernommen | Keine Abwesenheit wird von selbst genommen: gibt es welche, fragt der Dialog „Für welche Abwesenheit?“ mit Zeitraum, Status, Anlass (`note`) und Vertretung, daneben „Neue Abwesenheit anlegen“. Der Zeitraum steht danach im Kopf des Dialogs (Empfehlung 1). Bedienung: „Urlaub fragt nach der Abwesenheit, auch wenn es nur eine gibt“. |
| 3 | mittel | übernommen | Ist die Liste gekürzt, steht „nicht alles geladen“ im Kopf, und „Alles gesehen“ setzt den Zeitpunkt nur bis zum ältesten geladenen Eintrag und lädt den Rest nach. |
| 4 | mittel | übernommen | `vorhaben_rueckkehr` liest seitenweise bis 5.000 Einträge (darüber `gekuerzt`, die Seite sagt es) und rechnet den Beginn als Mitternacht Berliner Zeit (`berlinMitternacht`, Sommer und Winter). |
| 5 | mittel | übernommen | „Rückübergabe bestätigen“ ist gesperrt, bis „Deine Vorhaben zurück“ geladen ist; bei einem Fehler bleibt es gesperrt, nach erfolgreichem Neuladen frei. Bedienung: „Ladefehler: Hinweis mit Neuladen, Rückübergabe gesperrt“, „nach erfolgreichem Neuladen wieder bedienbar“. |
| 6 | mittel | übernommen | Das `finally` der Probe beendet beide Testabwesenheiten und prüft „keine offene Testabwesenheit der Probe“. |

Empfehlungen: 1, 2 und 4 übernommen (siehe oben). 3 ist schon so: der Abschnitt „Deine Vorhaben zurück“ steht vor „Rückübergabe bestätigen“.
