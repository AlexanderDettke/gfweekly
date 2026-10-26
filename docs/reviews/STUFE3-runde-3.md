Geprüft: Stufe 3, Commit ee949747d6d37d2b8b35599fd1d47a7a17d3cf86, 53 Dateien

1. [schwer] Volle Gmail Stapel können weiterhin festhängen  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:133`  
Was passiert: Die Suche begrenzt Threads nach Zeit, verarbeitet aber stets deren jüngste Nachricht. Hat ein erneut gefundener Thread auch eine ältere Nachricht im Suchfenster, kann er beim nächsten Tick wieder im Stapel stehen. `rest_bis` wird dann aus derselben jüngsten Nachricht berechnet und rückt nicht weiter.  
Warum falsch: Der Rest muss gemäß Paket Abschnitt 2.2 im nächsten Tick erreichbar sein. Befund 1 aus Runde 2 ist für solche Threads nicht behoben.  
Vorschlag: Gmail Seiten oder Nachrichtenkennungen fortsetzen und die Zeitgrenze erst nach nachweislich vollständig verarbeiteten Treffern verschieben. Mit mehr als `batch` Threads prüfen, darunter Threads mit Nachrichten auf beiden Seiten der Grenze.

2. [schwer] Ein allgemeiner Satz genügt weiterhin als Abschlussbeleg  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:287`  
Was passiert: Die Korrektur prüft nur Länge und Wörter aus der Sperrliste. Eine Modellantwort wie „Die Angelegenheit ist nun erledigt.“ erfüllt die Längenprüfung und kann bei gemeldeter Sicherheit und `abschluss_belegt: true` einen Punkt abschließen.  
Warum falsch: Paket Abschnitt 2.2 verlangt einen belegten Abschluss und einen konkreten Satz in der Akte. Befund 2 aus Runde 2 ist damit nur teilweise behoben.  
Vorschlag: Für automatische Erledigungen einen überprüfbaren Bezug zur Quelle verlangen. Andernfalls nur einen Vorschlag anlegen.

3. [schwer] Persönliche Bewertungen können gespeichert werden  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:45`  
Was passiert: Die erweiterte Wortliste lässt Umschreibungen wie „Alex traut Pat die Leitung nicht mehr zu“ passieren. Der Text kann im Protokoll, Vorschlag oder Kandidaten landen.  
Warum falsch: `docs/ABGLEICH-VORHABEN.md` schließt Bewertungen von Menschen aus. Die Anweisung im Modellprompt ist keine Codesperre. Befund 3 aus Runde 2 bleibt offen.  
Vorschlag: Freie Modelltexte mit unsicherem Personenbezug nicht übernehmen und solche Quellen ohne inhaltlichen Beleg zur manuellen Sichtung markieren.

4. [mittel] Der Rückblick deckt die vereinbarten Quellen und den damaligen Stand nicht ab  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:147`  
Was passiert: Der Lauf liest Plattform Feeds, aber weder bestehende Einwürfe noch Verlaufseinträge als Quellen. Der Rückblickkontext enthält außerdem den heutigen Punktestand, einschließlich Punkten, die erst nach einer historischen Mail angelegt wurden. Der Technikstand belegt bislang vier Threads statt des Zeitraums 28.09. bis 26.10.2026.  
Warum falsch: Paket Abschnitt 3 verlangt die Simulation aller genannten Quellen gegen die damals vorhandenen Punkte. Die Kriterien a, b und d sind dadurch noch nicht rückblickend belegt.  
Vorschlag: Quellen und Punktestand zeitbezogen rekonstruieren und den vollständigen Rückblick vor einem Live Wechsel auswerten.

