# Stand Stufe 1 · Entscheiden können (25.10.2026)

Vorläufig, bis Push und Live-Prüfung durch sind; die Zahlen stammen aus der Erstbefüllung am 25.10.2026.

1. Die Entscheidungsliste der Geschäftsführung ist gebaut: 39 Entscheidungen aus 10 Vorhaben-Punkten, 24 Themen und 5 Kandidaten, davon 21 reif (mit Frist, Vorschlag oder formulierter Frage) und 18 noch ohne Frage.
2. Die Fragen sind bis zum Erstlauf E1 des Laufs noch die Titel der Quellen; der Lauf formuliert sie, Alex und Lea können sie jederzeit selbst fassen (Stift in der Zeile).
3. Umgesetzt sind die Abschnitte 1 bis 7 des Pakets auf dem Branch `stufe-1/entscheidungen`; die drei Migrationen sind live angewendet.
4. Technisch geprüft: Abnahme bestanden (Schirme, Bedienung, Webstandard, Wächter) und die Wirkungsprobe gegen das echte Backend mit 44 Proben (Edge Function Version 41, deployt von Alex am 25.10.2026, Live-Stand byte-gleich mit dem Commit; Testdaten danach gelöscht und zurückgelesen).
5. Unabhängig geprüft: Codex-Runde 1 mit 9 und Runde 2 mit 4 Befunden, alle behoben; Runde 3 folgt.
6. Veröffentlicht: Edge Function ja (Version 41); die Seiten noch nicht, der Push nach `main` steht aus.
7. Fachlich angenommen: nein; dafür ist die Testaufgabe aus Abschnitt 9 nötig (am Handy in unter fünf Minuten lesen, zwei entscheiden, eine vertagen, eine abgeben, Besprechung starten und beenden).
8. Was Alex tun muss: nach der letzten Codex-Runde den Push nach `main` (Befehl in der Sitzung), dann „gepusht“ im Cowork-Chat melden, damit die Lauf-Regeln aus `docs/auftraege/STUFE1-NEUIGKEITEN-ABSCHNITTE.md` eingespielt werden und der Erstlauf E1 läuft.
9. Was Alex wissen muss: Abgegebene Entscheidungen verschwinden aus der Liste und kommen zurück, sobald der Ausgang wieder auf GF steht; Rückgängig gilt 24 Stunden und nur, solange niemand die Quelle danach geändert hat; die Spielschicht ist aus und kommt mit `GF_SPIEL=true` in `core.js` zurück.
10. Vorhaben GLS (Ball GF, Frist verstrichen, kein GF-Punkt) steht nicht in der Liste; diese Lücke schließt Stufe 2.
