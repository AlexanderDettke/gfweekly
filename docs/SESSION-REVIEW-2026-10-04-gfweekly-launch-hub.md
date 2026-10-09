# Session-Review 04.10.2026

Sitzung 1803f29f, gestartet in `~` (nicht im Projektordner), Zeitraum 30.09. bis 04.10.2026.
Projekte: gfweekly („Hohes Haus“) und habitat-hub. Dieser Bericht liegt in gfweekly/docs, weil die Sitzung dort begann.
Kennzeichnung: **[geprüft]** mit Beleg aus dieser Phase 1 (04.10., etwa 14:40), **[angenommen]** ohne frischen Beleg.

## 1. Worum es ging

- gfweekly V28: Saisonseite als „vier Fragen“ aus echten Daten.
- gfweekly V29, V29b und V29c: Launch verteilen, an Asana senden, stündlich aus Asana zurückholen, Partner-Teilung.
- gfweekly V30: Das Jahresrad liest die Termine live aus `vvp_events`.
- gfweekly V31: Zweig `paket/v31-vorhaben` pushen, mergen und den Deploy prüfen. Gebaut hat ihn eine andere Sitzung.
- habitat-hub: Startprompt Wissen. Davor kam die Pilotwoche mit WP-68 bis WP-71, danach WP-72 bis WP-75.
- Deine acht Entscheidungen zu Pilot, E-105 und E-106 umsetzen und deine Handgriffe als Asana-Aufgabe anlegen.

## 2. Was passiert ist

| Schritt | Ergebnis | Beleg |
|---|---|---|
| V28 bis V30 gebaut, getestet und deployt | grün | [geprüft] `launch-test.mjs`: 154 Proben, 0 Befunde. Wächter: keine Befunde. Seiten saison, launch und vorhaben antworten mit 200. |
| Codex-Reviews V28 bis V30 | je Paket bis drei Runden | [angenommen] Die Runden stehen in docs/TECHNIKSTAND.md. In Phase 1 habe ich sie nicht erneut nachgelesen. |
| Stündlicher Rückweg aus Asana | läuft | [geprüft] Die cron-Läufe um 09:23, 10:23, 11:23 und 12:23 UTC endeten mit „succeeded“. 19 Meilensteine haben eine Asana-Kennung, 10 sind erledigt. |
| V31 gemergt und deployt | erledigt | [geprüft] main steht auf 81ef077 und ist gleich origin. Der Wächter-Lauf in GitHub für diesen Commit ist grün. |
| Hub WP-B1, WP-68, WP-69, WP-70 | gebaut, live, Codex FREI bis auf Vorlage WP-70 | [geprüft] Siehe docs/berichte/pilotwoche/STAND.md im Hub. |
| Hub WP-71 bis WP-79 | von der Parallelsitzung gebaut | [geprüft] hub.releases zeigt 0.22.3 vom 04.10. um 04:56, Tag v0.22.3. |
| Entscheidungen 1 bis 8 | als Antwortdatei abgelegt | [geprüft] Die Datei docs/antworten/2026-10-04-entscheidungen-pilot-e105-e106.md liegt im Hub. |
| Asana-Aufgabe für deine Handgriffe | angelegt | [angenommen] Aufgabe 1219129803597150. Ihren Stand habe ich nicht erneut abgerufen. |

Pannen dieser Sitzung:

- **Zwei Sitzungen im Hub.** Zwei Sitzungen haben denselben Startprompt gleichzeitig im selben Arbeitsbaum abgearbeitet. Ich habe das erst nach WP-70 bemerkt. Folgen waren eine doppelte Ernte von WP-70, ein Sichtlauf mit roten Bildern und eine doppelt vergebene Nummer WP-68.
- **Abgewiesener Push.** Ein Push wurde abgewiesen, und `| grep -v LFS` hat die Meldung verschluckt. Ich habe ihn als erfolgreich behandelt.
- **Überschriebener Test.** Ich habe den fremden Test wp68.sql überschrieben und ihn danach aus git wiederhergestellt.
- **Codex-Aufrufe.** Das Modell gpt-6.1-sol wurde abgelehnt. Außerdem blieb ein Aufruf an stdin hängen, und eine verwaiste Schleife musste ich per PID beenden.

## 3. Aktueller Stand

