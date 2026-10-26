# Antwort auf Codex-Runde 1 · Stufe 3 · Lauf im Kompass

Geprüfter Stand: `5f2f609`. Befunde in `STUFE3-runde-1.md` (8 schwer, 8 mittel). Korrekturen in Migration
`20261026130000_stufe3_runde1.sql` (angewendet am 26.10.2026) und in den Commits „fix(stufe3): Runde 1“ bis `3ab7bcc`.

| Nr | Schwere | Bewertung | Was geändert ist |
| --- | --- | --- | --- |
| 1 | schwer | bestätigt | `aus` beendet den Tick vor jeder Verarbeitung, auch mit `mails` in der Nutzlast; ein ausdrücklicher Probelauf läuft als `probe`. Probe: Modus aus mit Nutzlast → `uebersprungen`. |
| 2 | schwer | bestätigt | `postfach` wird gegen `hh_lauf_einstellungen.postfaecher` geprüft (Tick und Google-Probe); `fixtures` nur zusammen mit `mails`. Probe: fremdes Postfach 400. |
| 3 | schwer | bestätigt (Lesart) | Nutzlast-Mails schreiben außerhalb des Probelaufs nur an Vorhaben mit „(Test)“ im Titel; alles andere wird als `uebersprungen` protokolliert. So bleibt die Wirkungsprobe (Live auf einem Testvorhaben) möglich, Produktionsakten sind über die Nutzlast unerreichbar. Das Kompass-Passwort erlaubt ohnehin `punkt_toggle` direkt; die Grenze schützt vor erfundenen „Belegen“ im Verlauf. |
| 4 | schwer | bestätigt | `schluessel` trägt den Modus; übersprungen wird nur, was im selben Modus schon protokolliert oder tatsächlich ausgeführt ist. Probe: dieselbe Mail nach dem Probelauf im Modus live → erledigt. |
| 5 | schwer | bestätigt (Teil) | Der Cursor rückt nur vor, wenn das Fenster vollständig gelesen war (weniger als `batch` Treffer); sonst holt der nächste Tick das Fenster erneut, Dubletten fängt das Protokoll. Gmail-Seiten werden nicht fortgesetzt (ein Tick, ein Postfach, höchstens `batch`), das ist die Grenze aus Abschnitt 2.2. |
| 6 | schwer | bestätigt | Kandidaten ohne `gate` (nur `vorhaben_vorschlag`, `gate_frist` als Datum aus der Quelle); `hh_entscheidungen_sammeln` legt dafür keine Entscheidung an. Probe: Kandidat mit `gate null`. |
| 7 | schwer | bestätigt | `hh_lauf_erledigt` erledigt den Punkt und schreibt den Beleg in einer Transaktion (lehnt erledigte und zurückgenommene Punkte ab); alle Upserts prüfen Fehler (`schreibe`). |
| 8 | schwer | bestätigt (Teil) | Filter auf Beleg, Betreff (`source_title`) und Kandidat; Wortliste um Bewertungen (ungeeignet, unfähig, inkompetent, unzuverlässig, Abmahnung, Kündigung, privat) erweitert. Eine Wortliste bleibt eine Wortliste; die Prompt-Regel und die Rückfrage in der Akte (Vorschläge sind Vorschläge) tragen den Rest. |
| 9 | mittel | bestätigt (Teil) | Kontext mit `kontext_ab` (bei `after` automatisch): Punkte, die seither erledigt wurden, bleiben in der Vergleichsliste (mit `erledigt_am`), schon erledigte werden nur protokolliert. Einwurf-Mails werden Einwürfe mit KI-Vorschlag (Regel D), Plattform-Feeds werden Quellen (Regel E). Verlaufseinträge als Quelle bleiben außen vor (sie sind Ergebnis, nicht Beleg). Der Vier-Wochen-Rückblick selbst wartet auf den Google-Zugang; die Stichprobe heißt im Technikstand Stichprobe. |
| 10 | mittel | bestätigt | Zwei getrennte Wochen, jede mit mindestens drei Erledigungen und unter 50 % bleibend (`abschaltungFaellig`). Probe mit Einträgen heute und vor neun Tagen. |
| 11 | mittel | bestätigt | Ruhende Zeilen nicht im Fokus, nicht in Kachel „im Fokus“, Fristwort „ruht seit 60 Tagen“, Zähler „überfällig“ und „diese Woche“ ohne ruhende Zeilen. |
| 12 | mittel | bestätigt | Zwei Jobs: `hh_lauf_tick_sommer` (`7 4-20/2 * 4-10 *`) und `hh_lauf_tick_winter` (`7 5-21/2 * 11,12,1,2,3 *`); Monatsgrenzen statt exakter Umstellungstage, die Abweichung ist je eine Stunde an wenigen Tagen. |
| 13 | mittel | verworfen | Reiter statt zusammengeführter Dateien ist die dokumentierte Lesart (Technikstand): gleiche Wirkung in der Navigation (14 Einträge), kein Umbau von fünf Seiten, keine Weiterleitungsschleifen, bestehende Links und Proben bleiben gültig. Eine Zusammenführung der Dateien hätte keinen Nutzen für Alex und Lea und wäre ein eigenes Paket. |
| 14 | mittel | bestätigt | Aufräumen löscht Abschaltungszeile und -ticker ab Teststart (`K.start`) und zählt sie in der Schlussprüfung; Abschaltungen sind je Ereignis eindeutig (Zeitstempel). |
| 15 | mittel | bestätigt | Kriterium d: höchster Tageswert je Berliner Tag und Zahl der Tage über dem Deckel, nur ausgeführte Sichtungen. |
| 16 | mittel | bestätigt | Alle Schreibpfade folgen dem effektiven Modus: im Probelauf kein Ticker, kein „letzter Lauf“, kein Cursor. |

Dazu zwei Fehlgriffe, die erst die Wirkungsprobe fand: `gfweekly_news.source` hat einen CHECK (Ticker schreiben jetzt `notiz`), `source_url`
ist NOT NULL (leerer Text statt null). Beide hätten den ersten echten Lauf still scheitern lassen.
