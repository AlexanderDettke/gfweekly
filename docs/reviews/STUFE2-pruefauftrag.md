# Prüfauftrag Stufe 2 · Ein Behälter · für Codex (read-only)

Du prüfst einen Commit im Repo des Kompass (internes Cockpit der Geschäftsführung von Alex und Lea, statische Seiten in `site/`, Edge
Function `supabase/functions/gfweekly/` mit dem Modul `entscheidungen.ts`, Migrationen in `supabase/migrations/`, Prüfskripte in
`pruefung/`). Grundlage ist `docs/PAKET-STUFE-2-EIN-BEHAELTER.md`, maßgeblich sind die Abschnitte 1 bis 8 und 12; Abschnitt 9 nennt die
Fälle für die Abnahme. Dazu gelten `organisationsstandards/fassungen/0.5.0-55e526d2ad79/ORG-001.md` bis `ORG-003.md` und
`WEBAPP-PILOT-0.2.md`. Du änderst nichts, du lieferst Befunde und Empfehlungen. Claude Code arbeitet deine Befunde ab und muss jedes
Verwerfen belegen. Sei deshalb konkret: Datei und Zeile, was passiert, warum es falsch ist, was stattdessen. (Dieses Muster folgt
`STUFE1-pruefauftrag.md`.)

## Was du prüfst

1. Übereinstimmung mit dem Paket: fehlt etwas, ist etwas anders gebaut als beschrieben, ist etwas dazugekommen, das niemand bestellt hat.
   Die Lesarten und Abweichungen stehen in `docs/TECHNIKSTAND.md`, Abschnitt „Stufe 2“; prüfe, ob sie dort begründet sind.
2. Fristen (Abschnitt 2): keine Frist ohne Person oder Punkt. `hh_entscheidungen_sammeln` darf aus `gate_frist` eines Themas oder
   Kandidaten nur `frist_vorschlag` schreiben, nie `frist`; eine bestehende Frist mit Quelle `thema` oder `kandidat` ist umgezogen; die
   Oberfläche zeigt den Vorschlag als Knopf und übernimmt ihn nur mit `expect_updated_at`. Fristzustand, „reif“ und Sortierung dürfen den
   Vorschlag nicht zählen.
3. Phase und Fokus (Abschnitt 3): `hh_vorhaben.phase` mit CHECK, `fokus`; `hh_vorhaben_phase` nur Alex oder Lea, Verlaufseintrag nur bei
   Änderung; Fokus-Abschnitt zuerst in Liste, Besprechung und Für dich (Reihenfolge Launch, Formatpartner, Systembau, dann Frist).
   Mehrfachaktion `hh_entscheidungen_sammelaktion`: Unter-Transaktion je Zeile, Konflikt je Zeile (`PT409` mit `expect_updated_at`),
   `nicht_jetzt` Standard erster Montag nach vier Wochen, `hinfaellig` mit vollständigem Rückweg (`original`, `nach`, `verlauf_id`), so dass
   `hh_entscheidung_zurueck` die Quelle wiederherstellt.
4. Ein Behälter (Abschnitt 4): die einmalige Auflösung lief am 25.10.2026 als SQL-Lauf (`archiv_grund 'stufe2:*'`, Punkte mit
   `quelle 'thema:<id>'` oder `'kandidat:<id>'`, Verlaufseinträge `source_ref 'thema:<id>:…'`); prüfe die Regel in
   `hh_entscheidung_umhaengen` (Zielquelle muss existieren und offen sein, Eindeutigkeit je Quelle, Rückweg) und dass nach der Auflösung kein
   Thema und kein Kandidat Datenverlust erleidet (jedes Thema hat Nachfolger oder Archivgrund). Navigation ohne Themen, Eingabe, Aufräumen;
   `board.html?topic=` bleibt erreichbar; der Neuigkeiten-Zähler zeigt den Korb. Code für Themen und Kandidaten bleibt für den Altbestand.
