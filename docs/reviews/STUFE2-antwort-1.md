# Antwort auf Codex-Runde 1 · Stufe 2 · Ein Behälter

Geprüfter Stand: `a2a7acb` (Branch `stufe-2/ein-behaelter`). Befunde in `STUFE2-runde-1.md` (5 schwer, 7 mittel). Korrekturen in
Migration `20261026000000_stufe2_runde1.sql` (angewendet am 26.10.2026) und im Commit „fix(stufe2): Runde 1“.

| Nr | Schwere | Bewertung | Was geändert ist |
| --- | --- | --- | --- |
| 1 | schwer | bestätigt | `hh_entscheidung_umhaengen` prüft die Zielquelle über `hh_en_quelle_eignung` (fehlt → `PT409` „Die neue Quelle gibt es nicht“, erledigt/archiviert/nicht bei der GF → `PT409`) und `p_by` über `hh_en_person`. Probe: Umhängen auf fehlende und auf belegte Quelle abgelehnt. |
| 2 | schwer | bestätigt | `hh_entscheidung_zurueck` stellt bei Themen `archived` und `archiv_grund`, bei Kandidaten `archiviert_at` aus dem Original wieder her. Probe: Hinfällig am Thema, Rückgängig, erneut Hinfällig, erneut zurück. |
| 3 | schwer | bestätigt | „Erledigt“ auf der Übergabe schließt bei einer Vorhaben-Zeile das Vorhaben (`vorhaben_abschliessen` mit `punkte_mit`, Rückfrage nennt Gegenstand und Folge) und danach die Korbzeile; bei anderen Zeilen nur die Korbzeile. Die Punkte eines Vorhabens bleiben im Dossier (der Korb führt Vorhaben, Abschnitt 5.1); ein eigener Punkt-Knopf je Zeile wäre eine neue Oberfläche und ist nicht Teil des Pakets. Bedienprobe für beide Fälle. |
| 4 | schwer | teilweise | Unbestätigte Vorschläge waren nie Arbeit der Vertretung; ein Verlaufseintrag je Vorschlag würde in jeder Akte mit Ball GF eine Zeile je Abwesenheit erzeugen (so geschehen bei der ersten Wirkungsprobe, 7 Einträge, entfernt). Sie entfallen beim Ende jetzt ausdrücklich (`status entfallen`, Antwort `entfallen`), bleiben aber im Rückkehr-Lagebild unter „Wartet“, solange die Abwesenheit läuft. Verlaufseintrag nur für bestätigte Zeilen. Lesart im Technikstand. |
| 5 | schwer | bestätigt | `hh_absence_end_s2` legt Ende, Rückgabe und Korbabschluss in eine Transaktion; die Edge Function ruft nur noch diese Funktion. Probe: genau eine liegen gebliebene Zeile, ein Verlaufseintrag, keine offene Korbzeile. |
| 6 | mittel | bestätigt (Teil) | „Hinfällig“ bricht bei `hh_en_quelle_eignung` `null` oder `false` mit `PT409` ab. Eine fehlende `expect_updated_at` bleibt erlaubt (wie in Stufe 1 für alle Aktionen; die Oberfläche schickt sie immer). |
| 7 | mittel | bestätigt | Im Korbaufbau wird „vorher“ nur gesetzt, wenn ein offener Punkt des Vorhabens eine Frist vor der Abreise trägt (Punktfristen setzen Personen); sonst „ruht“ mit Regelhinweis. |
| 8 | mittel | bestätigt | „Nach Menschen“ führt offene und vertagte Entscheidungen unter „GF gemeinsam“, abgegebene bei der Person; Mock und Bedienprobe gleichgezogen (Lea, Alex, GF gemeinsam, übrige). Entschiedene Einträge gehören nicht zu „wer hat etwas zu tun“ und bleiben in den Phasenblöcken. |
| 9 | mittel | bestätigt | Tagesgrenzen über `Intl` mit `Europe/Berlin` (`berlinVersatz`), `+01:00` oder `+02:00` je Kalendertag. |
| 10 | mittel | bestätigt (Teil) | Erledigungen zählen als Ereignisse aus dem Verlauf (`created_by lauf`, „Punkt erledigt: …“) und bleiben nach Rückgängig erhalten; Rücknahmen (`source_ref rueckgaengig:lauf:%`) eigens ausgewiesen (`zurueckgenommen`, auch auf Für dich). Verfall und Verwerfen zählen weiter nach der Woche des Eintrags: der Verlauf führt keinen Änderungszeitpunkt, eine neue Spalte dafür wäre ein eigenes Paket. Probe prüft Erledigung und Rücknahme. |
| 11 | mittel | bestätigt | Der Dialog „Nicht jetzt“ auf der Liste belegt den ersten Montag nach vier Wochen vor (wie die Datenbankregel). |
| 12 | mittel | bestätigt | „Für dich“ nimmt keine Kandidaten mit `relevance hoch` mehr in die fünf Minuten; Kandidaten gehören in den Korb auf Vorhaben. |

Nachtrag zu Befund 2: die erste Fassung der Korrektur hatte `hh_entscheidung_zurueck` aus der Stufe-1-Grundmigration statt aus `20261025163000` (mit Vergleichsstand und 409) abgeleitet; die Stufe-1-Wirkungsprobe fand es (4 Befunde), die Migration ist auf die richtige Grundlage gesetzt und erneut angewendet, beide Proben danach vollständig grün.

Empfehlungen: negative Fälle (1, 2, 5) und Bilanz-Rücknahme sind in `pruefung/stufe2-probe.mjs`; `docs/STAND-STUFE-2.md` entsteht nach dem Push.
Nebenbefund aus der Abnahme nach Runde 1: die Suchfelder (`board.html`, `cockpit.html`, `seiten.html`) zeigten den Fokusring nur am Rahmen,
nicht am Feld; seit Stufe 2 erreicht die Tastaturprobe sie innerhalb ihrer Schrittzahl. Ring jetzt am Feld (`.search input:focus-visible`).
