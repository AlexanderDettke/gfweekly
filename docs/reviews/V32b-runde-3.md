Geprüft: 32b, Commit aa680317c70d0b972cbb1624e4c247a44d34ad14, 41 Dateien

1. **[mittel] Erfolgreiche Freigabe und Versand verlieren den Tastaturfokus**  
Fundstelle: `site/kommunikation.html:448`, zusätzlich Zeilen 399 und 407  
Was passiert: Nach erfolgreicher Extrasfreigabe ersetzt `neuLaden()` die Entscheidungsliste. Der fokussierte Freigabeknopf verschwindet, ohne dass ein neuer Fokus gesetzt wird. Beim Versand wird der Sendeknopf bereits durch den Fortschrittszustand entfernt; auch nach Abschluss fehlt die Fokusführung. `melde(erfolg)` zeigt und verkündet das Ergebnis, fokussiert es aber nicht. Die Bedienprobe prüft diese Fokuspositionen nicht.  
Warum falsch: Der geforderte Bedienweg mit Tastatur verliert bei zwei zentralen Aktionen seine Position. Die bisherigen Korrekturen schützen Prüfpunktformular und Konfliktfall, decken diese Erfolgswege jedoch nicht ab.  
Vorschlag: Nach Freigabe und abgeschlossenem Versand die sichtbare Ergebnismeldung oder einen passenden verbleibenden Knopf fokussieren. In der Bedienprobe jeweils `document.activeElement` prüfen.

2. **[leicht] Technikstand widerspricht dem tatsächlichen Einspielstand**  
Fundstelle: `docs/TECHNIKSTAND.md:779`, zusätzlich Zeile 781  
Was passiert: Die Folgemigration wird als „eingespielt am 07.10.2026“ bezeichnet. Laut Auftrag, README und Abschnitt „Stand des Einspielens“ stehen Migration und Deploy weiterhin aus. Außerdem nennt der Technikstand weiterhin 20 erfolgreiche Bedienprüfungen, während Antwort 2 von 52 spricht.  
Warum falsch: Vorbereitung, Ausführung und Prüfnachweis werden widersprüchlich dokumentiert. Die Empfehlung zur Aktualisierung des Technikstands aus Runde 2 ist damit weiterhin offen.  
Vorschlag: Die Migration als vorbereitet und noch nicht eingespielt kennzeichnen. Prüfzahlen mit eindeutigem Bezug auf den jeweiligen Lauf und geprüften Stand aktualisieren.

**Empfehlungen**

1. Den ursprünglichen Konfliktfall aus Runde 2 ausdrücklich testen: Entwurf öffnen, fremde Entscheidung, erfolgreiches Nachladen durch eine andere Aktion, anschließend alten Entwurf speichern.
2. Beim Öffnen eines Prüfpunktformulars den konkreten Auslöser einschließlich Datum merken. Bei älteren Prüfpunkten führt die aktuelle Fokuslogik zum Knopf des nächsten Prüfpunkts.

**Vorherige Runden**

Die vier Befunde aus Runde 2 sind im Code nachvollziehbar korrigiert: unveränderlicher Ausgangsstand des Entwurfs, Prüfung von Notiz und Entscheidungszeitpunkt, getrennte Aktionsresultate und Nachladefehler, Sperre bei veraltetem Stand, Fokus auf Konfliktmeldungen sowie konsistentere Testantworten.

Die Korrekturen aus Runde 1 für mobile Tabellen, vollständige Ladefehler, Entwurfserhaltung und Versandfehleranzeige bestehen weiterhin.

**Prüfnachweis und Grenzen**

1. `node pruefung/komm-test.mjs`: **67 erfolgreich, 0 Fehler**.
2. `node pruefung/komm-vergleich.mjs`: **alle fünf Festivals ohne Abweichung**.
3. `komm-bedienung.mjs`: Start durch **`listen EPERM`** blockiert. Keine neue dynamische Bedienprüfung.
4. Vorhandene Schirmbilder bei 390 und 1440 px, jeweils dunkel und hell, geprüft. Mobile Tabellen sind lesbar.
5. Datenvertrag zwischen `komm_list` und Seite, Navigation unter Saison sowie `core.js?v=32` auf allen 24 HTML Seiten geprüft. Keine Gedankenstriche in `kommunikation.html` gefunden.

Produktionswirkung, Migration, Deploy und tatsächliche Bedienung mit Bildschirmleser bleiben ungeprüft. Keine Dateien geändert, keine externen Dienste aufgerufen und keine weiteren Prüfer gestartet.

**32b ist wegen Befund 1 noch nicht vollständig freigabefähig.**