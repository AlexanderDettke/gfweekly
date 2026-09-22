# Arbeitsstand · Pakete V23 und V24

Ziel: die vier Pakete aus `docs/PAKETE-V23-V24.md` umsetzen. Alex ist bis morgen nicht erreichbar,
deshalb arbeite ich die Pakete ohne Zwischenstopp durch, treffe risikoarme Entscheidungen selbst
und sammle alles Offene in `FRAGEN_FUER_MORGEN.md`. Gepusht wird nicht, das macht Alex.

Stand: 22.09.2026, nach Deploy (v32), Live-Abnahme und Push. `origin/main` steht auf `ad5719e`.

**Nicht abnahmefähig.** Eine vierte, vollständige Prüfung gegen die Paketdatei hat 34 Befunde gemeldet, elf davon
schwer. Sie stehen in `docs/BEKANNTE-MAENGEL.md` und werden auf Entscheidung von Alex vorerst nicht behoben.
Was unten als „geprüft“ steht, meint in der Regel die Oberfläche, nicht die Wirkung in der Datenbank.

## Paket 1 · V23 Farbpatch — fertig

Commit `598e824` (noch nicht gepusht). Palette ohne Türkis, `--disabled`, `--action-border`, `ht-rise`,
keine Gedankenstriche, Assets `?v=23`.

Prüfungen (`./pruefung/abnahme.sh`, alle grün):
- `tokens.py`: Token-Zone gegen `tokens/colors.css`, 57 dunkel und 46 hell, null Abweichungen.
- `farbscan.py`: null Funde in `site/assets`.
- `kontrast.py`: 76 Paare in beiden Themen, null unter der Schwelle (Honiggold mit dunkler Schrift 9,23:1).
- `schirme.mjs`: 52 Aufnahmen (13 Seiten × 1440/390 × dunkel/hell), null Meldungen.

Drei Codex-Runden (`f0394c5`, `0c1a463`, `bd9de47`), alle bestätigten Befunde behoben.

## Paket 2 · V24a Fundament — fertig, deployt und live abgenommen

- Migration `supabase/migrations/20260921_hh_vertretung.sql` ist **angewendet**:
  `gfweekly_absences`, `gfweekly_deputies` (4 Seed-Zeilen), `gfweekly_handover`, `gfweekly_handover_log`,
  `gfweekly_topics.owner_backup` und `.handover_id`, RLS an ohne Policies.
- `pg_net` aktiviert, Funktion `public.hh_absence_tick()` angelegt, Cron-Job `hh_absence_tick` täglich 04:40 UTC.
  Das Passwort holt die Funktion aus dem Vault-Secret `gfweekly_password`. Fehlt es, tut sie nichts.
  Das Secret liegt seit dem 22.09.2026 im Vault, der Job läuft.
- Edge Function: 13 neue Aktionen (`absence_set`, `absence_list`, `absence_end`,
  `deputies_set`, `deputies_list`, `handover_build`, `handover_list`, `handover_set`, `handover_set_many`,
  `handover_dossier`, `handover_log_add`, `handover_log`, `uebernahme_stat`, `absence_tick`)
  und die Matrix als reine Funktion `score(item, absence)` mit Begründungssatz.
- **Deployt am 22.09.2026** aus der Supabase-CLI, inzwischen als v31 (siehe unten). Der Supabase-MCP-Deploy
  schied aus, weil er den vollständigen Quelltext im Werkzeugaufruf verlangt; abgeschrieben wäre das ein Blindflug.

Prüfungen vor dem Deploy:
- `pruefung/matrix-test.mjs`: 26 Proben auf Stufe, Geldbeträge, alle vier Achsen, Cluster, Ampel,
  Wache bei kurzer Abwesenheit, Regeltext bei langer, Vertretungslinie, Wortgrenzen. Alle grün.
- `pruefung/korb-probe.mjs`: Trockenlauf gegen die echten Daten (Lea, 05.10. bis 25.10.):
  87 Zeilen, davon 21 Themen, 59 Kandidaten, 7 Partner; Quadranten planen 44, warten 36, delegieren 4, sofort 3;
  Cluster E 39, D 36, A 7, B 5; Lücken 13 von 87, Übernahmefähigkeit 85 Prozent (Stand nach der Nacharbeit;
  vor der Korrektur des Kandidatenzweigs waren es 70 Lücken, weil Kandidaten mangels Feldern immer als Lücke galten).
  Befunde daraus behoben: Stichworte treffen nur noch am Wortanfang („Ankündigungen“ war eine „Kündigung“),
  F = 1 verlangt einen echten Teamnamen im who-Feld, und Kandidaten werden an ihrem Text gemessen.
- Syntax- und Typprüfung der Edge Function über die TypeScript-API: ohne Befund.

## Paket 3 · V24b Bereich Vertretung — fertig

