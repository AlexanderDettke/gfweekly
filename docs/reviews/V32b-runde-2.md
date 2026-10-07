Geprüft: 32b, Commit 68192950b1fbdd900bba5452229eb4e557d5bb17, 39 Dateien

1. **[schwer] Offene Entwürfe können neuere Prüfpunktentscheidungen überschreiben**  
Fundstelle: `site/kommunikation.html:410`, ergänzend Zeilen 423, 435 und 461  
Was passiert: Ein Entwurf behält seine eingegebenen Werte beim Nachladen. Die Erwartungswerte zum Speichern stammen jedoch aus dem inzwischen erneuerten `D`, nicht aus dem Stand beim Öffnen. Beispiel: Alex bearbeitet Gelb, Lea setzt inzwischen Rot, Alex speichert einen anderen Prüfpunkt und lädt damit die Seite nach. Der alte Entwurf bleibt erhalten und sendet anschließend seine alte Stufe mit `expect_stufe: "rot"`. Die Datenbank akzeptiert das Überschreiben. Zusätzlich schützt die Migration zwischenzeitliche Änderungen allein an der Notiz überhaupt nicht.  
Warum falsch: Der Konfliktschutz aus Runde 1 ist unvollständig. Neuere Entscheidungen beziehungsweise Notizen können verloren gehen.  
Vorschlag: Beim Öffnen eine unveränderliche Ausgangsversion im Entwurf speichern. Beim Speichern diese Version gegen den vollständigen Prüfpunkt prüfen, einschließlich Notiz und Entscheidungsstand. Nachladen darf die Ausgangsversion eines bestehenden Entwurfs nicht ersetzen.

2. **[mittel] Fehlgeschlagenes Nachladen behauptet auch nach abgelehnten Aktionen „Gespeichert“**  
Fundstelle: `site/kommunikation.html:457`, ergänzend Zeilen 402, 412 und 431  
Was passiert: `neuLaden()` meldet bei vorhandenem `D` immer „Gespeichert, aber die Seite ließ sich nicht neu laden“. Die Funktion wird auch nach Versandfehlern und abgelehnten Extrasfreigaben aufgerufen. Scheitern beispielsweise die Freigabe mit 409 und anschließend `komm_list`, ersetzt die Erfolgsmeldung den Hinweis „Nicht freigegeben“. Gleichzeitig zeichnet `renderAll()` den alten Stand mit weiterhin bedienbaren Entscheidungsknöpfen.  
Warum falsch: Die Oberfläche verwechselt abgelehnte und ausgeführte Aktionen. Der veraltete Stand bleibt ohne dauerhafte Kennzeichnung entscheidungsfähig. Damit ist Befund 3 aus Runde 1 nur teilweise behoben.  
Vorschlag: Aktionsresultat und Nachladefehler getrennt behandeln. „Gespeichert“ ausschließlich nach bestätigtem Schreibresultat anzeigen. Veraltete Daten dauerhaft kennzeichnen und vor weiteren Entscheidungen ein erfolgreiches Nachladen verlangen.

3. **[mittel] Konfliktbehandlung verliert weiterhin den Tastaturfokus**  
Fundstelle: `site/kommunikation.html:412`  
Was passiert: Bei einem erkannten Änderungskonflikt wird das Formular gelöscht und die Seite neu gezeichnet. Anders als nach erfolgreichem Speichern wird kein neuer Fokus gesetzt. Der gerade fokussierte Speicherknopf verschwindet.  
Warum falsch: Der zentrale Konfliktfall verliert für Tastatur und Bildschirmleser die Bedienposition. Die Fokuskorrektur aus Runde 1 deckt diesen Weg nicht ab.  
Vorschlag: Nach Konflikten den Fokus auf einen sichtbaren Konflikthinweis oder den passenden Prüfpunktknopf setzen. Datum und ursprünglichen Auslöser dabei berücksichtigen. Den tatsächlichen Fokus nach 409 prüfen.

4. **[mittel] Schreibantworten der Bedienprobe liefern weiterhin einen widersprüchlichen Folgestand**  
Fundstelle: `pruefung/testdaten.mjs:503`, ergänzend Zeilen 511 bis 513 und `pruefung/komm-bedienung.mjs:60`  
Was passiert: Erfolgreicher Versand verändert `KOMM_LIST.rahmen` nicht. Deshalb prüft die Bedienprobe nach einem angeblich fehlerfreien Versand weiterhin den ursprünglichen Fehlerstatus. Beim Speichern werden Prüfpunkt und Kopfstatus verändert, aber `entscheiden` bleibt unverändert. Eine freigegebene Budgetentscheidung erscheint im Test weiterhin als offen.  
Warum falsch: Die Probe belegt den vollständigen Zustand nach Schreibaktionen weiterhin nicht. Befund 7 aus Runde 1 ist trotz verbesserter Fokusprüfung, Wochenwechselprüfung und Breitenprüfung nur teilweise behoben.  
Vorschlag: Versandstatus und Entscheidungsliste konsistent aktualisieren. Nach erfolgreicher Freigabe das Verschwinden der offenen Budgetentscheidung prüfen, nach erfolgreichem Versand den aktualisierten Rahmenstatus. Die Fehlerstatusprüfung vor den erfolgreichen Versand verschieben.

**Empfehlungen**

1. Erfolgsresultate, Konflikte und veraltete Daten in einer dauerhaft sichtbaren Statusregion zusammenführen.
2. Den ursprünglichen Auslöser eines Formulars speichern, damit Schließen und Speichern auch bei älteren Prüfpunkten zur richtigen Entscheidung zurückführen.
3. Den Technikstand auf die überarbeitete Bedienprobe aktualisieren. Dort stehen weiterhin 20 erfolgreiche Prüfungen, während die Antwortdatei 40 nennt.

**Runde 1 und Prüfnachweis**

Die mobile Tabellenkorrektur, das Erhalten eingegebener Entwürfe beim Neuzeichnen und die Anzeige von Versandfehlern sind im Code umgesetzt. Die vorhandenen Schirmbilder bei 390 px hell und 1440 px dunkel zeigen brauchbare Tabellen. Der Konfliktschutz, die Fehlerbehandlung, die Fokusführung und die Testantworten bleiben in den oben beschriebenen Fällen unvollständig.

1. `node pruefung/komm-test.mjs`: **67 erfolgreich, 0 Fehler**.
2. `node pruefung/komm-vergleich.mjs`: **alle fünf Festivals ohne Abweichung in den verglichenen Feldern**.
3. `komm-bedienung.mjs`: durch **`listen EPERM`** blockiert. Keine neue dynamische Bedienprüfung durchgeführt.
4. Navigation unter Saison und `core.js?v=32` auf allen 24 HTML Seiten geprüft. Keine Gedankenstriche in `kommunikation.html` gefunden.

Produktionswirkung, Migration, Deploy und tatsächliche Bedienung mit Bildschirmleser bleiben ungeprüft. Keine Dateien geändert, keine externen Dienste aufgerufen und keine weiteren Prüfer gestartet.

**32b ist noch nicht freigabefähig.**