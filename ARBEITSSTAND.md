# Arbeitsstand · Pakete V23 und V24

Ziel: die vier Pakete aus `docs/PAKETE-V23-V24.md` umsetzen. Alex ist bis morgen nicht erreichbar,
deshalb arbeite ich die Pakete ohne Zwischenstopp durch, treffe risikoarme Entscheidungen selbst
und sammle alles Offene in `FRAGEN_FUER_MORGEN.md`. Gepusht wird nicht, das macht Alex.

Stand: 21.09.2026

## Paket 1 · V23 Farbpatch — fertig

Commit `598e824` (noch nicht gepusht). Palette ohne Türkis, `--disabled`, `--action-border`, `ht-rise`,
keine Gedankenstriche, Assets `?v=23`.

Prüfungen (`./pruefung/abnahme.sh`, alle grün):
- `tokens.py`: Token-Zone gegen `tokens/colors.css`, 57 dunkel und 46 hell, null Abweichungen.
- `farbscan.py`: null Funde in `site/assets`.
- `kontrast.py`: 76 Paare in beiden Themen, null unter der Schwelle (Honiggold mit dunkler Schrift 9,23:1).
- `schirme.mjs`: 52 Aufnahmen (13 Seiten × 1440/390 × dunkel/hell), null Meldungen.

Drei Codex-Runden (`f0394c5`, `0c1a463`, `bd9de47`), alle bestätigten Befunde behoben.

## Paket 2 · V24a Fundament — gebaut und geprüft, Deploy steht aus

- Migration `supabase/migrations/20260921_hh_vertretung.sql` ist **angewendet**:
  `gfweekly_absences`, `gfweekly_deputies` (4 Seed-Zeilen), `gfweekly_handover`, `gfweekly_handover_log`,
  `gfweekly_topics.owner_backup` und `.handover_id`, RLS an ohne Policies.
- `pg_net` aktiviert, Funktion `public.hh_absence_tick()` angelegt, Cron-Job `hh_absence_tick` täglich 04:40 UTC.
  Das Passwort holt die Funktion aus dem Vault-Secret `gfweekly_password`. Fehlt es, tut sie nichts.
  **Das Secret fehlt noch** (siehe Fragen), bis dahin ist der Job ein Leerlauf.
- Edge Function v29 im Repo: 13 neue Aktionen (`absence_set`, `absence_list`, `absence_end`,
  `deputies_set`, `deputies_list`, `handover_build`, `handover_list`, `handover_set`, `handover_set_many`,
  `handover_dossier`, `handover_log_add`, `handover_log`, `uebernahme_stat`, `absence_tick`)
  und die Matrix als reine Funktion `score(item, absence)` mit Begründungssatz.
- **Nicht deployt.** Der Supabase-MCP-Deploy verlangt den vollständigen Quelltext (107 kB) im Werkzeugaufruf.
  Den schreibe ich nicht blind ab, solange die Live-Funktion daran hängt: ein Tippfehler legt das Cockpit lahm.
  Der Deploy dauert mit der CLI zehn Sekunden (siehe Fragen).

Prüfungen ohne Deploy:
- `pruefung/matrix-test.mjs`: 26 Proben auf Stufe, Geldbeträge, alle vier Achsen, Cluster, Ampel,
  Wache bei kurzer Abwesenheit, Regeltext bei langer, Vertretungslinie, Wortgrenzen. Alle grün.
- `pruefung/korb-probe.mjs`: Trockenlauf gegen die echten Daten (Lea, 05.10. bis 25.10.):
  87 Zeilen, davon 21 Themen, 59 Kandidaten, 7 Partner; Quadranten planen 44, warten 36, delegieren 4, sofort 3;
  Cluster E 39, D 36, A 7, B 5; Lücken 70 von 87, Übernahmefähigkeit 20 Prozent.
  Zwei Befunde daraus behoben: Stichworte treffen nur noch am Wortanfang („Ankündigungen“ war eine „Kündigung“),
  und F = 1 verlangt jetzt einen echten Teamnamen im who-Feld statt irgendeiner Person.
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

## Paket 4 · V24c Asana, Kalender, Mail — gebaut, Live-Abnahme steht aus

Commit `39886dc`. Migration `20260921_hh_asana.sql` angewendet (`asana_gid`, `asana_project_gid`, `asana_synced_at`).
`asana_export` und `asana_sync` in der Edge Function, Rücksync im Tick, Archivierung bei Rückkehr,
„Nach Asana“ im Kopf der Übergabe, Kachel „Asana offen“ auf der Rückkehr, Abschnitt H (H1 bis H7) im Technikstand.
Ohne `ASANA_TOKEN` tut der Export nichts und sagt warum. Die Abnahme aus 4c (Testprojekt, Rücksync, löschen)
braucht das Token.

## Nächste Schritte

1. Edge Function v29 deployen (Anleitung in `FRAGEN_FUER_MORGEN.md`, Punkt 1).
2. Vault-Secret `gfweekly_password` anlegen, damit der Tick läuft (Punkt 2).
3. Live-Abnahme Paket 2: zwei Testabwesenheiten, `absence_tick` zweimal, Ausdruck prüfen, Testdaten löschen.
4. `ASANA_TOKEN` anlegen, Abnahme 4c fahren, Abschnitt H in den täglichen Auftrag eintragen.
