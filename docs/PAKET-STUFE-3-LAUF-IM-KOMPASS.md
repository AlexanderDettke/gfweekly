# Paket · Stufe 3 und 4 in einem Zug: Lauf im Kompass, weniger Seiten, Ruhe halten · Stand 26.10.2026

Entscheidung Alex, 26.10.2026: „C“ – der Lauf wandert aus Cowork in den Kompass, Stufe 3 (weniger Seiten) und Stufe 4 (Ruhe halten)
werden im selben Paket gebaut, geprüft wird einmal am Ende, nicht zwischendurch. Grundlage: `docs/PAKET-STUFE-2-EIN-BEHAELTER.md`
(live seit 26.10., main `802a3ba`), `docs/auftraege/STUFE2-LAEUFE.md` (Regeln des Laufs), `docs/ABGLEICH-VORHABEN.md` (bisheriger
Cowork-Lauf), `docs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md` Abschnitt „Stufe 3 / Stufe 4“.

## 0 · Was Alex tut, und sonst nichts

1. **Einmal, sobald möglich:** einen Google-Zugang für die Edge Function anlegen und als Supabase-Secret setzen (Abschnitt 2.4, genauer
   `!`-Befehl dort). Ohne ihn baue ich alles, der Lauf liest dann Mails nur aus Fixtures und aus dieser Sitzung (Alex' Postfach über den
   Gmail-Anschluss); Leas Postfach und der tägliche Live-Lauf warten auf den Zugang.
2. **Einmal am Ende (etwa 30 Minuten, mit Lea, am Handy):** die Testaufgabe aus Abschnitt 9, danach die beiden Cowork-Aufträge
   „Vorhaben-Abgleich (Alex)“ und „(Lea)“ ausschalten (sonst doppelte Verlaufseinträge) und „fachlich angenommen“ melden.

Dazwischen keine Zwischentests, keine Freigaben: Deploy, Push, Pull, Migrationen und Datenänderungen führt die Sitzung aus
(Entscheidung vom 25.10.). Der Lauf startet im Modus `aus`; der Wechsel auf `live` ist ein Schalter in den Einstellungen, kein Deploy.

## 1 · Ziel und Erfolgskriterien (ORG-003)

Ziel: Alex und Lea öffnen morgens „Für dich“, sehen Entscheidungen und Bewegung, und das meiste Erledigte hat der Lauf schon erledigt
oder belegt vorgeschlagen; es gibt keine Seite mehr, die niemand braucht.

Kriterien, gemessen im Kompass (Einstellungen → Lauf → Bilanz), ohne Beobachtungswoche vorab:
- (a) Trefferquote: mindestens 50 % dessen, was der Lauf anlegt (Vorschläge an Vorhaben, Kandidaten), wird übernommen oder bleibt
  unbeanstandet. Vor dem Live-Gang belegt durch die rückblickende Simulation über vier Wochen echte Daten (Abschnitt 3).
- (b) Erledigt-Erkennung: mindestens 70 % der vom Lauf erledigten Punkte bleiben erledigt. Fällt (b) über zwei Wochen unter 50 %,
  schaltet der Lauf sich selbst auf `vorschlag` zurück und schreibt den Grund in die Einstellungen (Stufe 4, Ruhe halten).
- (c) Entscheidungsliste unter 15 offenen Einträgen (heute 48; Mehrfachauswahl „Nicht jetzt“ ist der Hebel, der Lauf legt keine neuen
  Entscheidungen ohne Punkt an).
- (d) Höchstens 5 Einträge zur Sichtung am Tag (Deckel im Code), gemessen als Zahl der Vorschläge und Kandidaten je Tag.

## 2 · Lauf im Kompass (Edge Function `lauf.ts`, pg_cron, Claude API)

### 2.1 Datenmodell (eine Migration `<zeitstempel>_stufe3_lauf.sql`)

- `hh_lauf_einstellungen` (eine Zeile): `modus` in (`aus`, `probe`, `vorschlag`, `live`), `deckel_tag` int (5), `modell` text
  (`claude-opus-5-5`), `postfaecher` text[] (`alex@wildemoehre.org`, `lea@wildemoehre.org`), `fenster_stunden` int (26),
  `letzter_lauf_at`, `letzter_fehler`, `abbruch_grund`, `updated_by`, `updated_at`.
