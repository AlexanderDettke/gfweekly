# Prüfauftrag Stufe 1 · Entscheiden können · für Codex (read-only)

Du prüfst einen Commit im Repo des Kompass (internes Cockpit der Geschäftsführung von Alex und Lea, statische Seiten in `site/`, Edge
Function `supabase/functions/gfweekly/` mit dem neuen Modul `entscheidungen.ts`, Migrationen in `supabase/migrations/`, Prüfskripte in
`pruefung/`). Grundlage ist `docs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md`, maßgeblich sind die Abschnitte 1 bis 8; Abschnitt 9 nennt die Fälle für
die Abnahme. Dazu gelten `organisationsstandards/fassungen/0.5.0-55e526d2ad79/ORG-001.md` bis `ORG-003.md` und `WEBAPP-PILOT-0.2.md`.
Du änderst nichts, du lieferst Befunde und Empfehlungen. Claude Code arbeitet deine Befunde ab und muss jedes Verwerfen belegen. Sei
deshalb konkret: Datei und Zeile, was passiert, warum es falsch ist, was stattdessen. (Dieses Muster folgt `V32-pruefauftrag.md`; einen
`VERKAUF-pruefauftrag.md` gibt es im Repo nicht.)

## Was du prüfst

1. Übereinstimmung mit dem Paket: fehlt etwas, ist etwas anders gebaut als beschrieben, ist etwas dazugekommen, das niemand bestellt hat.
   Die Lesarten und Abweichungen stehen in `docs/TECHNIKSTAND.md`, Abschnitt „Stufe 1“; prüfe, ob sie dort begründet sind.
2. Wirkung in der Datenbank: `hh_entscheidungen_sammeln` idempotent (zweimal gleiche Zeilenzahl), ändert nie `status`, `ergebnis` oder
   eine Frage mit `frage_von` in (Alex, Lea); `hh_entscheidung_entscheiden` schreibt ins Original zurück (Punkt erledigt plus Verlauf,
   Thema entschieden plus Beschluss, Kandidat übernommen) ohne Datenverlust und ist per `hh_entscheidung_zurueck` umkehrbar (24 Stunden);
   `vertagen` zieht die Frist der Quelle nach; `abgeben` setzt `gate` bzw. `wer`; hinfällig bei erledigter, archivierter oder weitergegebener
   Quelle. Doppelaufruf erzeugt keine Dublette. Was passiert bei fehlenden Feldern, unbekannten Kennungen, gleichzeitigen Änderungen?
   Bleiben Testdaten zurück?
3. Rechte und Vertraulichkeit: nur Alex oder Lea schreiben (`by`), Passwortschutz jeder Aktion, RLS der neuen Tabelle ohne Policies, keine
   Rechte für anon oder authenticated, `security definer` mit `search_path`, keine Geheimnisse im Quelltext.
4. Oberfläche (`entscheidungen.html`, `besprechung.html`, `vorhaben.html` Korb, `index.html` Block „Deine Entscheidung“): 1440 und 390 px,
   dunkel und hell, Tastatur und Bildschirmleser (echte Knöpfe, Beschriftungen, Fokus, Rückgängig), Information nicht nur über Farbe, nur
   Tokens aus `styles.css` (keine Hex-Werte außerhalb der Token-Blöcke), keine Gedankenstriche in Oberflächentexten, Leer-, Fehler- und
   Ladezustände, Mobil 390 (Knöpfe 44 px, keine Zeile über drei Textzeilen ohne Aufklappen).
5. Spielschicht: mit `GF_SPIEL=false` wirklich aus (keine Taler, kein Lagerplatz, keine Flammen, keine Abzeichen, keine Überraschungen,
   kein `score_event`), ohne Konsolenfehler und ohne verwaiste Blöcke; `GF_SPIEL=true` schaltet alles zurück; Check-in bleibt ohne Taler.
6. Schrift und Dichte (Abschnitt 7.1): Tokens gesetzt, keine Rolle unter 12 px, Chips 32 px mit Ziel 44 px, Lesebreite.
7. Prüfungen: Fangen `pruefung/entscheidungen-probe.mjs` und die Bedienproben ab, was sie behaupten? Räumt die Wirkungsprobe auf?
8. Dokumentation: README, `docs/TECHNIKSTAND.md`, `docs/webapp-standard/` (Funktionsinventar, Regelzuordnung, Prüfmatrix), Paketdatei:
   stimmen sie mit dem Code überein? Starke Wörter ohne Beleg melden. Stand in fünf Kategorien ohne behauptete Annahme.

## Schwere

- schwer: falsches Ergebnis in der Datenbank, Datenverlust im Original, Sicherheitslücke, Seite oder Hauptweg (Entscheiden, Besprechung) kaputt.
- mittel: Abweichung vom Paket mit spürbarer Folge, fehlender Fehlerfall, Bedienung am Handy nicht machbar, Prüfung belegt weniger als sie behauptet.
- leicht: Kleinigkeit, Benennung, Text, Stil.

## Ausgabe

Zuerst eine Zeile „Geprüft: Stufe 1, Commit <sha>, <n> Dateien“. Dann die Befunde nummeriert, je Befund:

```
<Nr>. [schwer|mittel|leicht] <Kurztitel>
Fundstelle: <Datei>:<Zeile>
Was passiert: …
Warum falsch: … (Verweis auf Paketabschnitt oder Standard, wenn es eine Abweichung ist)
Vorschlag: …
```

Danach ein Abschnitt „Empfehlungen“ mit höchstens fünf Vorschlägen. Wenn du etwas nicht prüfen kannst (zum Beispiel die Wirkung in der
Datenbank ohne Zugang), schreib das ausdrücklich dazu, statt es zu vermuten.

## Grenzen dieses Prüfauftrags

Du arbeitest ausschließlich lesend. Du startest keinen weiteren Prüfer, keine weitere KI-Sitzung und keinen Unteragenten (keine rekursiven
Reviews). Du rufst keine Netzwerkdienste auf (Supabase, Asana, Google, Netlify).
