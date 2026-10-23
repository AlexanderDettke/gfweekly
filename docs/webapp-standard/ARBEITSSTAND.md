# Arbeitsstand · Webapp Standard (Pilot zur Erprobung)

| | |
| --- | --- |
| Ziel | Organisationsstandards 0.5.0 übernehmen und den Webapp Standard `WEBAPP-PILOT-0.2` (Pilot zur Erprobung) auf die gesamte Webapp anwenden, nachvollziehbar geprüft. |
| Auftrag | Alexander, 21.10.2026, in Claude Code. Zielprojekt gfweekly auf seine Rückfrage ausdrücklich gewählt. |
| Fassungen | Bibliothek 0.5.0 (`55e526d2ad79`), Webapp Standard 0.2, ORG-001 bis 003 0.2.0 (Entwurf), ORG-004 1.0.0 (für die Organisationswerkstatt entschieden). |
| Branch | `paket/webstandard-pilot` auf `origin/main` `05af97b`, eigener Worktree. Nicht gepusht, nicht deployt. |
| Arbeitsradar | Projekt `hub-b6de8edc-4a86-4c3b-ba77-106aeb5440b6`, Arbeitspaket `webstandard-pilot-20261021`. |

## Was umgesetzt ist

Gemeinsame Grundlagen in `site/assets/core.js` und `site/assets/styles.css`, danach alle 25 Seiten (Liste je Fähigkeit: `FUNKTIONSINVENTAR.md`, Abschnitt 0). Neue Prüfung `pruefung/webstandard-pruefung.mjs` (in `pruefung/abnahme.sh` eingebunden) und Vorschau `pruefung/vorschau.mjs`. Kontrastschuld (WP-04) bis auf Messgrenzen abgetragen. Keine Änderung an Edge Functions, Datenbank, Inhalten, Fachbegriffen oder Markenwerten.

## Geprüft

Siehe `PRUEFMATRIX.md`. Kurz: alle bestehenden Prüfungen grün, Webstandard-Prüfung von 70 harten Befunden auf 0, siebzehn Bedienproben bestanden, Rückweg ausprobiert. Alles Oberflächenprüfungen mit abgefangener Edge Function und synthetischen Daten; keine Wirkung in der Datenbank belegt.

## Unabhängige Prüfung

Codex (read-only) gegen den vollständigen Änderungsumfang und den Auftragstext. Runden, geprüfter Stand und Ergebnis: Abschnitt „Review“ unten.

## Offen

L1 bis L8 in `REGELZUORDNUNG.md`, Abschnitt 4. Dazu:

- **Pflicht vor jedem Push: Asset-Version anheben.** Die Seiten laden `core.js` und `styles.css` mit `?v=35`; der Pilot ändert beide Dateien, die Seitenskripte rufen neue Helfer auf (`gfIsoTag`, `gfLadefehler`, `gfDialogAuf`, `gfBereichAuf`). Ohne neue Versionsnummer liefert der Browser-Cache das alte `core.js` zu den neuen Seiten aus, und diese Aufrufe brechen ab. Nach dem Zusammenführen mit Kompass einheitlich auf die höchste Nummer plus eins setzen, auf allen Seiten.
- **Wo der Branch liegt.** `paket/webstandard-pilot` (Commit `dd9b1d5`) liegt im Klon `~/gfweekly`; dort gibt es laut `docs/PAKET-KOMPASS.md` keinen Push-Zugang. Zum Pushen in den Klon holen, aus dem gepusht wird: `git fetch ~/gfweekly paket/webstandard-pilot:paket/webstandard-pilot`.
- **Zusammenführen mit dem Paket Kompass.** Beide Branches setzen auf `05af97b` auf. Konflikte zu erwarten nur in `site/assets/core.js` (Name, Bildmarke; der Pilot ändert andere Zeilen) und in den Asset-Versionen der Seitenköpfe, die der Pilot nicht anfasst. Nach dem Zusammenführen Asset-Version einheitlich erhöhen (die Seiten laden `core.js` und `styles.css` mit `?v=`), sonst sehen Browser alte Dateien.
- **Veröffentlichung** nur auf Alexanders Auftrag: Push nach `main` löst das Netlify-Deployment aus. Danach ausgelieferte Dateien und Hauptwege live prüfen.
- **Fachliche Annahme** durch Alexander (Testaufgaben unten).