- `hh_lauf_cursor` je Postfach: `postfach`, `history_id` oder `bis_at` (Gmail-Zeitgrenze des letzten Laufs), `updated_at`.
- `hh_lauf_protokoll`: je geprüfter Quelle eine Zeile: `run_id`, `modus`, `postfach`, `quelle_art` (mail|einwurf|plattform|verlauf),
  `quelle_ref` (`mail:<threadId>:<messageId>`), `punkt_id`, `vorhaben_id`, `stufe` (sicher|wahrscheinlich|unklar|keine),
  `aktion` (erledigt|vorschlag|kandidat|nichts|gedeckelt), `beleg` (ein Satz), `ausgefuehrt` boolean, `created_at`.
  Eindeutig je (`quelle_ref`, `punkt_id`). Grundlage der Bilanz und der Simulation; keine Mailtexte, nur Betreff-Kürzel und Satz.
- `hh_lauf_tag` (Deckelzähler je Berliner Tag): `tag`, `sichtung` int.
- pg_cron `hh_lauf_tick` alle 2 Stunden 06:00 bis 22:00 Berlin (wie der bisherige Cowork-Rhythmus), ruft über pg_net die Function mit
  `lauf_tick` (Muster `hh_absence_tick`, Passwort aus dem Vault). Der Zeitplan läuft immer; was er tut, entscheidet `modus`.

### 2.2 Ablauf eines Ticks (`lauf_tick {postfach?, mails?, probe?, bis?}`)

1. Modus lesen; `aus` → nur Protokollzeile „übersprungen“. Ein Tick bearbeitet **ein** Postfach und höchstens N Threads
   (N aus Messung, Start 8), Rest beim nächsten Tick; Cursor je Postfach. Mails kommen entweder aus Gmail (2.4) oder als `mails:[…]`
   in der Nutzlast (Fixtures der Probe, Rückblick aus dieser Sitzung). Zeitfenster für den Rückblick mit `after:`/`before:`.
2. Kontext laden: aktive Vorhaben mit offenen Punkten (wie Einwurf heute), Vertraulichkeitsregeln aus `ABGLEICH-VORHABEN.md`.
3. Je Thread ein Claude-Aufruf mit Werkzeugschema (Muster `einwurf`, Timeout, Modell aus Einstellungen):
   `{ bezug: {vorhaben_slug, punkt_id|null, sicherheit}, abschluss_belegt: boolean, stufe: sicher|wahrscheinlich|unklar,
   beleg: "<ein Satz mit Datum, Betrag oder Name>", kandidat: {titel, body}|null, frist_datum: JJJJ-MM-TT|null }`.
4. Harte Regeln **im Code**, nicht nur im Prompt: `erledigt` nur bei `sicher` **und** `abschluss_belegt`; nie einen Punkt erledigen, der
   schon einmal zurückgenommen wurde (`source_ref 'rueckgaengig:lauf:%'` am Punkt); Deckel 5 Sichtungen je Tag über alle Ticks
   (`hh_lauf_tag`); keine Frist, nur `frist_vorschlag` an der Entscheidung; keine Themen; Mails aus `in:sent` ergeben nie einen
   Kandidaten; Einwurf-Adressen (`alex+einwurf@`, `lea+einwurf@`) bleiben beim Einwurf-Weg.
5. Schreiben je Modus: `probe` → nur Protokoll (`ausgefuehrt=false`); `vorschlag` → wie Stufe 2 „wahrscheinlich“ für alles (auch
   `sicher` wird Vorschlag); `live` → `sicher`: `hh_punkt_toggle(p, true, 'lauf', 'mail:<thread>:erledigt:<punkt>')` plus Beleg-Eintrag
   (`created_by 'lauf'`, `source_ref 'mail:<thread>:beleg:<punkt>'`, `source_url` Gmail-Link); `wahrscheinlich`: Verlaufseintrag
   `status 'vorschlag'`, `tag 'Vorschlag: Punkt erledigt'` oder `'Vorschlag: Stand'`; Kandidat nur mit `vorhaben_vorschlag`.
   Genau die Schreibwege aus `STUFE2-LAEUFE.md`, deshalb gelten Rückgängig (7 Tage), Verfall (14 Tage) und Bilanz unverändert.
