Geprüft: Stufe 2, Commit d06a7073ef8051d157a6dc0350585b2facf0ff6b, 57 Dateien

1. [schwer] „Erledigt“ bleibt bei einem Teilfehler inkonsistent  
Fundstelle: site/uebergabe.html:204  
Was passiert: Der Knopf schließt zuerst das Vorhaben samt offenen Punkten und setzt danach in einem zweiten Aufruf die Korbzeile auf `erledigt`. Scheitert der zweite Aufruf, bleibt die Zeile offen. `handover_list` blendet sie wegen des geschlossenen Vorhabens aus.  
Warum falsch: Abschnitt 5 verlangt eine wirksame Erledigung der Zeile. Die Korrektur aus Runde 2 behebt den damaligen 409, aber nicht diesen Fehlerfall. Die neue Wirkungsprobe prüft nur zwei erfolgreiche Aufrufe.  
Vorschlag: Vorhaben und Korbzeile in einer Datenbanktransaktion schließen und beide Zustände zurücklesen.

2. [schwer] Für dich zeigt Laufdaten weiterhin als Fristen  
Fundstelle: site/index.html:216  
Was passiert: „Nächste Fristen“ übernimmt `gate_frist` von Themen und Kandidaten ungeprüft als Frist mit Warnzustand. Ein vom Lauf vorgeschlagenes Datum erreicht damit weiterhin die Startseite, obwohl es in der Entscheidungsliste nur `frist_vorschlag` ist.  
Warum falsch: Abschnitt 2 und das Schwerekriterium des Prüfauftrags untersagen eine Frist ohne Person oder Punkt.  
Vorschlag: Für Entscheidungen ausschließlich `hh_entscheidungen.frist` verwenden oder die menschliche Fristquelle vor der Anzeige nachweisen.

3. [mittel] Alte Korbzeilen finden einen vorhandenen Nachfolger nicht  
Fundstelle: supabase/migrations/20261026010000_stufe2_runde2.sql:102  
Was passiert: Bei einer bestätigten Themenzeile sucht `hh_absence_end_s2` nur `gfweekly_topics.vorhaben_id`. Hatte das alte Thema dort keinen Bezug, erhielt bei der Auflösung aber einen Punkt mit `quelle = 'thema:<id>'`, landet die Korbzeile lediglich in einem Sammelprotokoll. Der Verlauf am Nachfolger fehlt. Dieses Protokoll wird zudem auf 1800 Zeichen gekürzt.  
Warum falsch: Abschnitte 1 und 5 verlangen, liegen gebliebene Arbeit am jeweiligen Vorhaben fortzuführen. Runde 2 behebt das nur für Quellen mit eingetragenem `vorhaben_id`.  
Vorschlag: Den Nachfolger auch über die Punktquelle ermitteln und je Zeile einen eindeutigen Verlaufseintrag schreiben. Fälle ohne Nachfolger einzeln und ungekürzt protokollieren.

4. [mittel] Rückgängig erkennt die aktuelle Lauf Erledigung nur über ein Zeitfenster  
Fundstelle: supabase/migrations/20261026010000_stufe2_runde2.sql:66  
Was passiert: Ein älterer bestätigter Laufeintrag gilt als Beleg der aktuellen Erledigung, wenn er höchstens zwei Minuten von `erledigt_at` entfernt liegt. Wird ein Punkt von Hand wieder geöffnet und kurz danach erneut vom Lauf erledigt, kann der alte Eintrag die neue Erledigung zurücknehmen. Die Aktualisierung in Zeile 69 verwirft dann auch andere Einträge aus demselben Zeitfenster.  
Warum falsch: Abschnitt 6 verspricht Rückgängig für die konkrete belegte Lauf Erledigung. Die Korrektur aus Runde 2 speichert weiterhin keine eindeutige Verbindung.  
Vorschlag: Die Kennung des Abschlussereignisses am Punkt festhalten und Rückgängig sowie Belegstatus gegen genau diese Kennung prüfen.

5. [mittel] Rückkehr kann erledigte Arbeit zugleich als offen zeigen  
Fundstelle: supabase/functions/gfweekly/entscheidungen.ts:314  
Was passiert: `rueckkehr_lage` liest offene Entscheidungen ohne Quellenabgleich. Nach einer Lauf Erledigung und vor dem nächsten `entscheidungen_list` bleibt die zugehörige Entscheidung offen gespeichert. Die Rückkehr zeigt den erledigten Punkt unter „Entschieden“ und dieselbe Frage unter „Wartet auf dich“.  
Warum falsch: Das Lagebild aus Abschnitt 5 soll den aktuellen Arbeitsstand verlässlich zeigen.  
Vorschlag: Vor dem Aufbau die Eignung offener Quellen prüfen oder den bestehenden Abgleich ausführen und nur tatsächlich offene Entscheidungen anzeigen.

6. [mittel] „Nach Menschen“ lässt erledigte und entschiedene Einträge aus  
Fundstelle: supabase/functions/gfweekly/entscheidungen.ts:325  
Was passiert: Die Personensicht gruppiert ausschließlich offene Punkte sowie offene, vertagte und abgegebene Entscheidungen. Die im Phasenblock gezeigten erledigten Punkte und Beschlüsse fehlen dort vollständig.  
Warum falsch: Abschnitt 5 verlangt dieselben Punkte und Entscheidungen nach Menschen, damit Lea die Arbeit und ihre Verteilung besprechen kann. Die Ergänzung aus Runde 2 macht die offenen Einträge bedienbar, aber die Sicht bleibt inhaltlich unvollständig.  
Vorschlag: Die bereits aufgebauten entschiedenen Einträge ebenfalls nach `wer` gruppieren und ihren Status kenntlich machen.

