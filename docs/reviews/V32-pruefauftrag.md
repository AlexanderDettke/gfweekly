# Prüfauftrag V32 Kommunikation · für Codex (read-only)

Du prüfst einen Commit im Repo des Hohen Hauses (internes Cockpit der Geschäftsführung von Alex und Lea, statische Seiten in `site/`, Edge Function `supabase/functions/gfweekly/index.ts`, Migrationen in `supabase/migrations/`, Prüfskripte in `pruefung/`). Grundlage ist `docs/PAKET-V32-KOMMUNIKATION.md`, maßgeblich ist der Abschnitt des genannten Teilpakets. Du änderst nichts, du lieferst Befunde und Empfehlungen. Claude Code arbeitet deine Befunde ab und muss jedes Verwerfen belegen. Sei deshalb konkret: Datei und Zeile, was passiert, warum es falsch ist, was stattdessen.

## Was du prüfst

1. Übereinstimmung mit dem Paket: fehlt etwas, ist etwas anders gebaut als beschrieben, ist etwas dazugekommen, das niemand bestellt hat.
2. Wirkung in der Datenbank: Schreibt jede Aktion, was sie soll, und nur das? Entstehen Verlaufseinträge und Protokolle wie beschrieben? Was passiert bei doppeltem Aufruf, bei fehlenden Feldern, bei unbekannten IDs, bei gleichzeitigen Änderungen durch Alex und Lea? Bleiben Testdaten zurück?
3. Sicherheit und Vertraulichkeit: Passwortschutz jeder neuen Aktion, keine Tabellen oder Sichten für anon oder authenticated, keine Geheimnisse im Quelltext, keine personenbezogenen Bewertungen oder privaten Inhalte in Oberfläche, Verlauf oder KI-Eingabe über das Nötige hinaus. Christians Tabelle wird nur in Zeile 6 und F5 beschrieben; fremde Zellinhalte nie überschreiben. Gesendete Veröffentlichungen nie still verändern. Feldhoheit: Plan- und Briefingfelder nur das Haus, Partner- und Freigabefelder nur der Hub.
4. Oberfläche: Verhalten bei 1440 und 390 px, dunkel und hell, Tastatur und Bildschirmleser (echte Knöpfe, Beschriftungen, Fokus), Information nicht nur über Farbe, nur Tokens aus `styles.css`, keine Gedankenstriche in Oberflächentexten, Leerzustände, Fehlerzustände, Ladezustände. Regressionen auf bestehenden Seiten (Navigation, Für dich, Übergabe, Rückkehr, Schirme).
5. Prüfungen: Fangen die Proben das ab, was sie behaupten? Tests, die die Edge Function abfangen, heißen Oberflächentest und behaupten keine Abnahme. Die Wirkungsprobe läuft gegen das echte Backend und räumt auf.
6. Dokumentation: Stimmen README, Technikstand und Arbeitsstand mit dem Code überein? Starke Wörter ohne Beleg melden.

## Schwere

- schwer: falsches Ergebnis in der Datenbank, Datenverlust, Sicherheitslücke, Seite oder Hauptweg kaputt, Versand an Asana oder Schreiben in Christians Tabelle falsch oder doppelt.
- mittel: Abweichung vom Paket mit spürbarer Folge, fehlender Fehlerfall, Bedienung auf dem Handy nicht machbar, Prüfung belegt weniger als sie behauptet.
- leicht: Kleinigkeit, Benennung, Text, Stil.

## Ausgabe

Zuerst eine Zeile „Geprüft: <Teilpaket>, Commit <sha>, <n> Dateien“. Dann die Befunde nummeriert, je Befund:

```
<Nr>. [schwer|mittel|leicht] <Kurztitel>
Fundstelle: <Datei>:<Zeile>
Was passiert: …
Warum falsch: … (Verweis auf Paketabschnitt, wenn es eine Abweichung ist)
Vorschlag: …
```

Danach ein Abschnitt „Empfehlungen“ mit höchstens fünf Vorschlägen, die das Haus einfacher, verlässlicher oder ruhiger machen würden, auch wenn nichts falsch ist. Bei der Gesamtprüfung zusätzlich „Gestaltung und Bedienung“: höchstens fünf Änderungen, durch die Alex und Lea weniger lesen müssten, um zu wissen, wer zuständig ist, wo es eng wird und was sie entscheiden müssen.

Wenn du etwas nicht prüfen kannst (zum Beispiel die Wirkung in der Datenbank ohne Zugang), schreib das ausdrücklich dazu, statt es zu vermuten.

## Grenzen dieses Prüfauftrags

Du arbeitest ausschließlich lesend. Du startest keinen weiteren Prüfer, keine weitere KI-Sitzung und keinen Unteragenten (keine rekursiven Reviews). Du rufst keine Netzwerkdienste auf (Supabase, Asana, Google, Netlify).
