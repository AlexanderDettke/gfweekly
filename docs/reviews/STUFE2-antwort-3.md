# Antwort auf Codex-Runde 3 · Stufe 2 · Ein Behälter

Geprüfter Stand: `d06a707`. Befunde in `STUFE2-runde-3.md` (2 schwer, 8 mittel). Korrekturen in Migration
`20261026030000_stufe2_runde3.sql` (angewendet am 26.10.2026) und im Commit „fix(stufe2): Runde 3“. Das war die dritte und letzte
Runde: diese Korrekturen sind **nicht mehr unabhängig geprüft**, nur durch Bedienproben, Schirme, Webstandard, Abnahme und die
Wirkungsproben gegen das echte Backend (Stufe 2 und Stufe 1).

| Nr | Schwere | Bewertung | Was geändert ist |
| --- | --- | --- | --- |
| 1 | schwer | bestätigt | Neue Datenbankfunktion `hh_handover_erledigt(p_id, p_by)`: schließt bei einer Vorhaben-Zeile das Vorhaben (`hh_vorhaben_abschliessen`, Punkte mit) und setzt die Korbzeile `erledigt` in einer Transaktion; zweiter Aufruf 409. Aktion `handover_erledigt`, die Übergabe ruft nur noch diese. Wirkungsprobe liest beide Zustände zurück und prüft den zweiten Aufruf. |
| 2 | schwer | bestätigt | „Nächste Fristen“ auf Für dich nimmt keine `gate_frist` von Themen und Kandidaten mehr, sondern die Fristen offener und vertagter Entscheidungen (`entscheidungen_list`, Quelle Person oder Punkt). Seit der Auflösung gab es ohnehin keine offenen Themen; neue Kandidaten erreichen die Startseite nicht mehr über ein Laufdatum. |
| 3 | mittel | bestätigt | `hh_absence_end_s2` findet den Nachfolger eines Themas (oder Kandidaten) auch über den Punkt der Auflösung (`quelle 'thema:<id>'`); Zeilen ohne Nachfolger und nie bestätigte Vorschläge stehen je Zeile einzeln und ungekürzt im Übergabeprotokoll. |
| 4 | mittel | bestätigt (Teil) | `hh_lauf_rueckgaengig` akzeptiert nur einen Eintrag, der nicht vor `erledigt_at` entstand (der Eintrag der Erledigung entsteht in derselben Transaktion wie `erledigt_at`, `hh_punkt_toggle`); ein älterer Eintrag einer früheren Erledigung wird abgelehnt, verworfen werden nur Einträge ab diesem Zeitpunkt. Eine eigene Ereigniskennung am Punkt wäre eine neue Spalte an `hh_vorhaben_punkte`; der Zeitpunkt der Transaktion ist hier eindeutig genug. |
| 5 | mittel | bestätigt | `rueckkehr_lage` führt zuerst `hh_entscheidungen_sammeln` aus; eine Entscheidung zu einem inzwischen erledigten Punkt steht dann nicht mehr unter „Wartet“. |
| 6 | mittel | bestätigt | „Nach Menschen“ enthält auch die in der Abwesenheit erledigten Punkte und entschiedenen Fragen (mit Status „erledigt“ oder „entschieden“, ohne Knöpfe), gruppiert nach `wer`. |
| 7 | mittel | bestätigt (Teil) | Bilanz: Verlauf aller automatischen Urheber (wie der Verfall: `created_by` nicht Alex, Lea, kompass); Vorschläge werden am `tag` „Vorschlag …“ erkannt und als erzeugt gezählt, auch wenn ihr Status später wechselt; `vorschlaege_uebernommen` in der Woche von `status_at`; Trefferquote = übernommene Vorschläge und Kandidaten an allen erzeugten. Eine Zwei-Wochen-Probe mit Erzeugung, Übernahme, Verfall und Rücknahme braucht Zeitreisen in den Daten; die Wirkungsprobe prüft Erledigung und Rücknahme, der Rest ist Lesecode über `status_at`. |
| 8 | mittel | bestätigt | `berlinVersatz` misst den Versatz nahe der jeweiligen Tagesgrenze (Beginn: zwei Stunden vor 00:00 UTC des Tages, Ende: zwei Stunden vor 23:59 UTC), damit am 25.10.2026 der Beginn `+02:00` und das Ende `+01:00` trägt. |
| 9 | mittel | bestätigt | Die Edge Function verlangt `expect_updated_at` je Zeile der Sammelaktion (sonst 400); Liste und Besprechung senden ihn, die Wirkungsprobe prüft die Ablehnung. Die Datenbankfunktion bleibt für SQL-Aufrufe tolerant. |
| 10 | mittel | bestätigt | Migration beendet `hh_themen_erledigt_archivieren` (`cron.unschedule`), zurückgelesen: 0 Einträge; `hh_news_verfall` bleibt (Kandidaten verfallen weiter nach 14 Tagen). |

Nebenbefund des Prüfers: der Abnahmebeleg im Repo nannte beim Review `30636f2`; der Beleg wird mit dem Endstand neu geschrieben und mit
dem Push committet.
