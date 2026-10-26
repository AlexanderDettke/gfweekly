Geprüft: Stufe 3, Commit 3a8117f879e80f62c3fdcbc8d9f2e423aeabd21d, 50 Dateien

1. [schwer] Volle Gmail Stapel lassen ältere Threads dauerhaft liegen  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:134`  
Was passiert: Gmail liefert höchstens `batch` neueste Threads. Ist der Stapel voll, bleibt der Cursor stehen. Der nächste Tick liest wieder dieselben ersten Threads und überspringt sie anhand des Protokolls. Ältere Treffer und gegebenenfalls Plattformquellen kommen nicht an die Reihe.  
Warum falsch: Paket Abschnitt 2.2 verlangt, dass der Rest im nächsten Tick bearbeitet wird. Befund 5 aus Runde 1 ist damit nicht behoben.  
Vorschlag: Gmail Seiten fortsetzen und den Cursor erst nach vollständig verarbeiteter Seite vorziehen.

2. [schwer] Ein Punkt kann ohne gespeicherten Beleg erledigt werden  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:280`  
Was passiert: Bei leerem oder herausgefiltertem Modellbeleg setzt der Code einen Platzhalter. Eine hohe modellgemeldete Sicherheit und `abschluss_belegt: true` reichen trotzdem für `hh_lauf_erledigt`. Der Belegeintrag enthält dann nur „Beleg in der Quelle“.  
Warum falsch: Paket Abschnitt 2.2 verlangt einen belegten Abschluss und einen Belegsatz in der Akte.  
Vorschlag: Automatisches Erledigen nur mit einem zulässigen, konkreten Belegsatz erlauben. Sonst einen Vorschlag protokollieren.

3. [schwer] Der Vertraulichkeitsfilter lässt persönliche Bewertungen durch  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:46`  
Was passiert: Die Wortliste erkennt etwa „Person X ist untragbar“ nicht. Solche Modellantworten können als Beleg, Kandidat oder Vorschlag gespeichert werden. Auch im Modus `probe` landet der Beleg im Protokoll.  
Warum falsch: `docs/ABGLEICH-VORHABEN.md`, Vertraulichkeitsregel, schließt Bewertungen von Menschen aus. Befund 8 aus Runde 1 bleibt trotz erweiterter Wortliste offen.  
Vorschlag: Unsichere Aussagen nicht in freie Datenbanktexte übernehmen. Den Fall ohne inhaltlichen Beleg zur manuellen Sichtung kennzeichnen.

4. [schwer] Übergebene Einwurf Mails umgehen die Testsperre  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:268`  
Was passiert: Im Modus `live` oder `vorschlag` schreibt der Einwurfpfad `mails:[…]` über `einwurfAnlegen` in `hh_einwurf`. Die spätere Beschränkung übergebener Mails auf Vorhaben mit „(Test)“ greift hier nicht. So lässt sich ein erfundener Einwurf als Alex oder Lea anlegen.  
Warum falsch: Die Nutzlast ist laut Paket für Fixtures und Rückblick vorgesehen; die Antwort auf Befund 3 verspricht eine Sperre für Produktionsakten.  
Vorschlag: Übergebene Einwurf Mails außerhalb von `probe` ebenso sperren oder ausschließlich aus serverseitig abgerufenen Gmail Quellen anlegen.