## Nächster Schritt

Alexander testet mit `pruefung/vorschau.mjs` (Testdaten) die fünf Aufgaben unten und gibt die Rückmeldung F.2. Danach Entscheidung über Zusammenführen und Veröffentlichen.

## Testaufgaben für Alexander

Vorschau starten (öffnet Chrome mit Testdaten, nichts wird gespeichert):

```sh
git -C ~/gfweekly worktree add ~/gfweekly-webstandard paket/webstandard-pilot   # einmalig
cd ~/gfweekly-webstandard
PLAYWRIGHT_MODUL=~/Documents/GitHub/habitat-hub/node_modules/playwright/index.mjs node pruefung/vorschau.mjs
```

1. **Am Handy-Format lesen.** Fenster schmal ziehen (etwa Handybreite). Öffne Für dich, Board und Jahr. Ist alles ohne seitliches Wischen lesbar? Sind die kleinen Angaben gut lesbar?
2. **Nur mit der Tastatur.** Auf dem Board mit Tab zu einer Karte, Enter öffnet die Details, Escape schließt. Mit Tab zu ⇄, Enter, „Eine Stelle nach unten“. Ist jederzeit klar, wo du bist?
3. **Etwas eintragen, das schiefgeht.** Eingabe öffnen, ohne Text „Ins Board schicken“. Danach einen Text eingeben und senden. Ist klar, was fehlt und was passiert ist?
4. **Liste durchgehen.** In der Liste ein Thema über „Details“ aufklappen, die Priorität per Tastatur ändern, „heute besprochen“ setzen. Fühlt sich das wie vorher an, nur deutlicher?
5. **Hell und dunkel.** In der Seitenleiste auf Hell und zurück. Erledigte Themen, Warnmarken und Abzeichen: gut lesbar, Bedeutung erkennbar?

## Rückmeldevorlage (F.2)

1. Welche Aufgabe hast du getestet?
2. Konntest du sie ohne zusätzliche Erklärung abschließen?
3. War jederzeit klar, was geöffnet, ausgewählt, gespeichert oder bestätigt war?
4. Wo hast du eine Funktion gesucht oder eine andere Wirkung erwartet?
5. Welche bewährte Fähigkeit fehlt oder wurde umständlicher?
6. Was soll vor der Übernahme geändert werden?
7. Ergebnis: geeignet, mit Änderungen geeignet oder nicht geeignet.
8. Gesonderte Entscheidung: Welche Regeln welcher Fassung sollen für welchen Geltungsbereich übernommen werden?

## Review

Unabhängige Gegenprüfung durch Codex (`codex exec -m gpt-6-sol --sandbox read-only`), je Runde eigener Worktree am eingefrorenen Commit, Auftragstext wörtlich im Prompt, keine rekursiven Prüfungen.