| Bereich | Ampel | Begründung |
|---|---|---|
| gfweekly Code und Repo | grün | [geprüft] Der Arbeitsbaum ist sauber, main ist gleich origin, Tests und Wächter sind grün. |
| gfweekly Live-Seiten | grün | [geprüft] saison, launch und vorhaben antworten mit 200 und liefern styles.css?v=30. |
| gfweekly Abnahmebeleg | gelb | [geprüft] `pruefung/letzte-abnahme.json` gehört zu 552ddd9. Danach folgten zwei Commits mit 21 Dateien, darunter die Edge Function und eine Migration. Für den Stand 81ef077 gibt es keinen Abnahmebeleg. |
| gfweekly Prüftiefe | gelb | [geprüft] Die Abnahme vermerkt selbst als ungeprüft: Wirkung in der Datenbank, Asana-Lebenszyklus, Nebenläufigkeit und verborgene Oberflächenteile. Befund 29 aus BEKANNTE-MAENGEL gilt weiter: Die Bedienproben belegen die Oberfläche, nicht den Durchstich. |
| Asana-Rückweg | grün | [geprüft] Siehe die cron-Läufe in Abschnitt 2. |
| Edge Functions | gelb | [geprüft] gfweekly und saison sind aktiv. Ein Ping ohne Passwort liefert „unauthorized“, wie es sein soll. Die interne Version v37 und saison v2 habe ich nicht live abgefragt, weil ich dafür das Vault-Secret bräuchte. |
| Alter Bereich `partner` | gelb | [geprüft] Die Zeile steht noch. Sie hängt an `gfweekly_team_felder`, der Löschbefehl aus der Übergabe scheitert daran. Das steht im TECHNIKSTAND unter „Offen“. |
| V31 Mängel | gelb | [geprüft] Sieben Punkte stehen in BEKANNTE-MAENGEL. Punkt 1 betrifft den alten Abgleich-Text in Cowork und kann nur Alexander lösen. |
| Hub Code und Deploy | grün | [geprüft] main ist gleich origin, Tag v0.22.3, die Site antwortet mit 200. |
| Hub Arbeitsbaum | gelb | [geprüft] 75 unversionierte fremde Dateien, darunter Claude outputs/ und apps/hub/supabase/. Sie stammen nicht aus dieser Sitzung. Niemand hat sie geprüft. |
| Hub Pilot | gelb | [geprüft] Der Pilot endet am 06.10. Laut STAND.md ist U21 offen: Amelie, Florian und Lea haben kein Profil. |
| Deine Handgriffe | rot | [angenommen] NETLIFY_TOKEN, CHAT_RAUM_TEAM, /pflege und /offen sind offen, solange die Asana-Aufgabe nicht erledigt ist. |

## 4. Selbstreflexion

**Note: 6 von 10.**

Gut:

- Jedes Paket hatte Tests, eine Codex-Review und einen dokumentierten Stand.
- Der Asana-Rückweg läuft nachweislich stündlich.

Schlecht:

- **Parallelsitzung.** Ich habe den Hub-Startprompt begonnen, ohne nach einer anderen Sitzung im selben Baum zu sehen. Das hat drei Pakete lang doppelte Arbeit und Verwirrung erzeugt. Diese Lücke war vermeidbar.
- **Push-Meldung.** Ich habe die Ausgabe eines Push gefiltert und einen Fehlschlag übersehen. Das widerspricht meiner eigenen Regel „Push-Ausgaben nie wegfiltern“, die ich erst danach notiert habe.
- **Live vor der Prüfung.** WP-68 ging vor der Codex-Prüfung live. Die Entscheidung war begründet, aber Runde 1 ergab STOPP. Damit lief eine fehlerhafte Fassung etwa 30 Minuten produktiv.
- **Falscher Ordner.** Die Sitzung lief aus `~`. Damit galt der Stop-Hook des Wächters aus gfweekly/.claude/settings.json für mich vermutlich nicht [angenommen]. Der Wächter in GitHub fing das nur nachträglich ab.
- **Veralteter Beleg.** Den Abnahmebeleg nach dem V31-Merge habe ich nicht erneuert.

## 5. Wächter-Empfehlung

Ein Wächter existiert in gfweekly bereits: `pruefung/waechter.mjs`, ein Stop-Hook und ein GitHub-Workflow. Im Hub gibt es ci.yml. Es fehlt kein neues Werkzeug. Es fehlen drei Lücken, die diese Sitzung gezeigt hat.

**Minimalversion unter 1 Stunde, ohne Installation:**

1. **Sitzungsprüfung vor dem Start.** waechter.mjs bekommt eine Prüfung, ob `letzte-abnahme.json` zum aktuellen HEAD passt. Bei Abweichung meldet er „Abnahme veraltet“. Das hätte die gelbe Zeile in Abschnitt 3 sofort gezeigt.
2. **Push mit Prüfung.** Im Wächter steht der Abgleich `git status -sb` auf „ahead“ oder „behind“. Ist main nach einem Push nicht gleich origin, gibt es eine Meldung.
3. **Arbeitsordner.** Ein Satz in CLAUDE.md beider Repos: Sitzungen starten im Projektordner, sonst greift der Hook nicht.

