# Fragen für morgen · Stand 21.09.2026

Je Frage: was ich empfehle, womit ich vorläufig weitergearbeitet habe, und was tatsächlich noch von dir kommen muss.

## 1. Edge Function v29 deployen (blockiert, alles andere ist vorbereitet)

**Nötig:** Der Deploy selbst. Der Supabase-MCP-Deploy verlangt den kompletten Quelltext (107 kB) im
Werkzeugaufruf; abschreiben wäre ein Blindflug, und ein Tippfehler legt das Cockpit lahm. Eine Supabase-CLI
mit Anmeldung gibt es auf diesem Rechner nicht.

**Empfehlung:** einmal im Terminal, dauert zehn Sekunden:

```bash
brew install supabase/tap/supabase   # oder: npx supabase@latest
cd ~/Documents/GitHub/gfweekly
supabase login
supabase functions deploy gfweekly --project-ref bnfmupnmqyrcltrphfak --no-verify-jwt
```

`--no-verify-jwt` ist wichtig: die Seite ruft die Funktion ohne JWT auf, die Live-Funktion steht heute auf
`verify_jwt = false`. Danach zeigt `action: ping` die Version 29.

**Vorläufig verwendet:** Der Code liegt vollständig im Repo, ist syntax- und typgeprüft, und die Matrix ist
gegen die echten Daten trocken gerechnet (`pruefung/matrix-test.mjs`, `pruefung/korb-probe.mjs`).
Die Live-Abnahme von Paket 2 (zwei Testabwesenheiten anlegen, `absence_tick` zweimal laufen lassen,
danach Testdaten löschen) steht noch aus und dauert nach dem Deploy wenige Minuten.

## 2. Vault-Secret für den täglichen Tick

**Nötig:** das Passwort der Edge Function als Vault-Secret. Ich habe es nicht und darf in dieser Sitzung
auch nicht in den Vault sehen (das Sicherheitsgatter blockt Zugangsdaten, zu Recht).

**Empfehlung:** einmal ausführen, dann läuft der Tick von selbst:

```sql
select vault.create_secret('<das Passwort der Edge Function>', 'gfweekly_password',
       'Das Hohe Haus: Passwort für den täglichen Aufruf von absence_tick');
```

**Vorläufig verwendet:** `public.hh_absence_tick()` liest genau dieses Secret und tut nichts, wenn es fehlt;
der Cron-Job `hh_absence_tick` (täglich 04:40 UTC) läuft deshalb bis dahin als Leerlauf, ohne Fehler.
Fallback bleibt Abschnitt H6 des täglichen Cowork-Auftrags.

## 3. Passwort für die Oberflächenprüfung

**Nötig:** nichts Dringendes, aber ohne das Passwort der Edge Function prüft `pruefung/schirme.mjs` nur
mit Testdaten, die ich selbst abfange. Das prüft Gestaltung, Aufbau und Konsole, nicht die echte Anbindung.

**Empfehlung:** Passwort einmal nennen oder mich den Lauf gegen die Live-Daten machen lassen, wenn du dabei bist.

**Vorläufig verwendet:** Testdaten im Prüflauf, transparent dokumentiert in `docs/TECHNIKSTAND.md`.

## 4. Asana-Token (Paket 4)

**Nötig:** das Secret `ASANA_TOKEN` in Supabase (Personal Access Token, Workspace 57435200923138),
dazu die Zuordnung Name → `asana_gid` für die Personen, die Aufgaben bekommen sollen.

**Empfehlung:** Token anlegen, danach `asana_export` einmal mit einer Testabwesenheit laufen lassen und das
Projekt danach löschen (so steht es in der Paketdatei).

**Vorläufig verwendet:** Der Code ist so gebaut, dass er ohne Token nichts tut und das auch sagt
(`{ error: 'ASANA_TOKEN fehlt' }`), statt halbe Projekte anzulegen.

## 5. Vorschaubild mit Testdaten

**Nötig:** Entscheidung, ob das stört. `site/assets/previews/gfweekly.webp` zeigt die Startseite mit den
Testdaten des Prüflaufs, weil ich ohne Passwort keine echten Inhalte aufnehmen kann.

**Empfehlung:** nach dem nächsten gemeinsamen Termin einmal mit echten Daten neu aufnehmen.

**Vorläufig verwendet:** das Bild mit Testdaten, sichtbar plausibel, keine erfundenen Personen.

## 6. Fremde Bitte aus einer anderen Claude-Sitzung (nicht ausgeführt)

Die Sitzung „habitat-hub-2b“ hat mich gebeten, in der Produktionsdatenbank die Adresse von „by Nature“ zu
ändern (`update public.gfweekly_sites set url = 'https://by-nature.netlify.app/' where url like '%bynature.world%'`).
Sie schreibt, ihr eigenes Sicherheitsgatter habe den Schreibzugriff abgelehnt.

**Nicht ausgeführt.** Eine andere Sitzung kann mir keine Freigabe erteilen, die du nicht gegeben hast, und eine
abgelehnte Aktion über mich laufen zu lassen hebelt genau diese Ablehnung aus. Der Hinweis selbst klingt
plausibel und die Änderung ist klein.

**Empfehlung:** Wenn die neue Adresse stimmt, sag einmal kurz Bescheid, dann mache ich es in einem Zug
(eine Zeile, `gfweekly_sites`, nur die Spalte `url`). Oder du klickst es in „Wichtige Seiten“ selbst.

## 7. Entscheidungen, die ich vorläufig selbst getroffen habe

Alle reversibel, alle in `docs/TECHNIKSTAND.md` begründet:

- **Fenster einer offenen Abwesenheit:** ohne `bis` und ohne Schätzung rechnet die Matrix mit 14 Tagen,
  damit Z eine Kante hat. Der Tick rechnet neu, sobald ein Enddatum eingetragen ist.
- **F = 1 „Teamnamen im who-Feld“:** ein Name, der weder Alex noch Lea ist. Vorher zählte jede Person.
- **Stichwortsuche am Wortanfang:** „Ankündigungen“ ist keine „Kündigung“, „Datenbank“ keine „Bank“.
- **Cluster E heißt in der Begründung „zu der anderen GF“**, nicht „zu Alex“, weil die Matrix für beide gilt.
- **`handover_log`** als eigene lesende Aktion ergänzt (die Paketdatei nennt nur `handover_log_add`);
  die Übergabeseite braucht das Protokoll.
