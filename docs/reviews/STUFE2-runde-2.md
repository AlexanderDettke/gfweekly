Geprüft: Stufe 2, Commit 30636f275f79803b846b1a32d77c8904e1c57544, 51 Dateien

1. [schwer] „Erledigt“ schließt das Vorhaben, aber nicht die Korbzeile  
Fundstelle: site/uebergabe.html:204  
Was passiert: Der Knopf schließt zuerst das Vorhaben samt offenen Punkten. Danach weist `handover_set` die Korbzeile mit 409 ab, weil der Server abgeschlossene Vorhaben ausdrücklich sperrt (`index.ts:2009`). Die beiden Änderungen laufen in getrennten Transaktionen.  
Warum falsch: Abschnitt 5.2 verlangt eine wirksame Erledigung der Zeile. Hier bleibt die Korbzeile offen, obwohl das Vorhaben bereits erledigt ist. Befund 3 aus Runde 1 ist damit nicht behoben.  
Vorschlag: Vorhaben und Korbzeile in einem Datenbankvorgang abschließen und den gespeicherten Zustand beider Quellen prüfen.

2. [schwer] Alte und unbestätigte Übergaben gehen beim Abschluss aus dem Rückkehrbild verloren  
Fundstelle: supabase/migrations/20261026000000_stufe2_runde1.sql:195  
Was passiert: `hh_absence_end_s2` setzt alle offenen Korbzeilen auf `entfallen`. Einen Verlaufseintrag schreibt es nur für bestätigte Vorhabenzeilen. Unbestätigte Zeilen und bestehende Themen oder Kandidatenzeilen erhalten keinen Nachfolger im Rückkehrbild. Zuvor liefert `handover_list` diese alten Zeilen weiterhin aus (`index.ts:1977`).  
Warum falsch: Abschnitte 1 und 5 verlangen, liegen gebliebene offene Zeilen nachvollziehbar fortzuführen. Die Antwort auf Befund 4 aus Runde 1 begründet den Ausschluss unbestätigter Vorschläge, löst aber weder deren Nachvollziehbarkeit noch die alten Zeilentypen der dokumentierten Übergabe.  
Vorschlag: Altzeilen vor dem Abschluss ihrem Vorhaben oder Nachfolger zuordnen. Ungeprüfte Vorschläge als ungeprüft kennzeichnen und den Abschluss erst nach gesicherter Übernahme ausführen.

3. [mittel] Abgeschlossene Vorhaben fehlen im Lagebild  
Fundstelle: supabase/functions/gfweekly/entscheidungen.ts:283  
Was passiert: `rueckkehr_lage` lädt nur aktive und pausierte Vorhaben. Erledigte Punkte, Beschlüsse und Verlauf aus einem während der Abwesenheit abgeschlossenen Vorhaben werden anschließend verworfen, weil dessen Kennung nicht in `V` steht.  
Warum falsch: „Entschieden“ und „Bewegt“ sollen gerade zeigen, was während der Abwesenheit geschehen ist (Abschnitt 5).  
Vorschlag: Für den Abwesenheitszeitraum auch abgeschlossene Vorhaben laden und historische Einträge unabhängig vom aktuellen Vorhabenstatus anzeigen.

4. [mittel] Rückgängig ist nicht an die konkrete Lauf Erledigung gebunden  
Fundstelle: supabase/migrations/20261025230000_stufe2_lauf.sql:25  
Was passiert: Die Funktion akzeptiert jeden jüngeren Laufeintrag mit `punkt_id`, sofern der Punkt aktuell durch `lauf` erledigt ist. Sie prüft weder den Eintragsstatus noch, ob der Eintrag die aktuelle Erledigung belegt. Bei einer erneuten Erledigung kann ein älterer Eintrag den Punkt öffnen, während die jüngeren Belege bestätigt bleiben.  
Warum falsch: Abschnitt 6 verspricht Rückgängig für genau eine belegte Lauf Erledigung.  
Vorschlag: Die Erledigung mit einer stabilen Ereigniskennung speichern und beim Rückgängig den aktuellen Punktzustand sowie die zugehörigen Belege gegen diese Kennung prüfen.

