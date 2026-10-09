# Prüfauftrag V33 · für den Prüfer (read-only)

Du prüfst einen Commit im Repo des Hohen Hauses (internes Cockpit der Geschäftsführung von Alex und Lea, statische Seiten in `site/`, eigene Edge Function `supabase/functions/arbeiten/index.ts`, Migrationen in `supabase/migrations/`). Grundlage ist `docs/PAKET-V33-SO-ARBEITEN-WIR.md`, maßgeblich ist der Abschnitt des genannten Teilpakets. Du änderst nichts, du lieferst Befunde und Empfehlungen. Der Ausführer arbeitet deine Befunde ab und muss jedes Verwerfen belegen. Sei konkret: Datei und Zeile, was passiert, warum es falsch ist, was stattdessen.

## Was du prüfst

1. Übereinstimmung mit dem Paket: fehlt etwas, ist etwas anders gebaut, ist etwas dazugekommen, das niemand bestellt hat (vor allem: keine Lösungsfunktionen, keine Bewertung von Personen).
2. Vertraulichkeit zwischen den beiden Personen: Steckbriefe der anderen Person nur mit `freigegeben`; Antworten der anderen Person nur, wenn beide abgegeben haben; eigene Antworten nach Abgabe fest; Zurücknehmen nur, solange die andere Person nicht abgegeben hat. Prüfe das in der Funktion und in der Oberfläche (nichts darf im Browser landen, was die Funktion nicht liefern soll).
3. Sicherheit: Passwortschutz jeder Aktion, keine Tabellen oder Funktionen für anon oder authenticated, keine Geheimnisse im Quelltext, Hub-Register nur lesend.
4. Wirkung in der Datenbank: schreibt jede Aktion, was sie soll, und nur das? Doppelter Aufruf, fehlende Felder, unbekannte IDs, gleichzeitige Änderungen durch Alex und Lea. Bleiben Testdaten zurück?
5. Oberfläche: 1440 und 390 px, dunkel und hell, Tastatur und Bildschirmleser, Information nicht nur über Farbe, nur Tokens aus `styles.css`, keine Gedankenstriche in Oberflächentexten, Leer-, Fehler- und Ladezustände. Regressionen auf bestehenden Seiten (Navigation, Assets `?v=33`).
6. Dokumentation: Technikstand, README, Arbeitspakete stimmen mit dem Code überein.

## Schwere

- schwer: Antworten oder Steckbriefe der anderen Person vor der Freigabe sichtbar, Datenverlust, Sicherheitslücke, Seite oder Hauptweg kaputt.
- mittel: Abweichung vom Paket mit spürbarer Folge, fehlender Fehlerfall, Bedienung am Handy nicht machbar.
- leicht: Kleinigkeit, Benennung, Text, Stil.

## Ausgabe

Zuerst eine Zeile „Geprüft: <Teilpaket>, Commit <sha>, <n> Dateien“. Dann die Befunde nummeriert, je Befund:

```
<Nr>. [schwer|mittel|leicht] <Kurztitel>
Fundstelle: <Datei>:<Zeile>
Was passiert: …
Warum falsch: …
Vorschlag: …
```

Danach „Empfehlungen“: höchstens fünf Vorschläge, durch die Alex und Lea die Seite leichter ausfüllen oder lesen könnten. Wenn du etwas nicht prüfen kannst, schreib das ausdrücklich dazu, statt es zu vermuten.
