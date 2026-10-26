# Prüfauftrag Stufe 3 · Lauf im Kompass, weniger Seiten, Ruhe halten · für Codex (read-only)

Du prüfst einen Commit im Repo des Kompass (internes Cockpit der Geschäftsführung von Alex und Lea, statische Seiten in `site/`, Edge
Function `supabase/functions/gfweekly/` mit den Modulen `lauf.ts` (neu) und `entscheidungen.ts`, Migrationen in `supabase/migrations/`,
Prüfskripte in `pruefung/`). Grundlage ist `docs/PAKET-STUFE-3-LAUF-IM-KOMPASS.md`, maßgeblich sind die Abschnitte 1 bis 8; Abschnitt 9
nennt die Testaufgabe. Dazu gelten `organisationsstandards/fassungen/0.5.0-55e526d2ad79/ORG-001.md` bis `ORG-003.md` und
`WEBAPP-PILOT-0.2.md`. Du änderst nichts, du lieferst Befunde und Empfehlungen. Claude Code arbeitet deine Befunde ab und muss jedes
Verwerfen belegen. Sei konkret: Datei und Zeile, was passiert, warum es falsch ist, was stattdessen. (Muster: `STUFE2-pruefauftrag.md`.)

## Was du prüfst

1. Übereinstimmung mit dem Paket: fehlt etwas, ist etwas anders gebaut, ist etwas dazugekommen. Lesarten stehen in `docs/TECHNIKSTAND.md`,
   Abschnitt „Stufe 3“; prüfe, ob sie dort begründet sind.
2. **Was der Lauf darf und was nicht** (`lauf.ts`, Abschnitt 2.2): Modus `aus` schreibt nichts; `probe` nur Protokoll; `vorschlag` macht aus
   „sicher“ einen Vorschlag; `live` erledigt nur bei `sicher` **und** belegtem Abschluss über `hh_punkt_toggle(…, 'lauf', ref)` plus Beleg-Eintrag.
   Harte Regeln im Code, nicht nur im Prompt: nie ein Punkt mit `rueckgaengig:lauf:%`; Deckel je Berliner Tag über alle Ticks
   (`hh_lauf_sichtung`); keine Frist, nur `gate_frist` am Kandidaten; keine Themen; kein Kandidat aus gesendeten Mails; Einwurf-Adressen
   übersprungen; Vertraulichkeitsfilter auf Beleg und Kandidat. Die Antwort der KI gilt als fremde Eingabe (Slug und Punkt nur aus der Liste).
3. **Idempotenz und Grenzen**: Protokoll eindeutig je Quelle und Punkt (`schluessel`), ein zweiter Lauf überspringt; `source_ref` der
   Verlaufseinträge eindeutig; ein Tick bearbeitet ein Postfach und höchstens `batch` Threads; Cursor nur bei echten Gmail-Läufen ohne
   `after`/`before`; Fehler je Mail landen als Protokollzeile, brechen den Tick nicht ab; Zeitüberschreitungen (25 s) je Aufruf.
4. **Google-Zugang**: JWT mit WebCrypto aus `GOOGLE_SA_JSON` (roh oder base64), Bereich `gmail.readonly`, `sub` nur aus den eingestellten
   Postfächern; kein Schlüssel, kein Token, kein Mailtext im Log oder in der Datenbank (Protokoll trägt nur Beleg-Satz und Kennungen);
   ohne Secret eine benannte 503, keine Ausnahme. `lauf_gmail_probe` liest keinen Inhalt.
5. **Selbstabschaltung und Rückkehr-Brief** (Abschnitte 2.2.6, 5): unter 50 % bleibend über 14 Tage bei mindestens fünf Erledigungen →
   `modus 'vorschlag'`, Grund, Ticker; Brief nur, wenn `note_rueckkehr` leer und Abwesenheit nicht `test`.
6. **Datenbank** (`20261026120000_stufe3_lauf.sql`): RLS ohne Policies, Rechte nur `service_role`, `security definer` mit `search_path`,
   `hh_lauf_einstellungen_set` nur Alex oder Lea mit Protokollzeile, `hh_lauf_tick` liest das Passwort aus dem Vault und tut bei `aus` nichts,
   Zeitplan `7 5-21/2 * * *` UTC.
7. **Stufe 3 Seiten** (Abschnitt 4): Navigation 14 Einträge in drei Gruppen; Reiter Vertretung (Abwesenheiten, Übergabe, Rückkehr; `?id=`
   wird weitergereicht), Saison (Saison, Jahr), Einstellungen (Lauf und Kriterien, Personen und Links, Wichtige Seiten); die Seitenleiste
   markiert die Gruppe (`GF_NAV_ALIAS`); Dateien bleiben erreichbar; `einstellungen.html` mit Modus, Zugängen, Regeln, Kriterien, Wochen,
   Protokoll, Rückfrage vor „Live“.
8. **Stufe 4** (Abschnitt 5): „ruht“ nach 60 Tagen ohne Bewegung (Liste: Abschnitt „Ruht“, nicht überfällig; Besprechung: zuletzt; Akte: Marke,
   keine Überfällig-Marke); Kriterien-Ampel in den Einstellungen; Verfall (14 Tage) und Vertagung bestehen.
9. Oberfläche: 1440 und 390 px, dunkel und hell, Tastatur und Bildschirmleser, nur Tokens aus `styles.css`, keine Gedankenstriche in
   Oberflächentexten, Leer-, Fehler- und Ladezustände, 44-px-Ziele.
10. Prüfungen: fangen `pruefung/stufe3-probe.mjs`, die Bedienproben (Gruppe „Stufe 3“), Schirme und Webstandard ab, was sie behaupten?
    Räumt die Wirkungsprobe auf und setzt sie den Modus zurück?
11. Dokumentation: README, `docs/TECHNIKSTAND.md`, `docs/webapp-standard/`, `docs/auftraege/STUFE2-LAEUFE.md` (jetzt Beschreibung des
    Laufs im Kompass), Paketdatei: stimmen sie mit dem Code überein? Starke Wörter ohne Beleg melden.

## Schwere

- schwer: der Lauf schreibt in einem Modus, der es nicht darf; erledigt ohne sicheren Beleg; Datenverlust; Schlüssel, Token oder Mailtext
  landen im Log oder in der Datenbank; Sicherheitslücke; Seite oder Hauptweg kaputt.
- mittel: Abweichung vom Paket mit spürbarer Folge, fehlender Fehlerfall, Bedienung am Handy nicht machbar, Prüfung belegt weniger als sie behauptet.
- leicht: Kleinigkeit, Benennung, Text, Stil.

## Ausgabe

Zuerst eine Zeile „Geprüft: Stufe 3, Commit <sha>, <n> Dateien“. Dann die Befunde nummeriert, je Befund:

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
Reviews). Du rufst keine Netzwerkdienste auf (Supabase, Google, Anthropic, Asana, Netlify).