5. Rückkehr und Übergabe (Abschnitt 5): `rueckkehr_lage` liest nur Entscheidungen, Punkte, Verlauf und Korbzeilen der Abwesenheit, nach
   Phase und nach Menschen, Zähler stimmen mit den Blöcken überein; `rueckkehr_brief_set` schreibt `note_rueckkehr` (nur Alex oder Lea);
   `absence_end` schreibt liegen gebliebene Korbzeilen als Verlauf und setzt sie `entfallen`; der Korb enthält nur noch Vorhaben
   (`handoverItems` ohne Themen und Kandidaten); Übergabe hat „Erledigt“ je Zeile (`handover_set status erledigt`).
6. Läufe (Abschnitt 6): Was darf der Lauf automatisch und was nicht? `hh_punkt_toggle` mit `p_by 'lauf'`, Verlaufseinträge
   `created_by 'lauf'`, Vorschläge `status 'vorschlag'`, `hh_vorschlag_verfall` (pg_cron 04:52 UTC) setzt nach 14 Tagen `verfallen`;
   `hh_lauf_rueckgaengig` (7 Tage, nur Alex oder Lea, nur vom Lauf erledigte Punkte, Lauf-Einträge desselben Laufs `verworfen`, Entscheidung
   kommt über `hh_entscheidungen_sammeln` zurück); Knopf in der Akte nur an passenden Einträgen; `lauf_bilanz` zählt, was sie behauptet.
   Der Wortlaut in `docs/auftraege/STUFE2-LAEUFE.md` muss zu den Funktionen passen (Signaturen, `source_ref` eindeutig, Deckel, Stufen).
7. Rechte und Vertraulichkeit: nur Alex oder Lea schreiben (`by`), Passwortschutz jeder Aktion, neue Funktionen `security definer` mit
   `search_path`, Rechte nur `service_role`, keine Geheimnisse im Quelltext, keine Rohdaten im Prüfbericht.
8. Oberfläche (`entscheidungen.html` Auswahl und Vorschlagsfrist, `besprechung.html` Nicht jetzt, `index.html` Fokus und Klappe
   „Was der Lauf getan hat“, `vorhaben.html` Akte-Chips und Rückgängig, `rueckkehr.html` neu, `uebergabe.html` Erledigt): 1440 und 390 px,
   dunkel und hell, Tastatur und Bildschirmleser (echte Knöpfe, Beschriftungen, Fokus, Rückgängig), Information nicht nur über Farbe, nur
   Tokens aus `styles.css`, keine Gedankenstriche in Oberflächentexten, Leer-, Fehler- und Ladezustände, Mobil 390 (Knöpfe 44 px).
9. Prüfungen: Fangen `pruefung/stufe2-probe.mjs`, die Bedienproben (Gruppen „Rückkehr (Stufe 2)“ und „Stufe 2“) und `schirme.mjs` ab,
   was sie behaupten? Räumt die Wirkungsprobe auf? Stimmen die angepassten Stufe-1-Erwartungen noch mit dem Paket überein?
10. Dokumentation: README, `docs/TECHNIKSTAND.md`, `docs/webapp-standard/` (Funktionsinventar, Prüfmatrix), `docs/auftraege/STUFE2-LAEUFE.md`,
    Paketdatei: stimmen sie mit dem Code überein? Starke Wörter ohne Beleg melden. Stand in fünf Kategorien ohne behauptete Annahme.

## Schwere

- schwer: falsches Ergebnis in der Datenbank, Datenverlust im Original oder bei der Auflösung, Sicherheitslücke, Frist aus einer
  Quelle ohne Person, Seite oder Hauptweg (Entscheiden, Besprechung, Rückkehr) kaputt, Lauf-Erledigung ohne Rückweg.
- mittel: Abweichung vom Paket mit spürbarer Folge, fehlender Fehlerfall, Bedienung am Handy nicht machbar, Prüfung belegt weniger als sie behauptet.
- leicht: Kleinigkeit, Benennung, Text, Stil.

## Ausgabe

Zuerst eine Zeile „Geprüft: Stufe 2, Commit <sha>, <n> Dateien“. Dann die Befunde nummeriert, je Befund:

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
