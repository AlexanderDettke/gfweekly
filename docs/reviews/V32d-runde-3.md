Geprüft: 32d, Commit 301c4e68c06ecc6b201af4b5e528fa792f7740c7, 32 Dateien

1. **[schwer] Schreibweg bleibt trotz ungeklärtem Konfliktschutz aktivierbar**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:824`, zusätzlich Zeilen 718 und 987 sowie `FRAGEN_FUER_MORGEN.md:5`

   Was passiert: Eine fremde Eingabe nach der letzten Leseprüfung wird weiterhin überschrieben. Lokal reproduziert: „Christian nach letzter Prüfung“ wird durch `BN F · FLU Prüfpunkt` ersetzt. Die Antwort meldet `ok: true` ohne Konflikt. Allein das Eintragen des Dienstkontos aktiviert diesen Weg einschließlich täglichem Tick. Die daneben dokumentierte offene Risikoentscheidung wird technisch nicht berücksichtigt.

   Warum falsch: Befund 1 aus Runde 2 bleibt offen. Das fehlende Secret verhindert derzeit Liveänderungen, gewährleistet aber keinen Konfliktschutz nach Einrichtung. 32d verlangt, fremde Inhalte niemals zu überschreiben.

   Vorschlag: Schreibzugriff einschließlich F5 bis zur ausdrücklich entschiedenen Voraussetzung technisch sperren. Eine zusätzliche Leseprüfung allein behebt den Befund nicht.

2. **[mittel] Unbekanntes F5 kann einen unvollständigen Kalender als erfolgreich ausweisen**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:798`, zusätzlich Zeilen 852 und 870

   Was passiert: Ohne früheren Umstellungsnachweis wird ein unbekanntes F5 nur im Text erwähnt, ohne Konflikt. Lokal reproduziert mit `=DATE(2027,1,1)`: 71 Zellen werden geschrieben, 22 Termintage als `vor_beginn` ausgeschlossen. Ergebnis: `ok: true`, „geschrieben“, keine Konflikte.

   Warum falsch: Der freigegebene Kalender beginnt am 01.10.2026. Tatsächlich liest der Code den Beginn aus dem vorhandenen Kalender und behandelt dadurch auch erforderliche Termine ab Oktober als absichtlich ausgeschlossen.

   Vorschlag: Unbekanntes F5 als Konflikt behandeln. Den erwarteten Kalenderbeginn gesondert prüfen und nur Termine vor dem 01.10.2026 ohne Vollständigkeitsfehler ausschließen.

3. **[mittel] Verhinderte Bereinigung alter Fixtermine bleibt unsichtbar**

   Fundstelle: `supabase/functions/gfweekly/komm.ts:874`

   Was passiert: Eine fremd gewordene eigene Zelle wird nur gemeldet, wenn am alten Datum weiterhin ein Fixtermin vorgesehen ist. Lokal reproduziert: Christian ergänzt `BN Z` am 08.08.2027. Nach Verschiebung des Festivals bleibt `BN Z · Christian ergänzt` erhalten. Der Einzelabgleich meldet dennoch `ok: true`, `fremd: []` und `ausgelassen: 0`.

   Warum falsch: Das Erhalten der Ergänzung ist richtig. Die verhinderte Entfernung des sachlich veralteten Fixtermins muss jedoch gemeldet werden. Befund 6 aus Runde 2 ist für diesen Bereinigungsfall weiterhin offen.

   Vorschlag: Auch verhinderte Löschungen als Konflikt mit gewünschtem Leerzustand erfassen und den Abgleich als unvollständig kennzeichnen.

**Empfehlungen**

1. Abschnitt 17 um unbekanntes F5 und verhinderte Bereinigungen ergänzen.
2. Auch die Tokenanfrage in `googleToken` zeitlich begrenzen. Sie besitzt derzeit keine Zeitgrenze.
3. Die Einrichtung des Dienstkontos erst nach Klärung und technischer Absicherung der offenen Schreibvoraussetzung empfehlen.

**Vorherige Runden und Prüfnachweis**

Die Korrekturen für vollständige Zellhinweise, vergangene Prüfpunkte, Datumsänderungen vor dem Schreiben, Sperrverlust, F5 Reservierung und reguläre Einzelbereinigung sind nachvollziehbar umgesetzt. Die einschlägigen Aktionskorrekturen aus 32a und 32b bestehen ebenfalls, einschließlich fremder Formeln mit leerem Ergebnis und veralteter Prüfpunktentscheidungen.

1. `node pruefung/komm-test.mjs`: **70 erfolgreich, 0 Fehler**.
2. Aktionsprobe mit lokalem PGlite und gesperrtem Netzwerk: **110 erfolgreich, 0 Fehler**.
3. SQL Probe mit lokalem PGlite: **31 erfolgreich, 0 Fehler**.
4. Die drei beschriebenen Fehlerfälle wurden zusätzlich ausschließlich im Speicher reproduziert.

Alle erzeugten Schreibrequests adressieren ausschließlich Zeile 6 ab F beziehungsweise F5. Die Feldmasken enthalten keine Auswahllisten oder Formatierungen. Nach regulärer Umstellung werden die Datumswerte erneut gelesen und korrekt zugeordnet.

Tatsächliche Google Wirkung, Tabellenstruktur und Berechtigungen wurden nicht geprüft. Keine Dateien geändert, keine externen Dienste aufgerufen, keine weiteren Prüfer gestartet.

**32d ist weiterhin nicht freigabefähig.**