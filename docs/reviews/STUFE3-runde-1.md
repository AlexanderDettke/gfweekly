Geprüft: Stufe 3, Commit 5f2f609c4177777f02a778a4bcf2a1a645c9d4b5, 46 Dateien

1. [schwer] Modus `aus` kann Vorschläge und Kandidaten schreiben  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:194`  
Was passiert: Die Sperre für `aus` greift nur ohne `mails` in der Nutzlast. Mit übergebenen Mails läuft der Schreibpfad für Vorschläge, Kandidaten, Ticker und Laufzeit weiter.  
Warum falsch: Abschnitt 2.2 des Pakets und der Prüfauftrag verlangen, dass `aus` nichts schreibt.  
Vorschlag: `aus` vor jeder Verarbeitung beenden. Ein ausdrücklich angeforderter Probelauf darf nur mit dem effektiven Modus `probe` fortfahren.

2. [schwer] Beliebige Postfächer können per API abgefragt werden  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:197`  
Was passiert: `lauf_tick` und `lauf_gmail_probe` übernehmen ein frei übergebenes `postfach`. Das Dienstkonto verwendet es ungeprüft als JWT Subjekt.  
Warum falsch: Abschnitt 2.4 begrenzt den Zugriff im Code auf Alex und Lea. Nach Einrichtung der Domänendelegation reicht hier das Kompass Passwort für die Abfrage eines anderen Postfachs.  
Vorschlag: Das Postfach serverseitig gegen eine feste Liste der beiden erlaubten Adressen prüfen.

3. [schwer] Live verarbeitet frei erfundene Mailinhalte  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:201`  
Was passiert: `mails:[…]` wird auch im Modus `live` als Quelle akzeptiert. Ein Aufruf mit dem Kompass Passwort kann so einen nicht aus Gmail stammenden Abschluss als Mail protokollieren und einen Punkt erledigen lassen.  
Warum falsch: Die Nutzlast ist im Paket für Fixtures und Rückblick vorgesehen. Ein Live Beleg braucht eine nachvollziehbare Quelle.  
Vorschlag: Übergebene Mails auf `probe` begrenzen und Live Quellen serverseitig abrufen.

4. [schwer] Ein Probelauf sperrt dieselben Mails für Live  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:228`  
Was passiert: Die Dublettenprüfung berücksichtigt den Modus nicht. Eine echte Mail, die über den Knopf „Probelauf ausführen“ protokolliert wurde, wird nach dem Wechsel auf `live` übersprungen.  
Warum falsch: Der vorgesehene Probelauf kann dadurch spätere Erledigungen und Vorschläge verhindern.  
Vorschlag: Probeprotokolle von der Live Idempotenz trennen und den Übergang ausdrücklich testen.

5. [schwer] Volle Batches verlieren ungelesene Threads  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:219`  
Was passiert: Nach höchstens `batch` Threads wird der Cursor auf das Ende des Suchfensters gesetzt. Weitere Treffer im selben Fenster liegen beim nächsten Tick vor der neuen Zeitgrenze.  
Warum falsch: Abschnitt 2.2 verlangt, dass der Rest im nächsten Tick bearbeitet wird.  
Vorschlag: Gmail Seiten fortsetzen oder den Cursor erst hinter den nachweislich vollständig verarbeiteten Bereich verschieben.

6. [schwer] Kandidaten erzeugen entgegen dem Paket neue Entscheidungen  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:262`  
Was passiert: Neue Kandidaten erhalten `gate: 'gf'`. Die bestehende Funktion `hh_entscheidungen_sammeln` übernimmt genau solche Kandidaten in die offene Entscheidungsliste, auch ohne Punkt.  
Warum falsch: Abschnitt 1 und 2.2 untersagen neue Entscheidungen ohne Punkt; zugleich soll die Liste unter 15 Einträge kommen.  
Vorschlag: Kandidaten zunächst ausschließlich im Korb zur Zuordnung anbieten und die Entscheidung erst nach einer bewussten Zuordnung erzeugen.