5. [mittel] Die Rückblickauswertung ordnet Sichtungen dem Prüftag zu  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:407`  
Was passiert: `sichtungen_je_tag` verwendet `created_at` der Protokollzeile. Historische Mails, die an einem Tag als Fixtures geprüft werden, erscheinen somit sämtlich an diesem Prüftag. Die Auswahl von Hand erledigter Punkte verwendet zudem fest `+01:00`, obwohl der Großteil des Rückblickzeitraums in Berliner Sommerzeit liegt.  
Warum falsch: Paket Abschnitt 3 verlangt die damalige Zahl der Sichtungen je Tag und einen korrekten Vergleich mit damaligen Erledigungen.  
Vorschlag: Quellenzeit und Berliner Zeitzone für Tageswerte und Zeitraumgrenzen verwenden.

6. [mittel] Der neue Zeitplan verfehlt im Winter den Zweistundenrhythmus  
Fundstelle: `supabase/migrations/20261026140000_stufe3_runde2.sql:51`  
Was passiert: `7 4-21/2` startet um 04, 06 bis 20 Uhr UTC. Im Winter sind das 05, 07 bis 21 Uhr Berlin; die Stundenprüfung verwirft 05 Uhr. Der Lauf startet daher um 07 Uhr und erreicht weder den vorgesehenen Start um 06 Uhr noch den Tick um 22 Uhr. Technikstand und Bedienfixture nennen zudem noch den alten Plan.  
Warum falsch: Paket Abschnitt 2.1 fordert alle zwei Stunden von 06 bis 22 Uhr Berliner Zeit. Befund 10 aus Runde 2 ist nicht behoben.  
Vorschlag: Stündlich auslösen und Berliner Stunde samt Zweistundenraster in der Funktion prüfen; Dokumentation und Fixture anpassen.

7. [mittel] Die Ampel für bleibende Erledigungen mischt Zeiträume  
Fundstelle: `supabase/functions/gfweekly/entscheidungen.ts:280`  
Was passiert: Die Bilanz zieht alle Rücknahmen der letzten vier Wochen von den Erledigungen derselben vier Wochen ab, ohne sie ihrer Erledigung zuzuordnen. Eine Rücknahme am Anfang des Fensters kann zu einer Erledigung vor dem Fenster gehören und die Quote neuer Erledigungen zu niedrig ausweisen.  
Warum falsch: Kriterium b misst, welche vom Lauf erledigten Punkte erledigt bleiben. Die Zuordnung wurde für die Selbstabschaltung korrigiert, für die Ampel aber nicht.  
Vorschlag: Auch die Bilanz nach Erledigungskohorten berechnen.

8. [mittel] Fünf schlechte Erledigungen lösen die Selbstabschaltung nicht zwingend aus  
Fundstelle: `supabase/functions/gfweekly/lauf.ts:40`  
Was passiert: Der Code verlangt mindestens drei Erledigungen in jeder der beiden Wochen. Bei fünf Fällen, verteilt auf drei und zwei, bleibt der Lauf selbst dann `live`, wenn beide Wochen unter 50 Prozent liegen.  
Warum falsch: Der Prüfauftrag nennt mindestens fünf Erledigungen über 14 Tage als Mindestbasis.  
Vorschlag: Die Mindestmenge über beide Wochen prüfen und die beiden Wochenquoten getrennt bewerten.

9. [mittel] Die vereinbarte Zusammenführung der Seiten fehlt weiterhin  
Fundstelle: `site/assets/core.js:279`  
Was passiert: Reiter öffnen weiterhin `uebergabe.html`, `rueckkehr.html`, `jahr.html`, `bearbeiten.html` und `seiten.html` als eigene Seiten. Die alten Adressen leiten nicht weiter; Personen und Links sind keine Klappen in `einstellungen.html`.  
Warum falsch: Paket Abschnitt 4 verlangt zusammengeführte Ansichten und Weiterleitungen. Die begründete Lesart im Technikstand reduziert Menüeinträge, erfüllt aber diesen festgelegten Umfang nicht.  
Vorschlag: Inhalte in die drei Zielseiten übernehmen und alte Links mit ihrer Kennung dorthin weiterleiten.

10. [mittel] Die Wirkungsprobe kann den Tagesdeckel verändert hinterlassen  
Fundstelle: `pruefung/stufe3-probe.mjs:50`  
Was passiert: Die Probe kann im Modus `live` Sichtungen über `hh_lauf_sichtung` zählen. Ihr Aufräumweg entfernt Protokolle und Testobjekte, stellt `hh_lauf_tag` jedoch nicht wieder her. Die Abschlussprüfung zählt diese Tabelle nicht.  
Warum falsch: Paket Abschnitt 6.2 verlangt Aufräumen. Ein Test kann sonst das verbleibende Sichtungskontingent des echten Tages verringern und trotzdem „Aufgeräumt“ melden.  
Vorschlag: Vorherigen Zählerstand sichern, gezielt wiederherstellen und im abschließenden Rücklesen prüfen.

## Empfehlungen

1. Vor dem Live Wechsel zuerst die Befunde 1 bis 3 sowie den Winterzeitplan beheben.
2. Die Wirkungsprobe um volle Gmail Stapel, allgemeine Belegsätze, vertrauliche Umschreibungen und den Tagesdeckel ergänzen.
3. Den vollständigen Rückblick samt historischen Tageswerten als offene Voraussetzung führen, bis er ausgeführt und ausgewertet ist.

Dies war eine lokale, ausschließlich lesende Prüfung des Diffs. Backendzustand, Deploy, Bildschirmansichten und die gemeldeten Testergebnisse wurden wegen des untersagten Netzzugriffs nicht unabhängig verifiziert. Verwendet wurden die lokalen Fassungen ORG 001 bis ORG 003 und WEBAPP PILOT 0.2; ihr Onlinezustand wurde nicht abgerufen.