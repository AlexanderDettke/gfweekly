# Stand Stufe 1 · Entscheiden können (25.10.2026)

Stand nach Push und Live-Prüfung am 25.10.2026 abends; die Zahlen stammen aus der Live-Liste.

1. Die Entscheidungsliste der Geschäftsführung ist live: 39 offene Entscheidungen aus 10 Vorhaben-Punkten, 24 Themen und 5 Kandidaten, davon 21 reif (mit Frist, Vorschlag oder formulierter Frage), 18 noch ohne Frage, 6 überfällig oder diese Woche, 2 überfällig; der Korb „Ohne Vorhaben“ zeigt 40 Einträge.
2. Die Fragen sind bis zum Erstlauf E1 des Laufs noch die Titel der Quellen; der Lauf formuliert sie, Alex und Lea können sie jederzeit selbst fassen (Stift in der Zeile).
3. Umgesetzt sind die Abschnitte 1 bis 7 des Pakets auf dem Branch `stufe-1/entscheidungen`; die vier Migrationen sind live angewendet.
4. Technisch geprüft: Abnahme bestanden (Schirme, Bedienung, Webstandard, Wächter); die Wirkungsprobe gegen das echte Backend mit dem deployten Endstand `48090da` (Live-Dateien byte-gleich, `ping` 41) besteht alle 50 Proben, darunter Rückgängig-Konflikt, veraltete Quelle, paralleles Sammeln, Sitzungskennung am Beschluss und „Besprechung beenden schreibt keine Punkte“; Testdaten danach gelöscht und zurückgelesen.
5. Unabhängig geprüft: drei Codex-Runden mit 9, 4 und 6 Befunden, alle bestätigt und behoben; die Korrekturen nach Runde 3 sind getestet, aber nicht mehr unabhängig geprüft (drei Runden sind das Maximum).
6. Veröffentlicht: ja. Alex hat `stufe-1/entscheidungen` als `83f73d5` nach `main` gepusht (Live-Prüfung auf kompass.wildehabitate.de bei 1440 und 390 px, dunkel und hell, ohne Konsolenfehler bestanden) und die Edge Function im Endstand `48090da` deployt.
7. Fachlich angenommen: nein; dafür ist die Testaufgabe aus Abschnitt 9 nötig (am Handy in unter fünf Minuten lesen, zwei entscheiden, eine vertagen, eine abgeben, Besprechung starten und beenden).
8. Was Alex tun muss: „gepusht“ im Cowork-Chat melden, damit die Lauf-Regeln aus `docs/auftraege/STUFE1-NEUIGKEITEN-ABSCHNITTE.md` eingespielt werden und der Erstlauf E1 läuft.
9. Was Alex wissen muss: Abgegebene Entscheidungen verschwinden aus der Liste und kommen zurück, sobald der Ausgang wieder auf GF steht; Rückgängig gilt 24 Stunden und nur, solange niemand die Quelle danach geändert hat; die Spielschicht ist aus und kommt mit `GF_SPIEL=true` in `core.js` zurück.
10. Vorhaben GLS (Ball GF, Frist verstrichen, kein GF-Punkt) steht nicht in der Liste; diese Lücke schließt Stufe 2.