6. Rückkehr-Brief (Stufe 2, Abschnitt 6.5): am Morgen einer Rückkehr schreibt der Tick `note_rueckkehr` aus `rueckkehr_lage`, wenn leer.
7. Zusammenfassung je Tag als Ticker („Erledigt 2, Vorschläge 3, Kandidaten 1, unklar 7“) und `letzter_lauf_at`.

### 2.3 Einstellungen und Bilanz

Neue Seite `einstellungen.html` (Gruppe Verwalten, ersetzt Wichtige Seiten und Bearbeiten): Lauf-Modus (vier Knöpfe, mit Folge-Text),
Deckel, Modell, letzter Lauf, letzter Fehler, Abbruchgrund, Postfächer mit „Verbindung prüfen“ (`lauf_gmail_probe`: zählt nur Threads
der letzten 24 Stunden, liest keinen Inhalt), Bilanz je Woche (aus `lauf_bilanz`, erweitert um Protokollzahlen: geprüft, sicher,
wahrscheinlich, unklar, gedeckelt) und die vier Kriterien mit Ampel. Dazu die bisherigen Pflegefunktionen aus Bearbeiten (Personen,
Links) als Klappen. Aktionen `lauf_einstellungen_get`, `lauf_einstellungen_set {modus, deckel_tag, modell}` (nur Alex oder Lea, mit
Verlauf in `hh_lauf_protokoll`), `lauf_tick`, `lauf_gmail_probe`.

### 2.4 Google-Zugang (die eine Sache, die Alex anlegt)

Varianten, am selben Fall (zwei Postfächer, nur lesen, kein Nutzer am Bildschirm):

| | Dienstkonto mit domänenweiter Delegation | OAuth-Token je Postfach | Weiter über Cowork |
|---|---|---|---|
| Einrichtung | Alex einmal in Google Cloud und Admin-Konsole (≈ 15 Minuten, braucht Workspace-Admin) | Alex und Lea je einmal zustimmen; Client in Google Cloud | nichts |
| Reichweite | technisch alle Postfächer der Domain (eingeschränkt auf `gmail.readonly`, Subjekte im Code nur alex@ und lea@) | genau zwei Postfächer | Cowork-Konto |
| Pflege | Schlüssel rotieren jährlich | Refresh-Token verfällt bei Passwortwechsel oder 6 Monaten ohne Nutzung | Aufträge je Person pflegen |
| Testbarkeit durch mich | voll (Probelauf gegen echte Postfächer) | voll | keine |

Favorit: **Dienstkonto mit Delegation**, weil es ohne Leas Mitwirkung geht und nicht verfällt. Wenn Alex kein Workspace-Admin ist,
OAuth je Postfach (gleicher Code, anderer Token-Weg; der Zugriff ist als „Token für Postfach X“ gekapselt).

Schritte für Alex (Dienstkonto): Google Cloud → Projekt (z. B. „Kompass Lauf“) → APIs „Gmail API“ aktivieren → IAM → Dienstkonto
„kompass-lauf“ → Schlüssel (JSON) erzeugen → Admin-Konsole → Sicherheit → API-Steuerung → domänenweite Delegation → Client-ID des
Dienstkontos mit Bereich `https://www.googleapis.com/auth/gmail.readonly` eintragen. Dann im Terminal (nie über den Chat):

```
! cd ~/gfweekly && npx --yes supabase secrets set GOOGLE_SA_JSON="$(base64 < ~/Downloads/kompass-lauf.json)" --project-ref bnfmupnmqyrcltrphfak && rm ~/Downloads/kompass-lauf.json
```

Ich prüfe nur das Ergebnis (`ping` meldet `gmailConfigured`, `lauf_gmail_probe` zählt Threads). Die Function signiert das JWT selbst
(WebCrypto RS256), keine Bibliothek. Bis der Zugang da ist, läuft alles mit `mails:[…]` aus der Nutzlast.

## 3 · Rückblickende Simulation statt Beobachtungswoche

