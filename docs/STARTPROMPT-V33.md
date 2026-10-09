# Startprompt V33 So arbeiten wir · Stand 09.10.2026

Arbeite im Repository /Users/alexanderdettke/Documents/GitHub/gfweekly auf main. Vorbereitung aus Cowork liegt unversioniert im Arbeitsbaum (Seite, Funktion, Migrationen, Paket, Prüfauftrag, Menüpunkt, Assets ?v=33); erster Schritt ist `git status`, dann ein Commit „V33 So arbeiten wir: Stand aus Cowork“ auf main, damit der Ausgangspunkt fest ist. Nicht committen: den Ordner `undefined/` (Versehen, löschen) und `docs/SESSION-REVIEW-2026-10-04-gfweekly-launch-hub.md` nur, wenn es inhaltlich ins Repo gehört.

Lies zuerst vollständig: docs/PAKET-V33-SO-ARBEITEN-WIR.md, docs/reviews/V33-pruefauftrag.md, docs/TECHNIKSTAND.md (Abschnitte Besetzung B1 und V32, als Muster für eigene Edge Functions und Abnahmen), site/besetzung.html (als Muster einer Seite mit eigener Funktion).

Auftrag: Teilpakete V33a bis V33d in einem Zug, ohne Pause dazwischen. Die Entscheidungen im Paket sind getroffen; du stellst sie nicht erneut. Technische, umkehrbare Details entscheidest du selbst. Ziel: die Seite https://hohes-haus.netlify.app/arbeiten.html ist heute Vormittag live und Alex und Lea können damit arbeiten.

## Rollen

Codex ist der Ausführer, du (Claude Code) bist der Prüfer und der Koordinator.

1. Je Teilpaket startest du Codex mit Schreibrecht im Repo und dem Auftrag aus dem Paket:
   codex exec --sandbox workspace-write -C "$PWD" --output-last-message /tmp/v33-codex-<teilpaket>.md "Lies docs/PAKET-V33-SO-ARBEITEN-WIR.md und setze Teilpaket <V33x> vollständig um. Ändere nur, was das Teilpaket verlangt. Committe am Ende auf main mit der Nachricht 'V33x: <kurz>'. Schreibe als letzte Nachricht: Commit-SHA, geänderte Dateien, was du geprüft hast, was offen ist."
2. Danach prüfst du den Commit nach docs/reviews/V33-pruefauftrag.md (git diff, Datei und Zeile) und schreibst die Befunde nach docs/reviews/V33<x>-runde-<n>.md. Gibt es Befunde der Schwere schwer oder mittel, bekommt Codex eine weitere Runde mit genau diesen Befunden (höchstens drei Runden je Teilpaket). Jedes Verwerfen eines Befunds muss Codex belegen; du entscheidest, ob der Beleg trägt.
3. V33d (Push, Live-Prüfung) führst du selbst aus oder lässt es Codex tun; der Push nach origin/main ist Teil des Auftrags, nicht eine Frage an Alex.

## Wenn Token ausgehen

- Lege gleich zu Beginn pruefung/v33-codex-allein.sh an: ein Skript, das die vier Teilpakete nacheinander mit `codex exec --sandbox workspace-write` ausführt und nach jedem Teilpaket Codex selbst mit dem Prüfauftrag prüfen lässt (eine Runde), ohne dich. Teste nur, dass das Skript startet (`bash -n`).
- Merkst du, dass dein Kontext oder dein Kontingent knapp wird (Warnung des Werkzeugs, oder du musst anfangen zu kürzen): beende sauber mit einem Commit des Stands, schreibe in docs/reviews/V33-uebergabe.md, welches Teilpaket wo steht, und starte als letzte Handlung `bash pruefung/v33-codex-allein.sh` im Hintergrund (nohup, Log nach /tmp/v33-codex-allein.log). Danach läuft es ohne dich weiter.
- Meldet Codex ein erschöpftes Kontingent oder ein Limit (Fehlermeldung mit rate limit, quota, usage limit, oder keine Antwort nach zwei Versuchen), übernimmst du die Umsetzung des laufenden und der restlichen Teilpakete selbst und prüfst dich mit demselben Prüfauftrag; die Prüfung dann als eigene Runde dokumentieren, nicht weglassen.

## Grenzen

- Nichts an der Edge Function gfweekly ändern. Keine Lösungsfunktionen in die Seite bauen (keine Anfragen, Zusagen, Erreichbarkeit). Keine Bewertungen von Personen, keine Hinweise auf Gesundheit in Oberfläche oder Daten.
- Was nur Alex tun kann, schreibst du als eine Zeile in FRAGEN_FUER_MORGEN.md mit Dauer und genauem Schritt und baust weiter.
- Die Info-Mail an Alex und Lea verschickt ein geplanter Cowork-Auftrag, sobald die Seite live ist. Nichts zusätzlich verschicken.

Abschlussmeldung im Chat: höchstens zehn Zeilen. Oben, was Alex tun muss und wie lange es dauert. Darunter Live-Adresse, Funktionsversion, offene Punkte. Alles andere steht im Technikstand.