**Ausbaustufe:**

- **Hub-Sperrdatei.** Eine Datei `.ausfuehrer` im Hub nennt die laufende Sitzung. Ein zweiter Ausführer bricht beim Start ab.
- **Durchstich-Probe.** Ein Lauf gegen die Datenbank prüft launch_list, launch_set an einem Testplan und launch_sync. Er schließt Befund 29.
- **Ampel-Datei.** Ein Skript schreibt den Abschnitt 3 dieses Berichts automatisch.

## 6. Offene Fragen

**F1. Abnahmebeleg für 81ef077.**

- A: Ich lasse `pruefung/abnahme.sh` jetzt laufen und lege den Beleg ab. Das ist ein Commit.
- B: Der Beleg bleibt veraltet, bis das nächste Paket ihn erneuert.
- C: Der Beleg kommt in die Minimalversion des Wächters und wird dort erzwungen.
- Empfehlung: A, danach C.

**F2. Alter Bereich `partner`.**

- A: Die Zeile in `gfweekly_team_felder` umhängen und den Bereich löschen. Das ist eine Migration.
- B: Den Bereich mit sort 99 stehen lassen.
- C: Den Bereich nur in der Oberfläche ausblenden.
- Empfehlung: A, weil der Rest schon nichts mehr mit `partner` verbindet.

**F3. Die 75 unversionierten Dateien im Hub.**

- A: Eine Sitzung sichtet sie und schlägt je Datei vor, ob sie committet, ignoriert oder gelöscht werden soll. Gelöscht wird nichts ohne dich.
- B: Die Dateien bleiben liegen.
- C: Die Dateien kommen nach .gitignore.
- Empfehlung: A. Darunter liegen Seeds wie supabase/einspielen-0.16.x, die vielleicht nie eingespielt wurden.

**F4. U21, die Erinnerungen an Amelie, Florian und Lea vor dem Pilotende am 06.10.**

- A: Du schickst sie heute selbst.
- B: Ich lege dir Entwürfe in Gmail an. Gesendet wird erst nach deinem Okay.
- C: Die Erinnerungen entfallen, der Pilot endet mit den bisherigen Teilnehmenden.
- Empfehlung: B.

## 7. Nächste Pakete

1. **P1 Abnahme erneuern.** Abnahme für 81ef077 laufen lassen und den Beleg committen. Dauer etwa 15 Minuten.
2. **P2 Wächter-Minimalversion.** Abschnitt 5, Punkte 1 bis 3. Dauer unter 1 Stunde.
3. **P3 Bereich `partner` aufräumen.** Gilt bei F2 = A. Migration, Test und Codex-Review.
4. **P4 Hub-Arbeitsbaum sichten.** Gilt bei F3 = A. Ergebnis ist nur ein Bericht.
5. **P5 Durchstich-Probe.** Ausbaustufe des Wächters für launch_* gegen einen Testplan.

## 8. Werkzeug je Paket

| Paket | Werkzeug | Grund |
|---|---|---|
| P1 | Claude Code im Ordner gfweekly | Das Skript läuft lokal mit Playwright. |
| P2 | Claude Code im Ordner gfweekly, danach Codex-Review | Kleine Codeänderung mit Prüfung. |
| P3 | Claude Code im Ordner gfweekly | Migration über die Supabase-CLI, Live-Test über pg_net. |
| P4 | Codex read-only im Ordner habitat-hub | Es wird nur gelesen. Das ist billiger und unabhängig. |
| P5 | Claude Code im Ordner gfweekly | Braucht das Vault-Secret und Testdaten. |

Übergabe-Prompts:

**P1:**

```
cd ~/Documents/GitHub/gfweekly. Lies docs/SESSION-REVIEW-2026-10-04.md, Abschnitt 3.
Führe pruefung/abnahme.sh aus. Ist sie grün, committe nur pruefung/letzte-abnahme.json
mit "chore: Abnahme für 81ef077" und pushe. Ist sie rot, ändere nichts und melde die Befunde.
```

**P2:**