5. [mittel] Unklare Quellen können Kandidaten erzeugen  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:32`  
Was passiert: `laufAktion` gibt bei `stufe === 'unklar'` einen Kandidaten zurück, sofern das Modell einen Kandidaten und ein bekanntes Vorhaben nennt.  
Warum falsch: `docs/auftraege/STUFE2-LAEUFE.md`, Abschnitt „Täglich“, bestimmt für `unklar`: nichts schreiben.  
Vorschlag: Bei `unklar` stets `nichts` zurückgeben; Kandidaten erst ab einer festgelegten Mindeststufe zulassen.

6. [mittel] Die Trefferampel bewertet unbeanstandete Einträge als Misserfolg  
Fundstelle: `supabase/functions/gfweekly/entscheidungen.ts:278`  
Was passiert: Die Trefferquote zählt nur ausdrücklich übernommene Vorschläge und Kandidaten. Unbeanstandete Einträge stehen im Nenner, aber nie im Zähler.  
Warum falsch: Paket Abschnitt 1 zählt „übernommen oder bleibt unbeanstandet“. Die Ampel kann deshalb rot zeigen, obwohl das vereinbarte Kriterium erfüllt ist.  
Vorschlag: „Unbeanstandet“ mit einem klaren Beobachtungszeitraum definieren und in der Kennzahl berücksichtigen.

7. [mittel] Rücknahmen werden der falschen Erledigungswoche zugerechnet  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:338`  
Was passiert: Die Selbstabschaltung zählt Erledigungen und Rücknahmen getrennt nach ihrem jeweiligen Ereignisdatum. Eine Rücknahme eines älteren Punkts senkt so die Quote neuer Erledigungen derselben Woche.  
Warum falsch: Kriterium b fragt, wie viele der vom Lauf erledigten Punkte erledigt bleiben. Die Wochenrechnung kann den Lauf wegen anderer, älterer Punkte zurückstellen.  
Vorschlag: Jede Rücknahme ihrer ursprünglichen Lauf Erledigung zuordnen und zwei getrennte Erledigungskohorten auswerten.

8. [mittel] Der Vier Wochen Rückblick ist fachlich noch nicht belastbar  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:163`  
Was passiert: Der Rückblick lädt Vorhaben mit heutigem Status `aktiv` oder `pausiert`. Im Zeitraum erledigte Punkte eines inzwischen abgeschlossenen Vorhabens fehlen. Der Technikstand dokumentiert zudem nur vier echte Threads statt des vereinbarten Zeitraums vom 28.09. bis 26.10.2026.  
Warum falsch: Paket Abschnitt 3 verlangt den Abgleich mit den damals vorhandenen Punkten und Quellen vor dem Live Gang. Die dokumentierte Stichprobe belegt die Kriterien a, b und d nicht.  
Vorschlag: Den historischen Bestand einschließlich inzwischen abgeschlossener Vorhaben rekonstruieren und die vollständige Simulation als offene Voraussetzung ausweisen.

9. [mittel] Die vereinbarten Seiten sind weiterhin getrennt  
Fundstelle: `site/assets/core.js:279`  
Was passiert: Die Reiter verlinken auf `uebergabe.html`, `rueckkehr.html`, `jahr.html`, `bearbeiten.html` und `seiten.html`. Die alten Seiten leiten nicht weiter; Personen und Links sind keine Klappen in `einstellungen.html`.  
Warum falsch: Paket Abschnitt 4 verlangt zusammengeführte Ansichten und Weiterleitungen. Der Technikstand begründet die Abweichung, die Begründung erfüllt den festgelegten Umfang jedoch nicht. Befund 13 aus Runde 1 bleibt offen.  
Vorschlag: Die Inhalte in den vereinbarten Seiten zusammenführen und die alten Adressen mit erhaltener Kennung weiterleiten.

10. [mittel] Der Zeitplan weicht an Umstellungstagen von Berliner Zeiten ab  
Fundstelle: `supabase/migrations/20261026130000_stufe3_runde1.sql:54`  
Was passiert: Die Sommerregel gilt für den ganzen Oktober, die Winterregel erst ab November. Nach der Zeitumstellung im Oktober läuft der Tick damit von 05:07 bis 21:07 Uhr Berliner Zeit. Im März tritt die umgekehrte Verschiebung auf.  
Warum falsch: Paket Abschnitt 2.1 verlangt 06:00 bis 22:00 Uhr Berliner Zeit. Die Abweichung ist dokumentiert, aber weiterhin vorhanden.  
Vorschlag: Den Zeitplan an den tatsächlichen Wechsel der Zeitzone binden oder die Übergangstage gesondert planen.

## Empfehlungen

1. Vor einem Live Wechsel die Befunde 1 bis 4 und 5 beheben und mit mehr als `batch` Gmail Treffern, leerem Beleg und einer übergebenen Einwurf Mail gezielt prüfen.
2. Die Wirkungsprobe um diese negativen Fälle und die vollständige Rückleseprüfung ihrer Testdaten ergänzen.
3. Die Kriterien erst nach einer vollständigen historischen Simulation als erreicht ausweisen.

Dies war eine ausschließlich lokale, statische Prüfung. Backend, Deploy, Bildschirmansichten und die gemeldeten Testergebnisse habe ich wegen des untersagten Netzzugriffs nicht selbst verifiziert.

