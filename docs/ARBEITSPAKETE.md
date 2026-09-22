# Arbeitspakete · gemeinsamer Stand

Eine Zeile Wahrheit für alle Sitzungen, die an diesem Haus arbeiten. Wer ein Paket übernimmt, trägt sich
hier ein **und** legt den Branch an. Der Branch ist die Sperre, nicht die Notiz: gibt es ihn schon, ist das
Paket besetzt.

```bash
git ls-remote --heads origin        # welche Pakete sind besetzt
git switch -c paket/<name>          # übernehmen
```

Regeln der Zusammenarbeit (wer prüft, wer entscheidet) stehen in der globalen `CLAUDE.md`.
Offene Befunde aus der letzten Prüfung stehen in `docs/BEKANNTE-MAENGEL.md`.

## Rollen, Stand 22.09.2026

| Rolle | Wer | Erreichbar |
|---|---|---|
| Koordinator | **keiner festgelegt** | `ListAgents` meldet keine andere Claude-Sitzung. Codex ist hier ein CLI, das einmalig aufgerufen wird, keine Sitzung, die koordinieren könnte. |
| Ausführer | Claude Code, Sitzung `alexanderdettke-16` | ja |
| Prüfer | Codex CLI 0.155.1, read-only, je Paket am genauen Commit | ja, einseitig |

Solange kein Koordinator erreichbar ist, arbeitet der Ausführer abgegrenzte Pakete allein und lässt jedes
am genauen Commit prüfen. Zusammenarbeit, die es nicht gibt, wird nicht behauptet.

## Pakete

### WP-01 · Wächter: mechanische Prüfungen statt Selbstauskunft

- **Auftrag:** Prüfungen bauen, die die Befunde vom 22.09.2026 vor dem Commit gefunden hätten, und sie so
  aufhängen, dass sie unabhängig von jeder Behauptung eines Modells laufen.
- **Zuständig:** Claude Code, Branch `waechter`.
- **Stand:** fertig, eine Prüfrunde durch Codex am Commit `4cdd506` gelaufen, zehn Befunde behoben.
- **Betroffene Dateien:** `pruefung/waechter.mjs`, `pruefung/waechter-hook.sh`, `pruefung/schirme.mjs`,
  `pruefung/abnahme.sh`, `pruefung/matrix-test.mjs`, `pruefung/korb-probe.mjs`, `pruefung/bedienung.mjs`,
  `.github/workflows/waechter.yml`, `.claude/settings.json`, `site/assets/styles.css`,
  `supabase/migrations/*` (nur umbenannt), `README.md`, `ARBEITSSTAND.md`, `docs/TECHNIKSTAND.md`.
- **Abnahmekriterien:**
  1. Der Überlauf auf dem Handy (428 px statt 390) wird als Fehler gemeldet, nicht übersehen.
  2. Kontrast wird am gerenderten Bild gemessen, nicht aus einer Liste gelesen.
  3. Doppelte Versionskennungen bei Migrationen werden gemeldet.
  4. Tests, die das Backend abfangen, dürfen sich nicht Abnahme nennen.
  5. Tests mit festen Datumswerten haben einen festen Stichtag.
  6. „Fertig" braucht einen Beleg, der zum aktuellen Commit gehört.
  7. Die Prüfungen laufen in CI bei jedem Push und als Stop-Hook in Claude Code.
  8. `node pruefung/waechter.mjs` meldet null Befunde, und `pruefung/abnahme.sh` läuft durch.
