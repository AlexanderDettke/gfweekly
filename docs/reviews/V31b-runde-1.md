Geprüft: 31b, Commit e7a35c9, 30 Dateien

1. [schwer] Ballübergabe über den Dialog bricht ab  
Fundstelle: site/vorhaben.html:247  
Was passiert: Der Dialog wird mit `zu()` geleert. Danach liest der Code `#vhBallNotiz`; das Element existiert nicht mehr. `ballSetzen` wird nicht aufgerufen.  
Warum falsch: Der Knopf „Ball weitergeben“ erfüllt den Hauptweg aus Abschnitt 31b nicht.  
Vorschlag: Notiz und alle übrigen Werte vor dem Schließen auslesen. Danach speichern und den Erfolg in der Akte prüfen.

2. [schwer] Eine verspätete Aktenantwort kann das falsche Vorhaben anzeigen  
Fundstelle: site/vorhaben.html:260  
Was passiert: Beim schnellen Öffnen zweier Akten können die Antworten in umgekehrter Reihenfolge eintreffen. Die ältere Antwort setzt `AKTE` und zeichnet die Akte neu, obwohl `AKTE_SLUG` und URL bereits auf das zweite Vorhaben zeigen. Änderungen können so an der angezeigten, falschen Akte landen.  
Warum falsch: Abschnitt 31b verlangt einen verlässlichen Aktenweg; hier droht ein falsches Datenbankergebnis.  
Vorschlag: Jede Ladeanfrage mit einer laufenden Kennung versehen und eine Antwort nur anwenden, wenn sie noch zur aktuellen Akte gehört. Den gleichen Schutz nach dem Speichern in Zeile 346 verwenden.

3. [mittel] Zuordnung lässt sich ungefragt und ohne Rückfrage lösen  
Fundstelle: site/vorhaben.html:321  
Was passiert: Neben jedem verknüpften Thema und Kandidaten erscheint „Zuordnung lösen“; Zeile 366 schreibt sofort `vorhaben_id: null`.  
Warum falsch: Abschnitt 31b bestellt Zähler mit Links. Die zusätzliche Aktion entfernt einen Aktenbezug ohne Bestätigung oder sichtbare Möglichkeit zur Wiederherstellung.  
Vorschlag: Die Aktion aus 31b entfernen oder ihren Nutzen ausdrücklich entscheiden und dann mit Bestätigung sowie überprüfbarem Verlauf bauen.

4. [mittel] „Übergeben“ ist auf dem Handy nicht erreichbar  
Fundstelle: site/assets/styles.css:1638  
Was passiert: Unter 761 px wird die gesamte Kopfaktionsleiste einschließlich „Übergeben“ ausgeblendet. Nur der Einwurf erhält einen festen Knopf.  
Warum falsch: Abschnitt 31b verlangt beide Kopfaktionen und beschreibt für Mobil nur den festen Einwurfknopf. Wenn 31d den Übergabedialog ergänzt, fehlt auf 390 px sein Einstieg.  
Vorschlag: „Übergeben“ mobil als sichtbaren Knopf im Kopf oder in einer erreichbaren Aktionsleiste belassen.

5. [mittel] Team und Extern können ohne Namen gewählt werden  
Fundstelle: site/vorhaben.html:245  
Was passiert: Der Dialog fragt nach einem Namen, lässt das Feld aber leer und sendet dann `ball_name: null`. Das Backend akzeptiert dies.  
Warum falsch: Abschnitt 31b verlangt bei Team und Extern eine Rückfrage nach dem Namen. Ohne Namen zeigt die Akte nicht, wer tatsächlich dran ist.  
Vorschlag: Für diese beiden Ballwerte einen Namen verlangen und den Fehler am Feld anzeigen.

6. [mittel] „Seit meinem letzten Besuch“ zeigt anfangs den ganzen Verlauf  
Fundstelle: site/vorhaben.html:334  
Was passiert: Ist `gf_vh_seen_<Person>` noch leer, lässt `!seen` jeden Eintrag durch. Auf der Seite wird `gfVhMarkSeen` nirgends aufgerufen.  
Warum falsch: Der Filter aus Abschnitt 31b grenzt dann nichts ein. Für einen fehlenden Besuchswert nennt Abschnitt 31d die letzten 24 Stunden.  
Vorschlag: Diesen Zeitraum als Anfangswert verwenden und den Besuchszeitpunkt nach einem bewusst abgeschlossenen Blick je Person speichern.

7. [mittel] Die Bedienprobe verfehlt den kaputten Übergabeknopf  
Fundstelle: pruefung/bedienung.mjs:273  
Was passiert: Die Probe klickt nur einen Ballchip in der Akte und prüft die gesendete Nutzlast. Den Knopf „Ball weitergeben“ auf der Boardkarte und dessen Ergebnis prüft sie nicht. Schreibaktionen erhalten zudem einen pauschalen Erfolg aus `pruefung/testdaten.mjs:395`.  
Warum falsch: Die 15 Oberflächenproben können den Fehler aus Befund 1 nicht erkennen. Sie belegen keine erfolgreiche Ballübergabe.  
Vorschlag: Den vollständigen Dialogweg mit einer zustandsändernden Testantwort prüfen, einschließlich Name, Notiz, neuem Ball und Fehlermeldung.

8. [leicht] Der dokumentierte Prüfnachweis zeigt auf einen älteren Stand  
Fundstelle: pruefung/letzte-abnahme.json:2  
Was passiert: Die Datei nennt `7b7240c` als geprüften Commit; `docs/TECHNIKSTAND.md:672` meldet für 31b bereits 84 Bilder und null Meldungen.  
Warum falsch: Der im Repo abgelegte Nachweis trägt die Aussage für `e7a35c9` nicht.  
Vorschlag: Nach dem nächsten Oberflächenlauf den tatsächlichen geprüften Stand dokumentieren und die Aussage im Technikstand daran binden.

## Empfehlungen

1. Den Ballwechsel in Board und Akte über denselben Dialog und denselben Erfolgszustand führen.
2. Nach einem Speicherkonflikt den alten und den aktuellen Ball ausdrücklich zeigen, bevor erneut entschieden wird.
3. Bei leerer Auswahl die aktive Filterbezeichnung nennen, damit „Nichts in dieser Auswahl“ sofort einzuordnen ist.
4. Im Verlauf den zuletzt berücksichtigten Besuchszeitpunkt sichtbar machen.
5. Für den Aktenwechsel und die mobile Übergabe je eine gezielte Tastaturprobe ergänzen.

Ich konnte keinen Browser starten und hatte keinen Datenbankzugang. Daher sind Darstellung bei 1440 und 390 px, die gemeldeten 84 Bilder sowie die tatsächliche Datenbankwirkung dieses Commits nicht unabhängig geprüft. Syntaxprüfungen der geänderten JavaScript Dateien liefen durch; `git diff --check` meldete nur eine zusätzliche Leerzeile am Ende von `core.js`.