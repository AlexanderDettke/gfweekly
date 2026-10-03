Geprüft: 31a, Commit 7b7240c, 22 Dateien

1. [schwer] Erledigen einer Korbzeile kann einen manuellen Ballwechsel zurücksetzen  
Fundstelle: `supabase/migrations/20261003172105_hh_vorhaben_v31a_transaktionen.sql`:307  
Was passiert: `v_geaendert` zählt auch einen Statuswechsel. Wird eine bestätigte Zeile nach einem manuellen Ballwechsel auf `erledigt` gesetzt, gilt dies in Zeile 378 als neuer Übergabewunsch. Die Funktion setzt den Ball erneut auf die Vertretung.  
Warum falsch: Die Antwort auf Befund 3 verspricht, dass nur eine Änderung an Ampel oder Vertretung den manuellen Ballwechsel überstimmt. Das gefährdet die Übergabe nach Abschnitt 31a.  
Vorschlag: Für die erneute Ballanwendung ausschließlich Änderungen an Ampel oder Vertretung prüfen. Statusänderungen getrennt protokollieren.

2. [schwer] Als vertraulich erkannter Einwurf kann beim Zielwechsel ungefiltert im Verlauf landen  
Fundstelle: `supabase/migrations/20261003172105_hh_vorhaben_v31a_transaktionen.sql`:170  
Was passiert: Die Pflicht zum bearbeiteten Text greift nur bei `v_gleich`. Bei einem anderen Ziel verwendet Zeile 180 ersatzweise den ursprünglichen Einwurftext. Der kann genau die Angaben enthalten, wegen derer die KI Antwort als vertraulich markiert wurde. Bei Benachrichtigung `sofort` gelangt er zusätzlich in den Ticker.  
Warum falsch: Die Nacharbeit zu Befund 7 schützt diesen Weg nicht. Der Prüfauftrag verlangt, vertrauliche Inhalte nicht unnötig in Verlauf und Oberfläche zu übernehmen.  
Vorschlag: Den Text auch beim Zielwechsel und bei fehlendem Vorschlag vor dem Eintrag prüfen. Bei einem Treffer einen bearbeiteten, geprüften Text verlangen.

3. [mittel] Zielwechsel erzeugt entgegen der Zusage einen Ticker  
Fundstelle: `supabase/migrations/20261003172105_hh_vorhaben_v31a_transaktionen.sql`:241  
Was passiert: Auch wenn `v_gleich` falsch ist, legt `benachrichtigung sofort` einen Ticker im neuen Vorhaben an.  
Warum falsch: Die Antwort auf Befund 2 und `docs/TECHNIKSTAND.md`:650 sagen für diesen Fall „nur der Verlaufseintrag“. Die Probe prüft den Ticker nicht.  
Vorschlag: Beim Zielwechsel keine vorgeschlagene Benachrichtigung übernehmen. Eine ausdrücklich neu gewählte Benachrichtigung erst nach Prüfung des Textes zulassen.

4. [mittel] Bearbeiteter nächster Schritt umgeht den Vertraulichkeitsfilter  
Fundstelle: `supabase/functions/gfweekly/index.ts`:2906  
Was passiert: Die Aktion prüft `bearbeitet.verlauf_text`, aber nicht `bearbeitet.naechster_schritt`. Die Datenbankfunktion bevorzugt den bearbeiteten nächsten Schritt in Zeile 228 und speichert ihn.  
Warum falsch: Die Antwort auf Befund 7 nennt den nächsten Schritt als geschütztes Feld. Hier können etwa Zugangsdaten trotz markiertem KI Vorschlag in die Akte gelangen.  
Vorschlag: Den bearbeiteten nächsten Schritt vor dem RPC mit derselben Regel prüfen.

