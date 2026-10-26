# Antwort auf Codex-Runde 3 · Stufe 3 · Lauf im Kompass

Geprüfter Stand: `ee94974`. Befunde in `STUFE3-runde-3.md` (3 schwer, 7 mittel). Korrekturen in Migration
`20261026150000_stufe3_runde3.sql` (angewendet am 26.10.2026) und im Commit „fix(stufe3): Runde 3“ (`38b3849`). Das war die dritte und
letzte Runde: diese Korrekturen sind **nicht mehr unabhängig geprüft**, nur durch die Wirkungsproben gegen das echte Backend
(Stufe 3: 28 von 28, Stufe 2: 28 von 28, Stufe 1: 50 von 50 mit der deployten Function) und die Abnahme.

| Nr | Schwere | Bewertung | Was geändert ist |
| --- | --- | --- | --- |
| 1 | schwer | bestätigt | Gmail-Threads, die im selben Modus schon protokolliert oder ausgeführt sind, zählen nicht mehr in den Stapel (Vorprüfung je Thread vor dem Laden); „mehr“ kommt aus Gmails Seitenkennzeichen beziehungsweise überzähligen Treffern, `rest_bis` rückt damit auch bei Threads mit Nachrichten beiderseits der Grenze weiter. Eine Probe mit mehr als `batch` echten Threads braucht den Google-Zugang (offene Voraussetzung). |
| 2 | schwer | bestätigt | `belegVerankert`: automatisches Erledigen nur, wenn der Belegsatz ein Datum, einen Betrag oder ein kennzeichnendes Wort (mindestens fünf Zeichen, großgeschrieben, nicht aus der Floskelliste) aus Betreff, Absender oder Text der Quelle enthält; „Die Angelegenheit ist nun erledigt“ wird Vorschlag. Rechenregel in der Probe. |
| 3 | schwer | bestätigt (Teil) | Wortliste um Umschreibungen von Bewertungen erweitert („traut … nicht“, „nicht mehr zu“, „Vertrauen in … ist“, Eignung, Charakter, „Verhalten von“, „zu nichts“). Es bleibt eine Wortliste; was sie nicht fängt, bleibt als Vorschlag oder Kandidat in der Sichtung von Alex oder Lea und wird dort verworfen. Das ist die dokumentierte Grenze (Technikstand), nicht behebbar ohne zweiten Modellaufruf je Text. |
| 4 | mittel | bestätigt (Teil) | Rückblick: Quellen sind Mails, Einwurf-Mails und Plattform-Feeds; bestehende Einwürfe und Verlaufseinträge sind Ergebnisse früherer Läufe, keine Belege. Der damalige Punktestand ist über `kontext_ab` angenähert (seither erledigte Punkte bleiben im Kontext); Punkte, die erst nach einer historischen Mail angelegt wurden, bleiben sichtbar und können zu „falschen“ Treffern führen; die Auswertung wird deshalb als Näherung bezeichnet. Der volle Rückblick bleibt offene Voraussetzung (Google-Zugang) und steht so im Technikstand. |
| 5 | mittel | bestätigt | `hh_lauf_protokoll.quelle_at` (Zeitpunkt der Quelle); Sichtungen je Tag nach dem Quellentag in Berliner Zeit; von Hand erledigte Punkte nach Berliner Tag ausgewählt. |
| 6 | mittel | bestätigt | Zeitplan stündlich `7 4-21 * * *` UTC; `hh_lauf_tick` läuft nur zu geraden Berliner Stunden von 6 bis 22 Uhr, im Sommer wie im Winter. Technikstand und Fixture nachgezogen. |
| 7 | mittel | bestätigt | `lauf_bilanz` ordnet Rücknahmen der Woche ihrer Erledigung zu (Kennung in `source_ref`), Rücknahmen zu Erledigungen vor dem Fenster zählen nicht. |
| 8 | mittel | bestätigt | Selbstabschaltung ab fünf Fällen über beide Wochen, jede Woche mit mindestens einem Fall und unter 50 % bleibend. Rechenregel in der Probe. |
| 9 | mittel | verworfen | Wie in Runde 1 und 2: Reiter statt zusammengeführter Dateien ist die dokumentierte Lesart. |
| 10 | mittel | bestätigt | Die Probe sichert den Tageszähler (`hh_lauf_tag`) vorab, stellt ihn im Aufräumen wieder her und prüft ihn beim Rücklesen. |
