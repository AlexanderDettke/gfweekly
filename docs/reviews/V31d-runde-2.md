Geprüft: 31d, Commit 85e3a84, 17 Dateien.

1. [schwer] Nach einem Teilfehler kann eine neue Teamvertretung unbemerkt überschrieben werden  
Fundstelle: `site/vorhaben.html:544` und `site/vorhaben.html:586`  
Was passiert: Nach einer teilweise fehlgeschlagenen Übergabe lädt der Dialog den Korb neu und leert die Wahlen, behält aber den zuvor eingegebenen Teamnamen. Beim Neuladen wird dieser Name nur ersetzt, wenn noch keiner gespeichert ist. Hat Alex oder Lea den Teamnamen inzwischen geändert, gilt der alte Name beim nächsten Senden als Änderung und wird erneut geschrieben.  
Warum falsch: Die Konfliktprüfung erkennt zwar den ersten veralteten Stand. Der anschließende Neuladevorgang kann die fremde Entscheidung ohne erneute bewusste Wahl überschreiben. Das widerspricht der Antwort zu Befund 1 und 2 aus Runde 1.  
Vorschlag: Beim Neuladen nach einem Konflikt auch `S.name` und `S.init` aus dem frischen Korb aufbauen. Frühere Eingaben allenfalls getrennt als ungesendeten Entwurf anzeigen.

2. [mittel] Eine einzelne vorhandene Abwesenheit wird weiterhin ungeprüft gewählt  
Fundstelle: `site/vorhaben.html:460` und `site/vorhaben.html:531`  
Was passiert: Der Dialog nimmt bei genau einer geplanten oder aktiven Abwesenheit automatisch diese, ohne Anlass oder Zeitraum abzugleichen. Bei mehreren zeigt er eine Auswahl, ebenfalls ohne Anlassfilter.  
Warum falsch: Eine andere geplante Reise kann so weiterhin der Korb für Leas Urlaub vom 14. bis 25.10. werden. Die Antwort zu Befund 3 aus Runde 1 belegt nur die Mehrfachauswahl, nicht die passende Abwesenheit gemäß Paketabschnitt 31d.  
Vorschlag: Anlass und Zeitraum bei der Auswahl sichtbar machen und eine automatische Wahl nur bei passendem Treffer zulassen. Sonst die konkrete Abwesenheit wählen oder eine neue anlegen lassen.

3. [mittel] Ein gekürzter Verlauf lässt sich vollständig als gesehen markieren  
Fundstelle: `site/index.html:125` und `site/index.html:140`  
Was passiert: `vorhaben_seit` meldet ab 2.000 Einträgen `gekuerzt`, die Oberfläche wertet das nicht aus. „Alles gesehen“ setzt trotzdem den aktuellen Zeitpunkt. Nicht gelieferte Einträge fallen danach aus dem Fenster.  
Warum falsch: Die Nacharbeit zu Befund 5 aus Runde 1 macht die Grenze in der API kenntlich, verhindert den Verlust in „Seit du zuletzt da warst“ aber nicht.  
Vorschlag: Bei `gekuerzt` keinen endgültigen Gesehenzeitpunkt setzen. Weitere Seiten laden oder die unvollständige Ansicht sichtbar kennzeichnen und den Zeitpunkt nur bis zum ältesten tatsächlich geladenen Eintrag fortschreiben.

4. [mittel] Rückkehrverlauf kann ohne Hinweis unvollständig sein  
Fundstelle: `supabase/functions/gfweekly/index.ts:3080`  
Was passiert: Die Abfrage begrenzt die Verlaufseinträge aller betroffenen Vorhaben zusammen auf 500. Die Rückkehrseite zeigt für jedes Vorhaben dennoch eine genaue Anzahl „seit“ Abwesenheitsbeginn und einen Link für angeblich weitere Einträge.  
Warum falsch: Bei mehr als 500 Einträgen fehlen ältere Ereignisse still. Der Abschnitt 31d verlangt die Verlaufseinträge seit Beginn der Abwesenheit.  
Vorschlag: Seitenweise bis zum Beginn lesen oder eine Kürzung an die Oberfläche melden. Den Beginn mit der Zeitzone Europe/Berlin berechnen statt mit einer festen UTC Uhrzeit.

5. [mittel] Rückübergabe bleibt trotz Ladefehler möglich  
Fundstelle: `site/rueckkehr.html:148` und `site/rueckkehr.html:155`  
Was passiert: Der neue Fehlerzustand ist sichtbar, aber `ladeVorhaben()` wird nicht abgewartet und „Rückübergabe bestätigen“ bleibt bei einem Fehler bedienbar.  
Warum falsch: Die Antwort zu Befund 6 aus Runde 1 behebt die unsichtbare Fehlermeldung. Alex oder Lea können die Rückgabe aber weiterhin bestätigen, ohne „Deine Vorhaben zurück“ gesehen zu haben.  
Vorschlag: Die Bestätigung bis zum erfolgreichen Laden sperren und nach „noch einmal laden“ wieder freigeben.

6. [mittel] Die Wirkungsprobe kann eine zweite Testabwesenheit zurücklassen  
Fundstelle: `pruefung/vorhaben-probe.mjs:218` und `pruefung/vorhaben-probe.mjs:233`  
Was passiert: Die Probe legt eine zweite Abwesenheit an. Im `finally` beendet sie nur die erste. Scheitert ein Schritt nach Anlage der zweiten, erreicht der Lauf deren reguläres `absence_end` nicht; die Aufräumaktion löscht nur bereits beendete Testabwesenheiten.  
Warum falsch: Die Wirkungsprobe soll hinter sich aufräumen. Ein Abbruch kann eine geplante Testabwesenheit samt Korb im echten Backend lassen.  
Vorschlag: Beide Abwesenheitskennungen im `finally` beenden und anschließend prüfen, dass keine aktive oder geplante Abwesenheit der Probe übrig ist.

## Empfehlungen

1. Im Urlaubsdialog den Zeitraum der gewählten Abwesenheit dauerhaft im Kopf anzeigen, besonders vor „Übergabe senden“.
2. Nach einem Teilfehler erfolgreiche und fehlgeschlagene Zeilen getrennt nennen, damit niemand die ganze Übergabe erneut versucht.
3. Den Rückkehrabschnitt vor dem Bestätigungsknopf platzieren, damit der Überblick im Hauptweg liegt.
4. Die Oberflächenprobe um den Konfliktfall mit geändertem Teamnamen und um einen Ladefehler bei der Rückkehr ergänzen.

Die Antworten aus Runde 1 zu unveränderten bestätigten Zeilen, atomarem Vergleich, Probewarnung und sichtbarem Rückkehrfehler sind im Code grundsätzlich nachvollziehbar. Den aktuellen Inhaltsstand der abgelegten Oberflächenabnahme habe ich mit `pruefung/stand.sh` abgeglichen; der Hash stimmt. Browserdarstellung bei 1440 und 390 Pixeln, Tastatur und Bildschirmleser sowie die tatsächliche Datenbankwirkung und Aufräumung konnte ich ohne Browser und Backendzugang nicht bestätigen. Ich habe nichts geändert.