5. [mittel] Neue KI Prüfung kann eine bereits angezeigte Auswahl austauschen  
Fundstelle: `supabase/functions/gfweekly/index.ts`:2929  
Was passiert: `einwurf_vorschlag` ersetzt den Vorschlag, solange der Einwurf offen ist. `einwurf_apply` übernimmt später die vom Client gesendeten Punkt IDs und Nummern neuer Punkte gegen den dann aktuellen Vorschlag, ohne dessen Version zu prüfen. Prüfen Alex und Lea denselben Einwurf parallel, kann eine Auswahl für Vorschlag A einen anderen neuen Punkt aus Vorschlag B anlegen.  
Warum falsch: Abschnitt 31a verlangt, dass nur die gewählten Teile der geprüften KI Antwort angewendet werden. Die Zeilensperre beim Anwenden schützt nicht die zuvor angezeigte Auswahl.  
Vorschlag: Vorschläge mit einer Revision versehen und diese beim Anwenden unter der Zeilensperre vergleichen. Bei Abweichung 409 zurückgeben.

6. [mittel] Ein verworfener Abgleichvorschlag kann ohne Punktwirkung bestätigt werden  
Fundstelle: `supabase/migrations/20261003172105_hh_vorhaben_v31a_transaktionen.sql`:113  
Was passiert: Die Funktion erlaubt `verworfen` → `bestaetigt`, hakt den referenzierten Punkt aber nur ab, wenn der alte Status `vorschlag` war. Danach steht ein bestätigter Vorschlag „Punkt erledigt“ neben einem offenen Punkt.  
Warum falsch: Die Transaktion aus der Antwort auf Befund 4 verhindert diesen Widerspruch nur beim ersten Bestätigen.  
Vorschlag: Entschiedene Vorschläge gegen erneuten Statuswechsel sperren oder bei jeder zulässigen Bestätigung die Punktwirkung konsistent herstellen.

7. [mittel] Die Wirkungsprobe kann Einwürfe an echten Vorhaben zurücklassen  
Fundstelle: `pruefung/vorhaben-probe.mjs`:125  
Was passiert: Der erste KI Einwurf wird ohne `vorhaben_id` angelegt. Erkennt die KI ein echtes Vorhaben, wird der Einwurf dort gespeichert und später lediglich verworfen. Erkennt sie keines oder fällt sie aus, kann ein offener Einwurf ohne Vorhaben bleiben. `probe_aufraeumen` löscht nur Einwürfe mit einer der beiden Testvorhaben IDs. Der Aktenvergleich erfasst verworfene Einwürfe nicht.  
Warum falsch: Abschnitt 31a verlangt, dass die Probe nichts in echten Vorhaben schreibt und hinter sich aufräumt. Die 74 Proben belegen diese Zusage für den genannten Fehlerfall nicht.  
Vorschlag: Auch diesen Einwurf fest an `test-v31` binden und sämtliche erzeugten Einwurf IDs beim Aufräumen gezielt entfernen.

### Empfehlungen

1. `schicht_uebergabe` sollte `expect_ball` für jeden Eintrag verlangen. Der derzeitige Rückfall auf den frisch gelesenen Ball in `index.ts`:2972 erkennt keinen Stand, den eine Person schon vorher im Dialog gesehen hat.
2. Die Probe sollte Zielwechsel mit `sofort`, vertraulichem Text und gleichzeitig erneuertem Vorschlag ausdrücklich abdecken.
3. Im Technikstand die Aussage „nur der Verlaufseintrag“ erst nach Korrektur von Befund 3 stehen lassen.

Die Antworten aus Runde 1 sind damit nur teilweise am Code bestätigt. Insbesondere die Transaktionen sind vorhanden; die genannten Randfälle bleiben offen. Datenbankzugang hatte ich nicht. Anwendung der Migrationen, Deploy von v38 und den dokumentierten Lauf mit 74 von 74 konnte ich nicht unabhängig prüfen. `site/` war gemäß Auftrag nicht Gegenstand dieser Runde.