- **Ergebnis:** alle acht Kriterien erfüllt. Der Wächter hat beim ersten Lauf 16 Befunde gemeldet, alle sind
  behoben: zehn Migrationen auf eindeutige Kennungen umbenannt (jetzt gleich der angewendeten Fernhistorie),
  Oberflächentests als solche benannt, fester Stichtag in Matrixprobe und Korbprobe, Belegdatei eingeführt.
  Dazu zwei echte Fehler, die die neuen Messungen gefunden haben:
  der Überlauf der Vertretungstabelle auf 428 px (jetzt stapeln die Zeilen unter 560 px) und
  `.linkrow .lt` mit 2,78:1 im hellen Thema (jetzt `--on-band` auf `--info`, 10,59:1).
  `./pruefung/abnahme.sh` läuft durch: 0 Abweichungen, 0 Funde, 0 Paare unter der Schwelle,
  alle Matrixproben, 64 Bilder ohne Meldung, alle Bedienproben, Wächter ohne Befund.
  **Prüfrunde 1 (Codex, Stand `4cdd506`): zehn Befunde, fünf schwer, alle behoben.** Der Wächter ließ sich
  umgehen: der Kontrast rechnete Deckkraft der Vorfahren und halbdurchsichtige Untergründe nicht mit und
  übersah Eingabewerte, Platzhalter und Pseudoelemente; `stand.sh` erfasste keine neuen Dateien, lieferte bei
  kaputtem Git trotzdem eine Prüfsumme, und ein selbst geschriebener Beleg mit leeren Feldern kam durch;
  der Hook schaltete sich bei sauberem Arbeitsbaum ab und fand sein Skript nicht aus einem Unterverzeichnis;
  das Stichwort „Oberflächentest“ legitimierte eine Abnahmebehauptung; CI ließ eine ausgefallene Prüfung
  durchgehen; Pfade mit Leerzeichen brachen die Datei­suche. Jedes dieser Szenarien ist nachgestellt und
  schlägt jetzt fehl, wie es soll.
  **Prüfrunde 2 (Codex, Stand `12d9458`): vierzehn Punkte.** Behoben sind die neun, die den Wächter blind oder
  kaputt machten: die Überlaufprüfung stürzte ab, weil beim Umbau ein Feld verlorenging und der Zugriff blieb
  (sie wäre beim nächsten echten Überlauf mit einem TypeError abgebrochen); die Grenze von acht Treffern zählte
  vor dem Filtern und konnte einen neuen Verstoß hinter bekannter Schuld verstecken, ohne sie kamen 52 weitere
  Altfälle ans Licht; die Ausnahmeliste galt für das ganze Haus statt für Seite, Thema und Messwert und ist
  jetzt maschinell erzeugt (`KONTRAST_AUSNAHMEN_SCHREIBEN=1`, 64 Einträge, 137 unterdrückte Treffer, null neue);
  die Deckkraft einer Gruppe wirkt jetzt auch auf deren Hintergrund; `stand.sh` ist als `stand.mjs` neu
  geschrieben, weil eine Shell-Pipeline weder Dateinamen mit Zeilenumbruch noch Fehler mittendrin sauber
  behandelt; der Beleg wird jetzt inhaltlich geprüft (existierender Commit, gültiges Datum in der
  Vergangenheit, je Lauf ein eigener kurzer Eintrag); die Abnahmebehauptung wird auch mit Füllwörtern erkannt
  und eine Verneinung nicht falsch getroffen; `fileURLToPath` auch in `schirme.mjs`.

  **Nicht behoben, mit Absicht (Grenze von zwei Korrekturrunden erreicht), weiter als WP-05:** die
  Kontrastmessung bleibt eine Näherung. Deckkraftgruppen werden schichtweise gerechnet, nicht als eigene
  Ebene; Pseudoelemente werden ohne eigenen Hintergrund gemessen; einzelne Zeichen in Eingabefeldern fallen
  unter die Mindestlänge; und `tokens.py` läuft in CI gar nicht, weil die Quelle des Design-Systems außerhalb
  des Repos liegt. Das sind Grenzen der Messung, keine offenen Lücken in der Aufhängung.
- **Nächster Schritt:** keiner, das Paket ist abgeschlossen.

### WP-02 · Die elf schweren Befunde aus `docs/BEKANNTE-MAENGEL.md`

- **Auftrag:** Zuständigkeiten beim Beenden und bei mehreren Abwesenheiten, Selbstvertretung, Wache über das
  Notizfeld, fehlende Entscheidungen im Protokoll, offenes Sammelfenster, Asana-Duplikate, Asana-Team.
- **Zuständig:** frei.
- **Stand:** offen, auf Entscheidung von Alex vom 22.09.2026 zurückgestellt.
- **Abnahmekriterien:** je Befund ein Szenario, das vorher fehlschlägt und nachher nicht mehr; Prüfung live
  gegen die Datenbank, nicht gegen Testdaten.

### WP-05 · Grenzen der Kontrastmessung schließen

- **Auftrag:** Deckkraftgruppen als eigene Ebene rechnen statt schichtweise; Pseudoelemente mit ihrem eigenen
  Hintergrund messen; einzelne Zeichen in Eingabefeldern erfassen; `tokens.py` mit einer versionierten
  Referenz in CI verbindlich laufen lassen.
- **Zuständig:** frei.
- **Stand:** offen, benannt in Prüfrunde 2 zu WP-01.
- **Abnahmekriterien:** Die vier Gegenbeispiele des Prüfers (weiße Schrift auf schwarzem Container mit
  `opacity: .5` über Weiß; weißer Pseudotext auf eigenem weißem Hintergrund; Eingabewert `"1"` weiß auf weiß;
  CI ohne Tokenvergleich) werden erkannt.

### WP-04 · Bekannte Kontrastschuld abtragen

- **Auftrag:** Die 18 Muster aus `pruefung/kontrast-ausnahmen.json` auf mindestens 4,5:1 bringen. Gefunden hat
  sie der gemessene Kontrast des Wächters, der anders als die alte Liste am gerenderten Bild misst.
  Der größte Brocken ist die Platzhalterfarbe des Design-Systems (3,88:1 im hellen Thema), sie betrifft jedes
  Eingabefeld. Dazu Prioritäts- und Relevanzmarken aus der Zeit vor V23, Knöpfe im Cockpit, und zwei Stellen in
  der Entscheidungsliste (2,78:1 und 2,05:1). Die schlechtesten Werte liegen bei 1,00:1 und 2,05:1.
- **Zuständig:** frei.
- **Stand:** offen. Die Ausnahmeliste hält den Lauf grün, zählt die Treffer aber bei jedem Lauf sichtbar mit
  (zuletzt 137 Treffer aus 64 Einträgen). Neue Verstöße und Verschlechterungen lassen den Lauf sofort scheitern.
- **Abnahmekriterien:** `pruefung/kontrast-ausnahmen.json` ist leer, und die Schirme melden null Kontrastfälle.
  Farben nur über Tokens, keine neuen Farben.

### WP-03 · Echte Integrationsprüfung statt Oberflächentest

- **Auftrag:** Prüfungen, die `handover_set`, `handover_zurueck`, `absence_tick` und den Asana-Lebenszyklus
  gegen die echte Datenbank fahren, mit Testdaten, die restlos verschwinden, oder in einer Transaktion,
  die zurückgerollt wird.
- **Zuständig:** frei.
- **Stand:** offen. Voraussetzung für jede belastbare Abnahme von V24.