| Runde | Geprüfter Stand | Befunde | Bewertung und Folge |
| --- | --- | --- | --- |
| 1 | `871965c` | 9 (4 hoch, 5 mittel) | Alle 9 bestätigt und behoben: Besprechung beenden ohne bestätigtes Speichern (Besprechung, Board), Saison-Rad schloss vor dem Speichern, „heute besprochen“ meldete Erfolg vor der Antwort (alle drei schon im Bestand), Spielkarten aus dem Umfang genommen und selbstschließend, weitere Vortag-Fehler (Liste, Saison-Rad, Übergabe, `gfTomorrow`, Rückfallwerte), Escape-Listener im ⇄-Menü, Tabweg zu kurz und T-05 zu weit bewertet, T-11 „gespeichert“ zu weit formuliert, Review-Status vorweggenommen. Zwei neue Bedienproben. |
| 2 | `5c1bb06` | 8 (2 hoch, 3 mittel, 3 niedrig) | Alle 8 bestätigt und behoben: Board wechselte bei ungespeichertem Entwurf ohne Abwarten, Board-Rückgängig verschluckte Fehler (dabei gefunden: „Rückgängig“ war mit der Maus gar nicht anklickbar), Spielkarten ohne Anfangsfokus, T-12 zu weit bewertet (jetzt Probe mit fester Uhr), Rückweg-Nachweis bezog sich auf einen älteren Stand (neu geprüft), Außenklick-Listener im ⇄-Menü, `aria-pressed` beim Zurücksetzen der Eingabe, zwei veraltete Inventarzeilen. Drei neue Bedienproben. |
| 3 | `596aed7` | 5 (2 hoch, 3 mittel, kein kritischer) | Alle 5 bestätigt und nach der Runde behoben: Antwort 200 ohne Inhalt galt als Erfolg (Eingabe, alle Schreibwege über `gfApi`), Saison-Rad verlor eine Eingabe, wenn eine ältere Antwort sie als gespeichert markierte, „heute“ folgte der Gerätezeitzone statt Europe/Berlin, Spielkarte beim Tippen ohne Ankündigung, verzögerter Fokus nach sehr schnellem Schließen eines Detailbereichs. Drei neue Bedienproben, zwei davon scheitern nachweislich am Stand `596aed7`. |

**Stand der unabhängigen Prüfung:** Drei Runden sind ausgeschöpft (Höchstzahl). Die Korrekturen nach Runde 3 sind technisch geprüft (Abnahme und Bedienproben), aber **nicht mehr unabhängig gegengeprüft**. Eine unabhängige Abnahme wird daher nicht behauptet. Kleinster nächster Schritt: eine gesonderte, kurze Gegenprüfung nur der Commits nach `596aed7`.

## Veröffentlichung und Live-Prüfung

Zusammenführung mit `main` `8d9e804` (18 fremde Commits: Kompass, Vorstandsbüro mit neuer Seite `vorstand.html`, Neuigkeiten). Konflikte in `site/assets/styles.css` (beide Blöcke erhalten), `site/neuigkeiten.html` (dauerhafter Ladefehler aus `main`, dargestellt mit `gfLadefehler`), Technikstand. Asset-Version `?v=38` auf allen 26 Seiten. `pruefung/bedienung.mjs` akzeptiert den einheitlichen Wortlaut „Nicht geladen“. Vor dem Push vollständig bestanden: `pruefung/abnahme.sh` (112 Schirmbilder ohne Meldung, Webstandard-Prüfung 0 harte Befunde auf 29 Ansichten, 17 Bedienproben, Wächter ohne Befund). Push von Alexander: `9eab0ca` nach `main`.

Live-Prüfung am 23.10.2026 auf https://kompass.wildehabitate.de (nur lesend):

| Prüfung | Ergebnis |
| --- | --- |
| Ausgelieferte Dateien | Alle 26 Seiten laden `styles.css?v=38` und `core.js?v=38` (Startseite und Vorstandsbüro `?v=38-vorstand2`); `core.js` enthält `gfLadefehler`, `gfIsoTag`, `gfDialogAuf`, `gfBereichAuf`, `gfBezeichnungen`; `styles.css` enthält den Webstandard-Block |
| Zugangsschutz | Edge Function ohne Passwort: HTTP 401. Tor live mit falschem Passwort: sichtbare Bezeichnung, „Falsches Passwort.“ mit `role="alert"`, Tor bleibt, kein Passwort gespeichert. Sicherheitsheader `x-frame-options DENY`, `nosniff`, `no-referrer`, `noindex` |
| Hauptwege | Alle 26 ausgelieferten Seiten bei 1440 dunkel und 390 hell mit abgefangener Edge Function und Testdaten: Inhalt sichtbar, Sprunglink, neue Helfer geladen, kein seitlicher Überlauf, keine Skriptfehler, keine fehlenden Dateien |
| Nicht geprüft | Anmeldung mit dem echten Passwort und echte Daten (bewusst ohne Zugangsdaten im Kontext); Wirkung schreibender Wege in der Datenbank |

Unabhängig gegengeprüft sind die Korrekturen nach Runde 3 und die Zusammenführung nicht. Fachlich angenommen ist der Stand noch nicht.
