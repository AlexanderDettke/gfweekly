Geprüft: 31a, Commit 99ffaca, 53 Dateien

1. [schwer] Gespeicherte Fremdvorschläge können ungeprüfte Inhalte in die Akte schreiben  
Fundstelle: `supabase/migrations/20261003173522_hh_vorhaben_v31a_runde2.sql`:140  
Was passiert: `hh_einwurf_apply` übernimmt Punktstände sowie Titel und Namen neuer Punkte direkt aus `vorschlag`. Der neue Vertraulichkeitsfilter prüft dort nur Verlaufstext, nächsten Schritt und Ticker. Auch `wer` und `tag` des Verlaufs gehen ohne diese Prüfung in die Akte. Der dokumentierte Mail Abgleich schreibt Vorschläge direkt in `hh_einwurf`; sie durchlaufen `einwurfPruefen` in der Edge Function nicht.  
Warum falsch: Die Antwort auf Runde 2, Befunde 2 und 4, belegt den Schutz dieser Felder nicht. Abschnitt 31a verlangt eine streng geprüfte Antwort, bevor ausgewählte Teile angewendet werden. So kann etwa ein vertraulicher Punktstand trotz Bestätigung ungefiltert in Punkt und Verlauf gelangen.  
Vorschlag: Sämtliche anwendbaren Vorschlagsfelder an der Transaktionsgrenze prüfen. Vertrauliche Werte zurückweisen oder eine ausdrücklich bearbeitete Fassung verlangen. Einen direkt gespeicherten Mail Vorschlag in der Wirkungsprobe abdecken.

2. [mittel] Mail Vorschläge verlieren beim Übernehmen ihre Punkt und Feldänderungen  
Fundstelle: `supabase/migrations/20261003173522_hh_vorhaben_v31a_runde2.sql`:95  
Was passiert: Die Funktion erkennt einen Vorschlag nur dann als zum gewählten Vorhaben gehörig, wenn sein JSON `vorhaben_id` enthält. `docs/ABGLEICH-VORHABEN.md`:31 beschreibt für Einwurf Mails dagegen ein JSON mit `vorhaben_slug`, ohne `vorhaben_id`. Solche Einwürfe übernehmen stets nur einen Verlaufseintrag; ausgewählte Punkte, Ball, nächster Schritt und Frist werden übersprungen.  
Warum falsch: Die Warteschlange aus Abschnitt 31c baut auf diesen Mail Einwürfen auf. Der Technikstand beschreibt die Anwendung ausgewählter Teile ohne diese Grenze.  
Vorschlag: Beim Übernehmen den Slug unter der Zeilensperre gegen das gewählte Vorhaben auflösen und prüfen oder die dokumentierte Schreibanweisung samt bestehenden Vorschlägen auf eine geprüfte `vorhaben_id` umstellen.

3. [schwer] Ein alter Einwurfvorschlag kann einen neu vergebenen Ball überschreiben  
Fundstelle: `supabase/migrations/20261003173522_hh_vorhaben_v31a_runde2.sql`:162  
Was passiert: Ein vorgeschlagener Ball geht ohne `expect_ball` an `hh_vorhaben_save`. Die Revision schützt nur vor einem *anderen Vorschlag*, nicht vor einer Änderung des Vorhabens seit der KI Prüfung. Gibt Alex den Ball inzwischen weiter, kann Lea mit dem älteren Einwurf diese Entscheidung still überschreiben.  
Warum falsch: Abschnitt 31a verlangt verlässliche Ballwechsel auch bei gleichzeitiger Arbeit. Der Konfliktschutz von `vorhaben_save` greift auf diesem Weg nicht.  
Vorschlag: Den bei der Vorschlagserstellung gesehenen Ball speichern und beim Anwenden als `expect_ball` prüfen. Bei Abweichung 409 mit aktuellem Ball zurückgeben.

4. [mittel] Wiederholtes Bestätigen schreibt wiederholt Übergabeprotokolle  
Fundstelle: `supabase/migrations/20261003173522_hh_vorhaben_v31a_runde2.sql`:363  
Was passiert: `hh_handover_set` fügt bei jedem Aufruf einen Eintrag in `gfweekly_handover_log` ein, selbst wenn Status, Ampel und Vertretung gleich bleiben. Die Probe prüft beim doppelten Aufruf nur, dass im Vorhabensverlauf genau ein Eintrag steht.  
Warum falsch: Ein doppelter Klick oder erneutes Speichern erscheint im Übergabeprotokoll als weitere Weitergabe. Das macht den Verlauf des Schichtwechsels unzuverlässig.  
Vorschlag: Den Logeintrag nur bei einer tatsächlichen Änderung oder einer ausdrücklich neuen Notiz schreiben und auch die Protokollzahl beim doppelten Aufruf prüfen.

5. [mittel] Aufräumaktion identifiziert Einwürfe nur anhand ihres Textanfangs  
Fundstelle: `supabase/functions/gfweekly/index.ts`:2989  
Was passiert: `probe_aufraeumen` löscht jeden Einwurf mit Text `V31-Probe:%`, unabhängig davon, welcher Lauf ihn angelegt hat. Die Aktion ist über das normale Passwort erreichbar und verwendet keine Laufkennung.  
Warum falsch: Ein gleich beginnender echter Einwurf würde gelöscht. Die Antwort auf Runde 2, Befund 7, belegt nur, dass die eigenen Probe Einwürfe so gefunden werden, nicht dass ausschließlich diese getroffen werden.  
Vorschlag: Für die Probe eine eindeutige Kennung in `source_ref` oder einem eigenen Testmerkmal speichern und ausschließlich darüber aufräumen.

### Empfehlungen

1. Eine Backend Probe für den dokumentierten Mail Abgleich ergänzen: Vorschlag nur mit Slug speichern, anzeigen und ausgewählte Teile übernehmen.
2. Die Wirkungsprobe um einen Ballwechsel *zwischen* Vorschlagserstellung und Anwendung sowie um die Zahl der Übergabeprotokolle nach doppelter Bestätigung ergänzen.
3. Im Technikstand die Aussage „Jeder Vorschlag trägt eine revision“ auf die von der Edge Function erzeugten Vorschläge begrenzen. Der dokumentierte Mail Abgleich erzeugt keine Revision.
4. Den Testbestand über eine eindeutige Laufkennung zuordnen. Das macht Aufräumen nach Abbruch nachvollziehbar und schützt andere Einwürfe.

Die Antworten aus Runde 1 und 2 sind in wesentlichen Punkten am Code nachvollziehbar: Transaktionen, Revisionsvergleich, Textprüfung beim Zielwechsel und die Korrektur des Statuswechsels sind vorhanden. Die genannten Wege bleiben offen. Die Datenbank war für diese Prüfung nicht erreichbar. Die Anwendung der drei Migrationen, der Deploy von v38 und der dokumentierte Lauf mit 81 von 81 Proben sind daher nicht unabhängig bestätigt. `site/` und die dortige Bedienung waren gemäß Auftrag nicht Gegenstand dieser Prüfung.