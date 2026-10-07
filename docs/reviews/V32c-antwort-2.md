# Antwort auf Review V32c, Runde 2 (Codex, Commit 518d25d)

Alle fünf Befunde bestätigt und behoben, je mit Probe in `pruefung/komm-aktionen-probe.ts` Abschnitt 15 (95 ok).

1. **schwer, Dublette nach verlorener Antwort.** Eine Anlage mit unklarem Ausgang wird im selben Aufruf nie wiederholt, auch nicht nach einem Nachsehen; der Lauf unterbricht mit Hinweis. Der nächste Aufruf liest das Projekt zu Beginn neu und findet eine doch angelegte Aufgabe über den Namen.
2. **schwer, zweites Projekt nach Sperrverlust, Fortschritt überschrieben.** Die Sperre wird unmittelbar vor jeder Änderung in Asana geprüft und verlängert (Projektanlage nach der Teamsuche, zweiter Anlageversuch, Mitgliedschaft, Beschreibung, Abschnitte, Leeren des „Untitled section“, jede Aufgabe und jede Übernahme). Fortschritt wird nur gespeichert, solange die Sperre gehalten wird; ein abgelöster Lauf schreibt nichts mehr.
3. **schwer, Projektwechsel während einer Fortsetzung.** Der Versandlauf ist an sein Zielprojekt gebunden (Spalte `projekt`, Migration `20261007074130_hh_komm_v32d.sql`); wechselt das Projekt, beginnt ein neuer Lauf, der jede Aufgabe gegen das neue Projekt prüft.
4. **schwer, übersprungene Kennungsspeicherung.** Eine Aufgabe gilt erst als erledigt, wenn ihre Kennung an allen zugehörigen Veröffentlichungen steht; sonst wird sie beim nächsten Aufruf nachgeholt. Abgeschlossen ist ein Lauf nur, wenn jede Rahmenaufgabe erledigt ist. Eine in Asana gelöschte Aufgabe gilt als bearbeitet (bewusst nicht neu angelegt, steht im Bericht).
5. **mittel, Fortsetzungszeitpunkt.** `fortsetzen_ab` steht im Versandlauf (Spalte, Migration v32d); vor diesem Zeitpunkt antwortet `komm_send` ohne Anfrage an Asana mit der Uhrzeit.

Empfehlungen: Abschluss aus tatsächlich erledigten Aufgaben abgeleitet; Lauf an Zielprojekt gebunden. Zum Asana-Test: der Lauf vom 07.10.2026 gegen „Kommunikation TEST“ lief mit Commit `aa68031` (vor der Fortschrittslogik); nach dieser Runde wird der Test vor dem echten Versand wiederholt.