Sobald `lauf.ts` steht: Modus `probe`, Zeitraum 28.09. bis 26.10.2026, Alex' Postfach über den Gmail-Anschluss dieser Sitzung
(Leas Postfach erst mit dem Zugang aus 2.4), dazu Einwürfe, Plattform-Feeds und Verlauf aus der Datenbank. Ergebnis in
`hh_lauf_protokoll` mit `run_id 'retro-…'`. Auswertung gegen die Wirklichkeit: Punkte, die Alex oder Lea in dem Zeitraum von Hand
erledigt haben, gegen das, was der Lauf als `sicher` erkannt hätte (Trefferquote, Fehlalarme), und wie viele Sichtungen je Tag
entstanden wären. Aus den Zahlen ziehe ich die Schwellen fest (`sicherheit`, Deckel, Fensterbreite) und schreibe sie in den Technikstand.
Dieser Rückblick ersetzt eure Beobachtungswoche für (a), (b) und (d); (c) kommt aus der Liste selbst.

## 4 · Stufe 3: weniger Seiten

- **Vertretung auf einer Seite:** `vertretung.html` nimmt Übergabe (Korb) und Rückkehr (Lagebild) als Reiter auf; `uebergabe.html` und
  `rueckkehr.html` leiten dorthin weiter (`?tab=uebergabe|rueckkehr&id=`), bestehende Links bleiben gültig.
- **Jahr in Saison:** Zyklus, Meilensteine, Rituale als Reiter in `saison.html`; `jahr.html` leitet weiter.
- **Wichtige Seiten und Bearbeiten weg:** Links wandern in die Seitenleiste unter „Verwalten → Einstellungen“ als Klappe; Personen- und
  Linkpflege in `einstellungen.html`.
- **Navigation auf drei Gruppen:** Heute (Für dich, Entscheidungen, Vorhaben, Neuigkeiten, Besprechung), Arbeiten (Vorstand, Saison,
  Kommunikation, Launch, Organisation, Besetzung, So arbeiten wir, Vertretung), Verwalten (Einstellungen). 14 Einträge.
- Dateien bleiben; Weiterleitungen sind eine Zeile Skript je Seite; Schirme und Inventar werden nachgezogen.

## 5 · Stufe 4: Ruhe halten

- Selbstabschaltung nach (b): wöchentliche Prüfung im Tick; unter 50 % zwei Wochen lang → `modus 'vorschlag'`, `abbruch_grund`, Ticker.
- Alterung: Vorschläge verfallen nach 14 Tagen (seit Stufe 2), Kandidaten nach 14 Tagen (bestehend), vertagte Entscheidungen melden
  sich am Stichtag (bestehend); neu: Punkte ohne Bewegung seit 60 Tagen bekommen in der Akte die Marke „ruht“ und erscheinen in der
  Entscheidungsliste nicht mehr als überfällig, bis jemand sie anfasst (Spalte `ruht_seit` aus dem Verlauf berechnet, keine Migration).
- Kriterien-Ampel in den Einstellungen (Abschnitt 2.3) statt Beobachtungstabelle.

## 6 · Prüfweg, automatisch (wie Stufe 2)

1. Branch `stufe-3/lauf-im-kompass` von `origin/main`, Eintrag `docs/ARBEITSPAKETE.md` (WP-S3), Asset-Version plus eins.
2. `pruefung/stufe3-probe.mjs` gegen das echte Backend: Einstellungen setzen (nur Alex/Lea), `lauf_tick {probe:true, mails:[Fixtures]}`
   (sicher, wahrscheinlich, unklar, gesendete Mail, Einwurf-Adresse, Deckel), `modus live` auf einem Testvorhaben mit Testpunkt
   (erledigt, Beleg, Rückgängig, zweites Erledigen desselben Punkts abgelehnt), Selbstabschaltung mit gefälschter Bilanz, `lauf_gmail_probe`
   ohne Secret (sauberer Fehler), Weiterleitungen der alten Seiten; danach aufräumen. Bedienproben für Einstellungen, Vertretung mit
   Reitern, Saison mit Reitern; Schirme 1440/390; Webstandard; Wächter.
3. Codex, drei Runden, eigener Worktree je Commit, Prüfauftrag `docs/reviews/STUFE3-pruefauftrag.md` (zusätzlich: Lauf schreibt nur im
   richtigen Modus; Deckel; Vertraulichkeit im Prompt; JWT-Signatur ohne Schlüssel im Log; Weiterleitungen ohne Schleife).
