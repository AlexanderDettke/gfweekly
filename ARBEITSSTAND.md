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

## Paket 3 · V24b Bereich Vertretung — in Arbeit

## Paket 4 · V24c Asana, Kalender, Mail — offen

## Nächste Schritte

1. Paket 3 bauen und mit `pruefung/schirme.mjs` prüfen (Testdaten statt Live-Backend).
2. Paket 4 bauen, soweit es ohne `ASANA_TOKEN` geht, und den Textbaustein für Abschnitt H ablegen.
3. Nach Alex' Rückkehr: Edge Function v29 deployen, Vault-Secret anlegen, Live-Test mit den zwei
   Testabwesenheiten, danach Testdaten löschen.