```
cd ~/Documents/GitHub/gfweekly. Baue die Minimalversion aus docs/SESSION-REVIEW-2026-10-04.md, Abschnitt 5:
(1) waechter.mjs meldet, wenn pruefung/letzte-abnahme.json nicht zu HEAD passt;
(2) waechter.mjs meldet, wenn main nicht gleich origin/main ist (nur lokal, nicht in CI);
(3) ein Satz in CLAUDE.md: Sitzungen starten im Projektordner.
Nichts installieren. Danach Tests, Codex-Review read-only nach ~/.claude/CLAUDE.md, Commit, Push.
```

**P3:**

```
cd ~/Documents/GitHub/gfweekly. Lies docs/TECHNIKSTAND.md, Abschnitt V29c "Offen".
Schreibe eine Migration, die die Zeile in gfweekly_team_felder vom Bereich partner auf den
passenden neuen Bereich umhängt (bei Unklarheit: auf formatpartner und Annahme dokumentieren),
die Zeile in gfweekly_launch_besetzung_vorher erhält und den Bereich partner löscht.
Vorher zählen, nachher zählen. Abnahme, Codex-Review, TECHNIKSTAND nachtragen, Commit, Push.
```

**P4:**

```
codex exec --sandbox read-only --skip-git-repo-check -m gpt-6-sol --output-last-message <scratchpad>/hub-unversioniert.md \
"Im Ordner ~/Documents/GitHub/habitat-hub: Liste alle unversionierten Dateien (git status --porcelain).
Schlage je Datei oder Ordner vor: committen, in .gitignore oder löschen, mit einem Satz Begründung.
Prüfe bei SQL-Dateien, ob ihr Inhalt schon in supabase/migrations oder supabase/seeds steht.
Ändere nichts. Starte keine weiteren Reviewer." < /dev/null
```

**P5:**

```
cd ~/Documents/GitHub/gfweekly. Baue pruefung/launch-durchstich.mjs: ruft über pg_net mit dem
Vault-Secret gfweekly_password launch_list, launch_set an einem Testplan und launch_sync auf,
prüft die Wirkung in der Datenbank und räumt danach auf. Keine Secret-Werte in Datei oder Log.
In abnahme.sh einhängen. Codex-Review, Commit, Push.
```

## 9. Klare Empfehlung

P1 zuerst. Der Schritt dauert eine Viertelstunde und macht den Stand 81ef077 belegbar. Danach P2, damit derselbe Fehler nicht wieder unbemerkt bleibt. Vor dem 06.10. solltest du außerdem F4 entscheiden, sonst endet der Pilot mit drei fehlenden Personen.

Freigabe für Paket P1?

## Abschluss und Übergabe (05.10.2026)

**Stand bei Sitzungsende.** gfweekly main = origin/main auf 81ef077, Arbeitsbaum sauber bis auf diesen Bericht (nicht committet). habitat-hub main = origin/main auf faf0721b, Version 0.22.3, 75 fremde unversionierte Dateien unberührt. Der stündliche Asana-Rückweg läuft (cron hh_launch_sync_stuendlich, Minute 23). Skills session-review und session-audit liegen unter ~/.claude/skills und ~/.codex/skills; dieser Bericht liegt zusätzlich in ~/Leitstand/session-reviews.

**Antworten von Alexander.** Die Freigabe für P1 und die Antworten zu F1 bis F4 stehen aus. Nichts davon ist begonnen.

**Aufgaben für die nächste Sitzung, in dieser Reihenfolge:**

1. Im Ordner ~/Documents/GitHub/gfweekly starten, nicht in `~`, damit der Stop-Hook des Wächters greift.
2. Diesen Bericht lesen und mit `git fetch` und `git log 81ef077..origin/main` prüfen, ob der Stand noch stimmt.
3. Alexanders Antworten zu F1 bis F4 einholen bzw. aus docs/ übernehmen, dann P1 (Abnahme erneuern) und P2 (Wächter-Minimalversion) nach den Prompts in Abschnitt 8.
4. Vor dem 06.10.: F4 klären (Erinnerungen an Amelie, Florian, Lea zum Pilotende).
5. Im Hub vor jedem Schritt prüfen, ob eine andere Sitzung dort arbeitet (ListAgents, git fetch). Push-Ausgaben nie filtern.
6. Diesen Bericht erst committen, wenn Alexander es freigibt.

**Startprompt für die nächste Sitzung:**

```
cd ~/Documents/GitHub/gfweekly. Lies docs/SESSION-REVIEW-2026-10-04-gfweekly-launch-hub.md,
besonders "Abschluss und Übergabe". Prüfe mit git fetch und git log, ob der Stand noch stimmt,
und melde Abweichungen. Dann warte auf meine Antworten zu F1 bis F4 und die Freigabe für P1.
```
