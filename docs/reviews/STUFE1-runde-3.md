Geprüft: Stufe 1, Commit 2a4472433d70807b74216bd7427e1cfdb92ba066, 55 Dateien

1. [mittel] Manuelle Bearbeitung wird nicht zuverlässig geschützt  
Fundstelle: [supabase/functions/gfweekly/entscheidungen.ts:237](/private/tmp/claude-501/-Users-alexanderdettke/e77c1890-1570-4547-9f9c-7d602dccfe75/scratchpad/s1r3/supabase/functions/gfweekly/entscheidungen.ts:237)  
Was passiert: Wird nur der Vorschlag bearbeitet, bleiben `frage_form=false` und `frage_von` leer. Das nächste Sammeln kann den Vorschlag aus der Quelle wieder darüber schreiben. Das unbedingte Update lässt außerdem einen veralteten Bearbeiten Dialog noch eine inzwischen entschiedene Zeile ändern.  
Warum falsch: Paketabschnitte 0 und 2 geben Personeneingaben Vorrang vor dem Lauf und verlangen einen geschützten Entscheidungsstand.  
Vorschlag: Manuelle Änderungen als solche markieren und das Speichern auf einen weiterhin bearbeitbaren, gesehenen Stand begrenzen.

2. [mittel] Verwerfen und Archivieren greifen auf inzwischen zugeordnete Einträge zu  
Fundstelle: [supabase/functions/gfweekly/entscheidungen.ts:200](/private/tmp/claude-501/-Users-alexanderdettke/e77c1890-1570-4547-9f9c-7d602dccfe75/scratchpad/s1r3/supabase/functions/gfweekly/entscheidungen.ts:200)  
Was passiert: Nach dem Laden des Korbs kann eine andere Person einen Eintrag einem Vorhaben zuordnen. Die alten Knöpfe können den Kandidaten trotzdem verwerfen oder das Thema archivieren, weil beide Updates `vorhaben_id` und beim Thema den offenen Boardzustand nicht prüfen.  
Warum falsch: Paketabschnitt 4 beschränkt diese Aktionen auf Einträge ohne Vorhaben. Die Zuordnung aus Runde 2 prüft einen veralteten Stand bereits, diese beiden Aktionen nicht.  
Vorschlag: Die Korbvoraussetzungen beim Update erneut prüfen und sonst 409 zurückgeben.

3. [mittel] Fehler beim Laden der Herkunft erscheinen als fehlende Quelle  
Fundstelle: [supabase/functions/gfweekly/entscheidungen.ts:122](/private/tmp/claude-501/-Users-alexanderdettke/e77c1890-1570-4547-9f9c-7d602dccfe75/scratchpad/s1r3/supabase/functions/gfweekly/entscheidungen.ts:122)  
Was passiert: Die Abfragen für Punkte, Themen, Kandidaten und Vorhaben werden ohne Prüfung ihrer `error` Werte ausgewertet. Bei einem Abfragefehler liefert die Liste dennoch 200 und bezeichnet betroffene Quellen als nicht mehr vorhanden. Entscheidungen bleiben bedienbar, obwohl Herkunft und Link fehlen.  
Warum falsch: Paketabschnitte 2 und 3 verlangen aufgelöste Herkunft und verständliche Fehler.  
Vorschlag: Abfragefehler weitergeben und die Liste mit einem sichtbaren Ladefehler statt mit einer falschen Herkunft anzeigen.

4. [mittel] Erfolgreiches Schreiben kann als „Nicht gespeichert“ erscheinen  
Fundstelle: [supabase/functions/gfweekly/entscheidungen.ts:249](/private/tmp/claude-501/-Users-alexanderdettke/e77c1890-1570-4547-9f9c-7d602dccfe75/scratchpad/s1r3/supabase/functions/gfweekly/entscheidungen.ts:249)  
Was passiert: Nach erfolgreicher Datenbankaktion folgt ein weiterer Leseaufruf mit `eine(eid)`. Scheitert nur dieser, antwortet die Aktion mit 500; die Seite meldet „Nicht gespeichert“, obwohl entschieden, vertagt, abgegeben oder zurückgenommen wurde.  
Warum falsch: Der Hauptweg meldet damit einen falschen Speicherstand.  
Vorschlag: Die bereits zurückgegebene Transaktionsantwort als Schreibnachweis verwenden und einen fehlgeschlagenen Nachladeversuch getrennt melden.

5. [mittel] Die Spielschicht schreibt weiterhin Punkte  
Fundstelle: [supabase/functions/gfweekly/index.ts:1739](/private/tmp/claude-501/-Users-alexanderdettke/e77c1890-1570-4547-9f9c-7d602dccfe75/scratchpad/s1r3/supabase/functions/gfweekly/index.ts:1739)  
Was passiert: Schon das Beenden der neuen Besprechung ruft `award` auf und schreibt Ereignisse in `gfweekly_score_events`. Weitere erreichbare Aktionen wie `decision_add`, `ritual_toggle` und `milestone_save` tun das ebenfalls. `GF_SPIEL=false` und die Korrektur für `checkin` verhindern diese Aufrufe nicht.  
Warum falsch: Paketabschnitte 0 und 7 setzen die Spielschicht aus; die Spieltabellen sollen erhalten bleiben, aber nicht weiter gepflegt werden.  
Vorschlag: Die serverseitige Vergabe für die ausgeschaltete Spielschicht unterbinden und eine Besprechung bis zum unveränderten Punktestand prüfen.

6. [mittel] Der Abschlussstand überzeichnet die Liveprüfung  
Fundstelle: [docs/STAND-STUFE-1.md:8](/private/tmp/claude-501/-Users-alexanderdettke/e77c1890-1570-4547-9f9c-7d602dccfe75/scratchpad/s1r3/docs/STAND-STUFE-1.md:8)  
Was passiert: Der Text nennt den Live Stand bytegleich mit diesem Commit und führt 44 Wirkungsproben an. Laut übergebenem Teststand ist die Änderung für `ohne_spiel` in `index.ts` noch nicht deployt; der lokale Diff zu `81cb76e` bestätigt diese zusätzliche Änderung. Nach den Datenbankkorrekturen wurden zudem 47 Proben gemeldet.  
Warum falsch: Paketabschnitt 8.7 verlangt die Trennung von geprüft und veröffentlicht. Die aktuelle Funktionsfassung ist noch kein belegter Live Stand.  
Vorschlag: Den Vergleich auf `81cb76e` begrenzen und den Endstand erst nach Deploy, erneutem Dateivergleich und `ping` als veröffentlicht ausweisen.

## Empfehlungen

1. Die Fälle „nur Vorschlag bearbeiten“, veralteter Bearbeiten Dialog und inzwischen zugeordneter Korbeintrag gezielt prüfen.
2. Fehler beim Herkunftsabruf und beim Nachladen nach erfolgreichem Schreiben in den Bedienproben simulieren.
3. Bei ausgeschalteter Spielschicht eine Besprechung beenden und die Spieltabellen davor und danach vergleichen.
4. Den Abschlussstand nach dem Deploy mit den tatsächlich geprüften 47 Wirkungsproben aktualisieren.

Die vier konkreten Korrekturen aus Runde 2 sind im Code nachvollziehbar. Datenbankwirkung und Liveoberfläche habe ich wegen des untersagten Netzaufrufs nicht selbst geprüft. Da nach Runde 3 mittlere Befunde bleiben, liegt der Stoppgrund aus Paketabschnitt 8.5 vor.