7. [schwer] Erledigung und Beleg sind nicht atomar  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:253`  
Was passiert: `hh_punkt_toggle` schließt den Punkt ab. Der anschließende Belegeintrag ist ein zweiter Datenbankaufruf; dessen Fehler wird nicht geprüft. Der Punkt kann erledigt bleiben, während der Beleg fehlt und das Protokoll `ausgefuehrt: true` meldet.  
Warum falsch: Abschnitt 2.2 verlangt den belegten Schreibweg; `STUFE2-LAEUFE.md` beschreibt ihn als eine Transaktion.  
Vorschlag: Abschluss und Beleg in einer Datenbankfunktion atomar schreiben. Fehler aller Upserts prüfen und erst danach Erfolg protokollieren.

8. [schwer] Vertrauliche Angaben können in die Datenbank gelangen  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:184`  
Was passiert: Der Filter erkennt nur eine begrenzte Wortliste. Eine Bewertung wie „Person X ist ungeeignet“ passiert ihn; bei Kandidaten wird zudem der Mailbetreff ungefiltert als `source_title` gespeichert.  
Warum falsch: Abschnitt 2.2 und `ABGLEICH-VORHABEN.md` verbieten persönliche Bewertungen und private Angaben. Die Prompt Anweisung ist dafür keine harte Codesperre.  
Vorschlag: Speicherung auf geprüfte, sachliche Felder begrenzen und Betreff sowie Modellantwort vor dem Schreiben nach denselben Regeln behandeln.

9. [mittel] Der Vier Wochen Rückblick kann erledigte Punkte nicht zuverlässig erkennen  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:137`  
Was passiert: Der Einordnungskontext enthält nur heute offene Punkte. Punkte, die im Rückblickzeitraum von Hand erledigt wurden, fehlen damit gerade in der Vergleichsliste. Einwürfe, Plattform Feeds und Verlauf werden ebenfalls nicht als Rückblickquellen verarbeitet.  
Warum falsch: Abschnitt 3 verlangt die Simulation gegen diese Quellen und die tatsächlich erledigten Punkte. Die derzeitige Auswertung kann die zugesagte Trefferquote nicht belegen.  
Vorschlag: Den damaligen Punktestand und alle vereinbarten Quellen rekonstruieren; bis dahin die Stichprobe ausdrücklich nur als Stichprobe ausweisen.

10. [mittel] Selbstabschaltung wartet keine zwei Wochen ab  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:293`  
Was passiert: Fünf Erledigungen und drei Rücknahmen am selben Tag genügen für die Abschaltung. Der Code prüft eine gleitende Summe über 14 Tage, nicht zwei Wochen mit jeweils zu geringer Quote.  
Warum falsch: Abschnitt 5 fordert eine wöchentliche Prüfung bei einem über zwei Wochen anhaltenden Befund.  
Vorschlag: Zwei abgeschlossene Wochen getrennt bewerten und die Mindestzahl der Fälle je Bewertung festlegen.

11. [mittel] Ruhende Entscheidungen bleiben als überfällig sichtbar  
Fundstelle: `site/entscheidungen.html:167`  
Was passiert: Ruhende Fokus Einträge stehen weiterhin zuerst. Ihre Fristmarke und die Überfällig Zählung verwenden unverändert den alten Fristzustand.  
Warum falsch: Abschnitt 5 verlangt, dass ruhende Punkte in der Entscheidungsliste nicht mehr als überfällig erscheinen.  
Vorschlag: `ruht` vor Fokus, Fristmarke und Zählern berücksichtigen.