7. [mittel] Die Laufbilanz misst nicht die bezeichnete Trefferquote  
Fundstelle: supabase/functions/gfweekly/entscheidungen.ts:248  
Was passiert: Der Verlauf zählt nur die Urheber `lauf`, `Abgleich` und `Lauf`; die in der Antwort auf Runde 2 ausdrücklich als Laufvorschläge behandelten anderen Urheber fehlen. Ein Vorschlag verschwindet rückwirkend aus der Zahl `verlauf_vorschlag`, sobald sein Status wechselt. Die angezeigte `trefferquote` in Zeile 268 ist lediglich der Anteil aktuell übernommener Kandidaten an allen Kandidaten des Zeitfensters. Punkte und Vorschläge des Laufs gehen nicht in diesen Wert ein.  
Warum falsch: Abschnitt 0 und 6 verlangen eine nach Wochen nachvollziehbare Bilanz und die Trefferquote der neu angelegten Punkte und Vorschläge. Damit lässt sich das Abbruchkriterium nicht beurteilen.  
Vorschlag: Laufherkunft und Statusereignisse dauerhaft erfassen und die Kennzahlen aus diesen Ereignissen berechnen. Eine Probe sollte Erzeugung, Übernahme, Verfall und Rücknahme über zwei Wochen enthalten.

8. [mittel] Die Berliner Tagesgrenze ist am Tag der Zeitumstellung falsch  
Fundstelle: supabase/functions/gfweekly/entscheidungen.ts:276  
Was passiert: `berlinVersatz` ermittelt den Versatz mittags und verwendet ihn auch für 00:00 Uhr. Am 25.10.2026 gilt um Mitternacht noch `+02:00`, mittags bereits `+01:00`. Beginnt eine Abwesenheit an diesem Tag, fehlt die erste lokale Stunde im Lagebild. Eine lokale Prüfung mit `Intl.DateTimeFormat` bestätigt die beiden Versätze.  
Warum falsch: Abschnitt 5 verlangt den vollständigen Abwesenheitszeitraum. Die Korrektur aus Runde 1 behandelt den Wechsel nur für das Tagesende richtig.  
Vorschlag: Anfang und Ende jeweils aus der tatsächlichen lokalen Tagesgrenze berechnen und beide Umstellungstage prüfen.

9. [mittel] Die Sammelaktion lässt den Konfliktnachweis weg  
Fundstelle: supabase/migrations/20261026000000_stufe2_runde1.sql:137  
Was passiert: Die Prüfung auf `expect_updated_at` greift nur, wenn ein nicht leerer Wert geliefert wird. Die Edge Function setzt bei fehlendem Wert ausdrücklich `null`. So kann ein Aufruf eine inzwischen bearbeitete Entscheidung ohne den geforderten Vergleich vertagen, abgeben oder hinfällig setzen. Die Oberfläche sendet den Wert im Normalfall; die Schnittstelle erzwingt ihn nicht.  
Warum falsch: Abschnitt 3 und der Prüfauftrag verlangen einen Konflikt je Zeile anhand des gesehenen Stands.  
Vorschlag: Einen fehlenden oder leeren Vergleichszeitpunkt je Zeile als Konflikt behandeln und die negativen Fälle prüfen.

10. [mittel] Das Ende des alten Themen Zeitplans ist nicht nachvollziehbar umgesetzt  
Fundstelle: supabase/migrations/20261025230000_stufe2_lauf.sql:59  
Was passiert: Stufe 2 richtet den neuen Verfall ein. Im gesamten Stufe 2 Diff steht kein `cron.unschedule` für `hh_themen_erledigt_archivieren`; der Technikstand beschreibt den alten täglichen Zeitplan weiterhin. Ob er live anderweitig beendet wurde, kann ich ohne Netzzugriff nicht feststellen.  
Warum falsch: Abschnitt 10 verlangt ausdrücklich, diesen Zeitplan nach der Auflösung zu beenden.  
Vorschlag: Den Abschluss in einer Migration festhalten und den Zustand des Cron Auftrags zurücklesen.

## Empfehlungen

1. Die beiden schweren Befunde vor einem Push beheben. Solange einer davon offen bleibt, greift der Stoppgrund aus Abschnitt 8.5.
2. Die Übergabeprobe um einen Fehler beim zweiten Schreibschritt ergänzen. Die bisherige Probe belegt nur den Erfolgsweg.
3. Für die Rückkehr einen bereits erledigten Punkt mit noch offener Entscheidung sowie ein altes Thema mit Nachfolgerpunkt prüfen.
4. Die Kennzahlen und den Rückweg des Laufs mit zwei zeitlich getrennten Abschlussereignissen am selben Punkt prüfen.

Die behauptete Auflösung der Produktionszeilen, Migrationen, der Live Stand und die Backendwirkung wurden wegen des untersagten Netz und Datenbankzugriffs nicht unabhängig geprüft. Ich habe keine Dateien geändert und keine schreibenden Tests ausgeführt. Der im Repository liegende Abnahmebeleg nennt noch Commit `30636f2`; das angekündigte vollständige Ergebnis für diesen Commit lag beim Review nicht vor.

