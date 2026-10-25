# Stand Stufe 1 · Entscheiden können (25.10.2026)

Vorläufig, bis Push und Live-Prüfung durch sind; die Zahlen stammen aus der Erstbefüllung am 25.10.2026.

1. Die Entscheidungsliste der Geschäftsführung ist gebaut: 39 Entscheidungen aus 10 Vorhaben-Punkten, 24 Themen und 5 Kandidaten, davon 21 reif (mit Frist, Vorschlag oder formulierter Frage) und 18 noch ohne Frage.
2. Die Fragen sind bis zum Erstlauf E1 des Laufs noch die Titel der Quellen; der Lauf formuliert sie, Alex und Lea können sie jederzeit selbst fassen (Stift in der Zeile).
3. Umgesetzt sind die Abschnitte 1 bis 7 des Pakets auf dem Branch `stufe-1/entscheidungen`; die vier Migrationen sind live angewendet.
4. Technisch geprüft: Abnahme bestanden (Schirme, Bedienung, Webstandard, Wächter); die Wirkungsprobe gegen das echte Backend lief mit dem Deploy des Stands `81cb76e` (Runde 1; Live-Dateien damals byte-gleich, `ping` 41) mit 44 Proben und nach den Datenbankkorrekturen aus Runde 2 mit 47 Proben; Testdaten danach gelöscht und zurückgelesen. Die Änderungen an der Edge Function aus Runde 2 und 3 sind noch nicht deployt.
5. Unabhängig geprüft: drei Codex-Runden mit 9, 4 und 6 Befunden, alle bestätigt und behoben; die Korrekturen nach Runde 3 sind getestet, aber nicht mehr unabhängig geprüft (drei Runden sind das Maximum).
6. Veröffentlicht: Edge Function im Stand von Runde 1 (Version 41); der Endstand braucht einen weiteren Deploy mit Dateivergleich und `ping`; die Seiten erst nach dem Push nach `main`.
7. Fachlich angenommen: nein; dafür ist die Testaufgabe aus Abschnitt 9 nötig (am Handy in unter fünf Minuten lesen, zwei entscheiden, eine vertagen, eine abgeben, Besprechung starten und beenden).
8. Was Alex tun muss: den Endstand der Edge Function deployen und den Push nach `main` ausführen (beide Befehle in der Sitzung), dann „gepusht“ im Cowork-Chat melden, damit die Lauf-Regeln aus `docs/auftraege/STUFE1-NEUIGKEITEN-ABSCHNITTE.md` eingespielt werden und der Erstlauf E1 läuft.
9. Was Alex wissen muss: Abgegebene Entscheidungen verschwinden aus der Liste und kommen zurück, sobald der Ausgang wieder auf GF steht; Rückgängig gilt 24 Stunden und nur, solange niemand die Quelle danach geändert hat; die Spielschicht ist aus und kommt mit `GF_SPIEL=true` in `core.js` zurück.
10. Vorhaben GLS (Ball GF, Frist verstrichen, kein GF-Punkt) steht nicht in der Liste; diese Lücke schließt Stufe 2.