5. [mittel] Der Verfall erfasst auch fremde Vorschläge  
Fundstelle: supabase/migrations/20261025230000_stufe2_lauf.sql:50  
Was passiert: Der tägliche Auftrag setzt sämtliche Verlaufseinträge mit `status = 'vorschlag'` nach 14 Tagen auf `verfallen`, ohne `created_by = 'lauf'` zu prüfen. Das betrifft auch ältere Vorschläge des Abgleichs, die laut Abschnitt 1.3 erst nach den neuen Regeln bewertet werden sollen.  
Warum falsch: Abschnitt 6 begrenzt die Verfallsregel auf Vorschläge des Laufs.  
Vorschlag: Den automatischen Verfall auf Laufvorschläge begrenzen und die alten Vorschläge gesondert neu bewerten.

6. [mittel] Die Wochenbilanz ordnet Verfall und Verwerfen weiter der falschen Woche zu  
Fundstelle: supabase/functions/gfweekly/entscheidungen.ts:259  
Was passiert: `verfallen` und `verworfen` werden anhand von `created_at` gezählt. Ein nach 14 Tagen verfallener Vorschlag erscheint somit in seiner Erstellungswoche und fehlt als Ereignis der aktuellen Woche. Die Antwort auf Befund 10 aus Runde 1 bestätigt diese Abweichung.  
Warum falsch: Abschnitt 6 verlangt eine Bilanz der Vorgänge je Woche; so lässt sich der Ausgang neuer Laufvorschläge zeitlich nicht zuverlässig beurteilen.  
Vorschlag: Statuswechsel mit Zeitpunkt erfassen und die Wochenbilanz daraus berechnen.

7. [mittel] „Nach Menschen“ zeigt nur einen Ausschnitt ohne die vorgesehenen Aktionen  
Fundstelle: site/rueckkehr.html:109  
Was passiert: Je Person werden höchstens zwölf Einträge angezeigt. Weitere Einträge haben nur einen Summensatz. Entschiedene Einträge fehlen bereits in der Servergruppierung (`entscheidungen.ts:320`); „Abgeben“ und „Entschieden“ sind dort nicht bedienbar.  
Warum falsch: Abschnitt 5.2 verlangt dieselben Punkte und Entscheidungen nach Menschen sowie diese Aktionen für die Besprechung der Aufgabenverteilung.  
Vorschlag: Alle Einträge zugänglich machen und die Entscheidungen samt Aktionen in der Personensicht führen.

8. [mittel] Die Wirkungsprobe deckt die entscheidenden neuen Fälle nicht ab  
Fundstelle: pruefung/stufe2-probe.mjs:140  
Was passiert: Die Probe bestätigt eine Übergabezeile, betätigt aber „Erledigt“ nicht gegen das echte Backend. Sie erzeugt auch keinen Testkandidaten, obwohl Abschnitt 8.2 ausdrücklich einen verlangt. Die Oberflächenprobe verwendet abgefangene Antworten und kann den Fehler aus Befund 1 deshalb nicht erkennen.  
Warum falsch: Die dokumentierte Prüfung belegt weniger als der Prüfweg für Übergabe und Auflösung verlangt.  
Vorschlag: Den vollständigen Abschluss einer Vorhabenzeile mit anschließendem Lesen beider Zustände prüfen sowie einen Kandidaten samt Auflösung und Bereinigung einbeziehen.

## Empfehlungen

1. Die Korrektur von „Erledigt“ und den Abschluss einer Abwesenheit zuerst mit alten, bestätigten und ungeprüften Korbzeilen prüfen.
2. `docs/STAND-STUFE-2.md` vor dem Paketabschluss erstellen; die Datei fehlt am geprüften Commit trotz der Verweise in README und Technikstand.

Die Korrekturen für Umhängen, Archiv Rückgängig, Montagstermin und die entfernte Kandidatenpriorität sind im Code nachvollziehbar. Tests und Backendwirkung habe ich wegen des ausdrücklich untersagten Netz und Datenbankzugriffs nicht ausgeführt. Die behauptete Auflösung der Produktionszeilen und der Live Stand sind damit nicht unabhängig verifiziert.