12. [mittel] Der Zeitplan folgt im Sommer nicht der Berliner Uhrzeit  
Fundstelle: `supabase/migrations/20261026120000_stufe3_lauf.sql:161`  
Was passiert: Der feste UTC Plan `7 5-21/2 * * *` läuft während der Sommerzeit um 07:07 bis 23:07 Uhr in Berlin.  
Warum falsch: Abschnitt 2.1 verlangt 06:00 bis 22:00 Uhr Berliner Zeit.  
Vorschlag: Einen Zeitplan mit Berliner Zeitzone oder getrennte saisonale UTC Pläne verwenden.

13. [mittel] Die Seiten wurden nur in der Navigation zusammengefasst  
Fundstelle: `site/assets/core.js:279`  
Was passiert: Die Reiter öffnen weiterhin eigenständige Seiten. Alte Seiten leiten nicht auf `vertretung.html` oder `saison.html` weiter; Personen und Links liegen nicht als Klappen in `einstellungen.html`. Der Technikstand dokumentiert diese Abweichung, setzt sie aber mit einer Seite gleich.  
Warum falsch: Abschnitt 4 verlangt zusammengeführte Ansichten und Weiterleitungen. Die Änderung reduziert Menüeinträge, nicht die Seiten und ihre Ladewege.  
Vorschlag: Die vereinbarten Ansichten tatsächlich zusammenführen und alte Adressen mit erhaltener Kennung weiterleiten.

14. [mittel] Die Wirkungsprobe hinterlässt Testartefakte  
Fundstelle: `pruefung/stufe3-probe.mjs:52`  
Was passiert: Die erzeugte Abschaltungszeile enthält kein `(Test)` im Beleg und wird deshalb nicht gelöscht. Der Abschaltungsticker passt ebenfalls auf keines der Löschmuster. Die abschließende Zählung erfasst beide nicht.  
Warum falsch: Abschnitt 6.2 verlangt Aufräumen; die Probe meldet trotzdem „Aufgeräumt“.  
Vorschlag: Alle im Test erzeugten Kennungen gezielt entfernen und ihren tatsächlichen Restbestand prüfen.

15. [mittel] Die Ampel für tägliche Sichtungen misst einen Durchschnitt  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:372`  
Was passiert: Kriterium d verwendet den Durchschnitt der Tage mit Sichtungen und gruppiert nach UTC Datum. Ein Tag über dem Grenzwert kann dadurch grün erscheinen; ein Berliner Tag kann auf zwei Gruppen fallen.  
Warum falsch: Abschnitt 1 setzt eine Obergrenze von fünf je Berliner Tag.  
Vorschlag: Tageswerte in `Europe/Berlin` bilden und die höchste Tageszahl beziehungsweise jeden Verstoß anzeigen.

16. [mittel] Modus `probe` schreibt außerhalb des Protokolls  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:280`  
Was passiert: Ist der gespeicherte Modus `probe`, aber `t.probe` nicht gesetzt, werden `letzter_lauf_at` und ein Ticker geschrieben.  
Warum falsch: Abschnitt 2.2 erlaubt in `probe` ausschließlich Protokolleinträge.  
Vorschlag: Alle Schreibpfade am effektiven Modus ausrichten, nicht teils am Eingabefeld `t.probe`.

## Empfehlungen

1. Vor einem Live Wechsel zuerst Modusgrenzen, Postfachliste, Herkunft der Mails und atomaren Abschluss korrigieren.
2. Idempotenz und Cursor mit mehr Treffern als `batch` sowie dem Ablauf Probe → Live gezielt prüfen.
3. Den Rückblick erst nach Einbindung der zugesagten Quellen und eines historischen Vergleichs als Nachweis für die Kriterien verwenden.
4. Die Wirkungsprobe um negative Rechtefälle und eine vollständige Kontrolle der Testartefakte ergänzen.

Die Prüfung war ausschließlich statisch am angegebenen Diff. Backendzustand, Deploy, Bildschirmansichten und die übergebenen Live Testergebnisse habe ich wegen des untersagten Netzzugriffs nicht selbst verifiziert.