4. Deploys zwischendurch sind unkritisch, weil `modus` auf `aus` steht. **Ein** Push nach `main` am Ende, dann Live-Prüfung,
   `docs/STAND-STUFE-3.md` (zehn Sätze), Technikstand in fünf Kategorien, Arbeitsradar.
5. Stopp-Gründe (Zeile in `FRAGEN_FUER_MORGEN.md`, Arbeit geht weiter): Google-Secret fehlt beim Live-Gang (dann bleibt `modus 'probe'`
   mit Fixtures, der Rest wird fertig); Simulation zeigt (a) unter 30 % trotz Schwellen (dann Live-Gang nur als `vorschlag`, Begründung
   im Technikstand); Edge-Function-Grenze reißt bei N Threads (dann N kleiner, mehr Ticks).

## 7 · Nicht anfassen

Entscheidungsliste, Akte, Besprechung, Korbaufbau, Stufe-2-Funktionen; `hh_einwurf`-Weg (Einwurf bleibt eigener Weg mit Claude);
Asana-Export; Verkauf 2027; Spielschicht aus. Cowork-Aufträge werden nicht von mir geändert, nur am Ende von Alex ausgeschaltet.

## 8 · Lesarten, vorab entschieden

- Das Modell des Laufs steht im Code als Vorgabe `claude-opus-5-5` (Einstellungen überschreiben), kein neues Secret.
- Der Lauf arbeitet nur mit Mails der Postfächer alex@ und lea@ sowie Datenbankquellen; keine Kalender, kein Drive.
- Mailinhalte landen nicht in der Datenbank, nur Betreff-Kürzel, Beleg-Satz und Gmail-Link.
- Leas Rückblick läuft erst mit dem Google-Zugang; bis dahin steht im Stand „Alex' Postfach“.

## 9 · Testaufgabe (fachliche Annahme, einmal, am Ende)

Alex (15 Minuten, Handy): Einstellungen öffnen, Lauf-Modus von `vorschlag` auf `live` stellen, Bilanz lesen; am nächsten Morgen „Für dich“:
ein vom Lauf erledigter Punkt mit Beleg in der Akte, einmal Rückgängig; Vertretung-Seite mit Reitern; Mehrfachauswahl „Nicht jetzt“ auf
der Liste bis unter 15.
Lea (15 Minuten): Vertretung → Rückkehr, drei Entscheidungen aus „Nach Menschen“ verteilen, „Willkommen zurück“; Saison mit Reiter Jahr.
Danach: Cowork-Abgleich (Alex und Lea) ausschalten, „angenommen“ sagen. Stufe 3 und 4 gelten dann als fachlich angenommen; die
Kriterien laufen vier Wochen sichtbar in den Einstellungen mit.

## 10 · Für die Terminal-Sitzung

```
cd ~/gfweekly && git fetch origin && git checkout -b stufe-3/lauf-im-kompass origin/main && cp "$HOME/Documents/Claude/02 Projects/Geschäftsführung Wilde Möhre/Claude outputs/PAKET-STUFE-3-LAUF-IM-KOMPASS.md" docs/PAKET-STUFE-3-LAUF-IM-KOMPASS.md && claude "Lies docs/PAKET-STUFE-3-LAUF-IM-KOMPASS.md vollständig. Führe die Abschnitte 2 bis 6 in dieser Reihenfolge aus und arbeite ohne Rückfragen durch: triff Detailentscheidungen selbst und notiere sie im Technikstand. Stoppe nur bei einem Stopp-Grund aus Abschnitt 6.5 und schreibe dann die Zeile in FRAGEN_FUER_MORGEN.md. Am Ende docs/STAND-STUFE-3.md schreiben und mir die zehn Sätze daraus ausgeben."
```

Die Freigaberegeln aus Stufe 2 (`~/gfweekly/.claude/settings.local.json`) gelten weiter; neu nötig ist nur `Bash(npx --yes supabase secrets set *)`
für Alex' eigenen `!`-Befehl (läuft ohnehin in seinem Terminal, nicht in der Sitzung).