Commit `2494a61`. Navigationsgruppe „Vertretung“ mit `vertretung.html`, `uebergabe.html`, `rueckkehr.html`,
Block auf der Startseite, Marke in der Besprechung, neue Bausteine `gfAmpel`, `gfQuadrant`, `gfFrist`,
Stilblock V24b, Assets `?v=24`.

Prüfungen:
- `pruefung/schirme.mjs`: 16 Seiten × 1440/390 × dunkel/hell = 64 Aufnahmen, null Meldungen.
- `pruefung/bedienung.mjs`: 35 Bedienproben, alle grün (filtern, „Alle Vorschläge übernehmen“, Dossier,
  Ampelklick, Vertretungsbrief, Wache, Anlegen mit fünf Eingaben, Rückkehr, Rückübergabe, Startseite, Besprechung).
- Zwei Befunde aus den Bildern behoben: `.ub-doss` überschrieb `hidden`, und niemand steht mehr als eigene Vertretung.

## Paket 4 · V24c Asana, Kalender, Mail — gebaut, 4c nur teilweise abgenommen

Commit `39886dc`. Migration `20260921_hh_asana.sql` angewendet (`asana_gid`, `asana_project_gid`, `asana_synced_at`).
`asana_export` und `asana_sync` in der Edge Function, Rücksync im Tick, Archivierung bei Rückkehr,
„Nach Asana“ im Kopf der Übergabe, Kachel „Asana offen“ auf der Rückkehr, Abschnitt H (H1 bis H7) im Technikstand.
Ohne `ASANA_TOKEN` tut der Export nichts und sagt warum. Das Token steht seit dem 22.09.2026 als Secret,
aus 4c ist ein Durchgang mit einem Projekt und einer Aufgabe gelaufen. Die Paketdatei verlangt mehr
(mindestens zehn Aufgaben, geprüfte Empfänger und Themenlinks, Abschnitt H mit Kalendertest, Projekt löschen).

## Unabhängige Review

Drei Runden mit Codex (read-only) über die Pakete 2 bis 4: `39886dc`, `6a2d26e`, `fff4b17`.
Die Runden haben zusammen rund 50 Punkte gemeldet, darunter neun echte Fehler in meinem Code und zwei
Regressionen aus meiner eigenen Nacharbeit. Behoben und in `docs/TECHNIKSTAND.md` einzeln festgehalten.
Die dritte Runde ist die letzte (Regel: höchstens drei); ihre verbliebenen Punkte stehen in
`FRAGEN_FUER_MORGEN.md` unter „Aus der Review offen“. Der Reviewer bleibt bei „nicht abnahmefähig“,
und zwar zu Recht: ohne Deploy fehlen die Nachweise aus Paket 2 und 4, und drei seiner Punkte habe ich
bewusst nicht mehr angefasst, weil sie größere Umbauten sind.

## Nacharbeit V24d und Live-Abnahme (22.09.2026)

Grundlage `ANTWORTEN_ZU_FRAGEN.md`. Gebaut: `hh_handover_set` als eine Transaktion (7.1), Asana-Kennungen
über die E-Mail (7.3), Lückenfilter im Board (7.4), Zähler für abgeschnittene Quellen (7.2).
Edge Function v30, Migrationen `20260922_hh_handover_set.sql` und `20260922_hh_handover_set_namen.sql` angewendet.

Zweite Prüfrunde über den vollständigen Umfang (Stand `81a0941`): zehn Befunde, alle behoben, Edge Function v31.
Die beiden schweren betrafen Asana: die Auflösung von „Alex“ und „Lea“ läuft jetzt über die feste E-Mail statt
über eine Zeichenkette im Namen, und ein Lesefehler der Personenliste bricht den Export ab, statt Zuweisungen zu
löschen. Dazu: eine aufgehobene Ruhe räumt Ausgang und Frist am Thema auf (Migration
`20260922_hh_handover_set_ruhe.sql`), der Rücksync schreibt den Vermerk vor dem Status und liest Kommentare
seitenweise, und eine gekürzte Antwort sagt es der Übergabeseite.

Live abgenommen: Paket 2 (zwei Testabwesenheiten, `absence_tick` zweimal, Testdaten restlos zurückgebaut),
Vault-Secret und Cron-Lauf, aus 4c ein Durchgang (Projekt angelegt, Aufgabe erledigt, Rücksync, archiviert),
Adresse von „by Nature“ korrigiert, Vorschaubild mit echten Daten neu aufgenommen. Einzelheiten im Technikstand
unter „Live-Abnahme 22.09.2026“.

## Nächste Schritte

1. **Alex: `git push`.** Bis dahin sind die drei neuen Seiten nicht live.
2. Alex: archiviertes Asana-Testprojekt `1218725644227780` von Hand löschen.
3. Alex: Abschnitt H (Text im Technikstand) in den täglichen Auftrag eintragen.
4. Danach Live-Check am Handy: Vertretung, Übergabe, Für dich.
