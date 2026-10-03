Geprüft: 31e, Commit a59d534, 3 Dateien im Commit; zusätzlich die betroffenen Schnittstellen aus 31a und den Abgleichtext.

1. [mittel] Übernommener Standvorschlag ändert keinen Punkt  
Fundstelle: `supabase/migrations/20261003173522_hh_vorhaben_v31a_runde2.sql:45`  
Was passiert: `hh_verlauf_status` setzt einen Vorschlag mit dem Tag `Vorschlag: Stand: …` auf bestätigt. Nur bei `Vorschlag: Punkt erledigt` ändert die Funktion einen Punkt. Die Oberfläche meldet in beiden Fällen „Übernommen“.  
Warum falsch: `docs/ABGLEICH-VORHABEN.md:34` sieht beide Vorschlagsarten vor. Bei einem Standvorschlag bestätigt das Haus eine Änderung, die in der Akte nicht stattfindet.  
Vorschlag: Den Zielpunkt und den vorgeschlagenen neuen Stand strukturiert speichern und beim Übernehmen in derselben Transaktion mit Prüfung des inzwischen aktuellen Stands anwenden. Bis dahin Standvorschläge als Hinweis mit einer eindeutig anderen Aktion anzeigen.

2. [mittel] Einwurfmail kann doppelt in der Akte landen  
Fundstelle: `docs/ABGLEICH-VORHABEN.md:30`  
Was passiert: Quelle C liest eingegangene Mails, ohne die Adressen `alex+einwurf@wildemoehre.org` und `lea+einwurf@wildemoehre.org` auszunehmen. Quelle D verarbeitet dieselben Mails zusätzlich als Einwurf. Unterschiedliche `source_ref` verhindern diese Doppelung nicht.  
Warum falsch: Abschnitt 31e soll den Abgleich mit der Einwurf Warteschlange zusammenführen. Hier kann bereits ein bestätigter Mailverlauf entstehen, bevor Alex oder Lea den Einwurf geprüft haben.  
Vorschlag: Einwurfadressen ausdrücklich aus Quelle C ausschließen. Dasselbe in Leas abgeleitetem Auftrag festhalten.

3. [mittel] Quellenstand kann bei gleichzeitigen Läufen verloren gehen  
Fundstelle: `docs/ABGLEICH-VORHABEN.md:37`  
Was passiert: Alex und Lea sollen das bestehende JSON Array lesen, einen Eintrag ersetzen und das ganze Feld `quellen` zurückschreiben. Lesen beide denselben Ausgangsstand, überschreibt der spätere Lauf den Eintrag des früheren.  
Warum falsch: Abschnitt 31e sieht zwei unabhängig laufende Abgleiche vor. Die Akte kann danach einen tatsächlich erfolgten Abgleich nicht mehr anzeigen.  
Vorschlag: Den Eintrag je Quelle in einer Datenbankfunktion unter Zeilensperre aktualisieren oder je Quelle eine eigene Zeile mit eindeutigem Schlüssel verwenden.

4. [mittel] Ein erfolgreicher Abgleichlauf ist noch nicht belegt  
Fundstelle: `docs/TECHNIKSTAND.md:698`  
Was passiert: Die dokumentierte Prüfung fand null Einträge mit `source_ref` `abgleich:` und keine Quellenmarken. Das ist ehrlich dokumentiert, erfüllt aber die in `docs/PAKET-V31-VORHABEN.md:128` verlangte Prüfung eines Laufs mit Wirkung nicht.  
Warum falsch: Ob der eingerichtete Auftrag tatsächlich schreibt, bleibt für 31e offen. Die einmalige SQL Probe eines Mailvorschlags aus 31a belegt keinen geplanten Cowork Lauf.  
Vorschlag: Nach einem tatsächlichen Lauf dessen Kennung, neue `source_ref`, betroffene Akte und unveränderte geschützte Felder prüfen und dokumentieren. Falls der Lauf nicht stattfand, die Abnahme von 31e ausdrücklich offen lassen.

5. [mittel] Die Berichtsadresse allein sichert die Erfassung nicht  
Fundstelle: `docs/XCEED-SCHNITTSTELLE.md:27`  
Was passiert: Das Dokument sagt, Mails von XCeed würden vom Abgleich ohnehin gelesen. Quelle C in `docs/ABGLEICH-VORHABEN.md:30` schließt jedoch von Gmail als Werbung oder Social kategorisierte Mails aus. Ein Bericht an `alex+xceed@wildemoehre.org` kann damit außerhalb der Abfrage liegen.  
Warum falsch: Abschnitt 31e verlangt eine Adresse, über die Berichte den Abgleich erreichen. Die vorgeschlagene Adresse ist plausibel, die behauptete zuverlässige Erfassung folgt aus der dokumentierten Suche nicht.  
Vorschlag: Für diese Adresse eine eigene Gmail Suche im Abgleich festlegen und Berichte anhand Absender, Betreff und Inhalt prüfen. Die Aussage „ohnehin“ bis zu einer Wirkungsprüfung streichen.

6. [mittel] Arbeitsdokumentation beschreibt weiterhin V24 als aktuellen Stand  
Fundstelle: `ARBEITSSTAND.md:1`  
Was passiert: Arbeitsstand und README beginnen mit dem Stand vom 22.09.2026; der Arbeitsstand nennt Edge Function v32. `FRAGEN_FUER_MORGEN.md:1` enthält den offenen Abgleich aus 31e nicht, obwohl `docs/TECHNIKSTAND.md:698` dorthin verweist.  
Warum falsch: `docs/PAKET-V31-VORHABEN.md:142` verlangt einen zum Code passenden README und Arbeitsstand. Die Verweisung auf die Fragen führt nicht zum genannten offenen Punkt.  
Vorschlag: V31 Stand, belegte Prüfungen und den offenen Abgleich in den drei Dateien aktualisieren. Ältere Hinweise mit ihrem Datum als Historie kennzeichnen.

## Empfehlungen

1. Für den Cowork Abgleich eine kleine, wiederholbare Wirkungsprobe mit genau einer Testquelle vorsehen. Sie sollte Doppelaufruf, Vorschlag und Quellenmarke prüfen und alle Testdaten entfernen.
2. Vorschläge in der Akte mit der konkreten Wirkung beschriften, etwa „Punkt abhaken“ oder „Stand ändern“. So ist vor dem Bestätigen erkennbar, was geschieht.
3. Die XCeed Aussagen zu API Endpunkten, Webhooks und Exporten als dokumentierte Recherche kennzeichnen. Ohne Netzzugang konnte ich weder die verlinkten Quellen noch die Verfügbarkeit der Schnittstelle am 03.10.2026 prüfen.
4. Den Abgleichstatus je Quelle mit Zeitpunkt und Ergebnis anzeigen, sobald ein realer Lauf belegt ist. „Noch kein Abgleich eingetragen“ sollte bis dahin nicht als Aussage über die Einrichtung des Auftrags verstanden werden.

Ich habe nur Repositorydateien und Git Metadaten gelesen. Live Datenbankwirkung, Cowork Zeitplan, XCeed Quellen, Darstellung bei 1440 und 390 Pixeln sowie Tastatur und Bildschirmleser konnte ich in dieser Umgebung nicht selbst prüfen. Es wurden keine Dateien geändert und keine weiteren Reviewer gestartet.

