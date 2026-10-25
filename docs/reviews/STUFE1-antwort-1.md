# Antwort auf Runde 1 · Stufe 1 (25.10.2026)

Geprüfter Stand: `fd6c992`. Alle neun Befunde sind bestätigt und behoben; Korrekturen in der zweiten Migration
`20261025163000_stufe1_korrekturen.sql` (in einer zurückgerollten Transaktion geprobt, dann live angewendet) und im Code.

| Nr | Schwere | Befund | Antwort |
| --- | --- | --- | --- |
| 1 | schwer | Rückgängig überschreibt spätere Änderungen am Original | Bestätigt. Jede Aktion merkt sich zusätzlich den Stand des Originals nach der Aktion (`rueckweg.nach`); `hh_entscheidung_zurueck` sperrt die Quelle und bricht mit PT409 ab, wenn der aktuelle Stand davon abweicht. Probe: Punkt entschieden, `wer` geändert, Rückgängig 409; Stand zurück, Rückgängig gelingt. Live-Probe ergänzt. |
| 2 | schwer | Aktionen wirken auf ungültige Quellen, abgegebene Zeilen entscheidbar | Bestätigt. `hh_en_quelle_eignung` sperrt die Quelle (`for update`) und prüft die Regeln aus Abschnitt 1 erneut; Entscheiden, Vertagen, Abgeben nur bei Status offen oder vertagt, sonst PT409 mit Hinweis. Abgegebene Zeilen zeigen keine Aktionsknöpfe mehr; `sammeln` holt sie zurück, sobald die Quelle wieder bei der GF liegt (Ausgang gf, Punkt wieder GF). Probe: archiviertes Thema 409, abgegebene Zeile 409, Ausgang zurück auf gf → wieder offen. |
| 3 | schwer | Korbzuordnung nur teilweise gespeichert | Bestätigt. `hh_korb_zuordnen` erledigt Anlegen (über `hh_vorhaben_neu`), Zuordnen mit Schutz gegen Doppelzuordnung und Verlaufseintrag in einer Transaktion; die Edge Function berechnet nur den Slug (mit Wiederholung bei Kollision). Dabei gefunden: ein volatiler Aufruf im WHERE lief je geprüfter Zeile; jetzt erst in eine Variable. |
| 4 | mittel | Beschlüsse ohne `session_id` | Bestätigt. `hh_entscheidung_entscheiden(p_id, p_ergebnis, p_by, p_session)`; die Besprechung schickt `session_id`, der Beschluss trägt sie, wenn es die Sitzung gibt (sonst null statt Fremdschlüsselfehler). Bedienprobe prüft die Nutzlast, Live-Probe die Tabelle. |
| 5 | mittel | Gleichzeitiges Sammeln verletzt die Eindeutigkeit | Bestätigt. `INSERT … ON CONFLICT (quelle_art, quelle_id) DO NOTHING`; die Live-Probe ruft die Liste zweimal gleichzeitig auf. |
| 6 | mittel | Materialklappe zählt vertagte als „ohne Entscheidung“ | Bestätigt. `entscheidungen_list` liefert `erfasst` (alle Quellkennungen nicht hinfälliger Zeilen); die Klappe gleicht dagegen ab. Bedienprobe: vertagtes und abgegebenes Thema erscheinen nicht. |
| 7 | mittel | Drei-Zeilen-Grenze am Handy fehlt | Bestätigt. Bei höchstens 600 px: geschlossene Zeile mit Frage in zwei Zeilen, Herkunft in einer, Vorschlag erst aufgeklappt (Klasse `auf`). Bedienprobe misst Zeilen und Sichtbarkeit. |
| 8 | mittel | `GF_SPIEL=true` stellt die Abzeichen nicht wieder her | Bestätigt. Abschnitt `#abzeichen` mit Leiste ist wieder in `entscheidungen.html`, versteckt und nur mit Spielschicht gefüllt (`gf-game`); die Sprungmarke aus `jahr.html` trifft wieder. |
| 9 | mittel | `docs/STAND-STUFE-1.md` fehlt | Bestätigt. Datei angelegt; Zahlen und Kategorien werden nach Deploy, Push und Live-Prüfung nachgetragen. |

Empfehlungen: Nebenläufigkeit, veraltete Quellen und Teilschritte sind in `pruefung/entscheidungen-probe.mjs` (Live-Teil) aufgenommen; eine Besprechung mit Sitzungsbezug bis zur Anzeige der Beschlüsse steht als Testaufgabe für Alex und Lea (Abschnitt 9), die Bedienprobe deckt den Weg bis zum Protokoll ab.
