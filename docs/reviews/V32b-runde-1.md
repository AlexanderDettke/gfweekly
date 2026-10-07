Geprüft: 32b, Commit 5bf78685e2f2a235ccb092089acb403f2cb75c53, 32 Dateien

1. **[schwer] Extrasfreigabe kann zwischenzeitliche Entscheidungen überschreiben**  
Fundstelle: `site/kommunikation.html:418`, ergänzend `supabase/migrations/20261007052131_hh_komm_v32a.sql:241`  
Was passiert: „Extras freigeben“ sendet Stufe und Extras aus dem alten Seitenstand ohne `expect_stufe`. Ändert Lea inzwischen beispielsweise Gelb auf Rot oder die gewählten Extras, schreibt Alex’ anschließende Freigabe die alten Werte zurück. Die SQL Funktion prüft einen Konflikt nur bei übergebenem Erwartungswert.  
Warum falsch: Eine Budgetfreigabe darf keine zwischenzeitliche Entscheidung überschreiben. Die Festivalsperre verhindert gleichzeitige Ausführung, aber keine veralteten Eingaben.  
Vorschlag: Freigabe gegen eine vollständige Version des gelesenen Prüfpunkts prüfen, einschließlich Extras. Bei Abweichung 409 melden und die aktuelle Entscheidung anzeigen.

2. **[mittel] Pflichtveröffentlichungen sind bei 390 px kaum lesbar**  
Fundstelle: `site/kommunikation.html:86`, ergänzend Zeile 348  
Was passiert: Nur die Tabellenzeilen werden auf Grid umgestellt. Tabelle, `tbody` und das feste `colgroup` behalten ihren Tabellenaufbau. Die vorhandenen Schirmbilder zeigen stark zusammengedrückte Inhalte und enorme Zeilenhöhen. Beide Bilder bei 390 px sind 29.741 px hoch.  
Warum falsch: 32b verlangt eine zuerst am Handy geprüfte, brauchbare Darstellung. Fehlender horizontaler Überlauf belegt hier keine Lesbarkeit.  
Vorschlag: Den mobilen Tabellenaufbau vollständig umstellen, insbesondere Tabelle und `tbody` auf volle Blockbreite setzen und das `colgroup` mobil ausblenden. Anschließend Zellbreiten und Lesbarkeit prüfen.

3. **[mittel] Ladefehler lassen Teile der Seite dauerhaft im Ladezustand**  
Fundstelle: `site/kommunikation.html:435`, ergänzend Zeile 395  
Was passiert: Scheitert `komm_list`, erhält ausschließlich die Festivalübersicht eine Fehlermeldung. Wochenlast und Entscheidungen behalten „lädt …“, die übrigen Bereiche bleiben leer. Ein fehlgeschlagenes Nachladen nach dem Versand liegt außerdem außerhalb dessen Fehlerbehandlung.  
Warum falsch: Der Prüfauftrag verlangt vollständige Ladezustände und Fehlerzustände. Die GF kann nicht erkennen, welche Informationen fehlen oder ob ein bereits ausgeführter Versand erfolgreich war.  
Vorschlag: Einen gemeinsamen Fehlerzustand mit Wiederholung anbieten. Nach Schreibaktionen deren Ergebnis getrennt vom Erfolg des anschließenden Nachladens anzeigen.

4. **[mittel] Prüfpunktformular verliert den Tastaturfokus**  
Fundstelle: `site/kommunikation.html:413`, ergänzend Zeilen 403 und 414  
Was passiert: Beim Öffnen ersetzt `renderKopf()` den betätigten Knopf. Danach soll das erste Formulareingabefeld fokussiert werden. Dieses ist jedoch das versteckte Stufenfeld aus `gfChips()` und kann keinen Fokus erhalten. Auch beim Schließen oder erfolgreichen Speichern fehlt die Rückgabe des Fokus.  
Warum falsch: Der geforderte Bedienweg mit Tastatur und Bildschirmleser verliert seine Position.  
Vorschlag: Einen sichtbaren Stufenknopf fokussieren und beim Schließen den auslösenden Knopf wieder fokussieren. Den tatsächlichen Fokus im Test prüfen.

5. **[mittel] Ungespeicherte Prüfpunktänderungen verschwinden beim Öffnen eines anderen Formulars**  
Fundstelle: `site/kommunikation.html:249`, ergänzend Zeile 412  
Was passiert: `OFFEN.pp` speichert beim Öffnen nur das Datum. Änderungen an Stufe, Extras und Notiz bleiben ausschließlich im DOM. Wird anschließend ein weiteres Prüfpunktformular oder eine Versandvorschau geöffnet, ersetzt `renderKopf()` alle Festivalzeilen und stellt die alten Daten wieder her.  
Warum falsch: Der Entscheidungsweg verwirft eingegebene Änderungen ohne Hinweis.  
Vorschlag: Entwürfe bei Eingaben in `OFFEN.pp` speichern und daraus rendern. Alternativ jeweils nur die betroffene Festivalzeile aktualisieren.

6. **[mittel] Versandfehler verschwinden aus dem Rahmenstatus**  
Fundstelle: `site/kommunikation.html:212`  
Was passiert: `komm_list` liefert `rahmen.fehler`, die Kopfzeile berücksichtigt dieses Feld jedoch nicht. Ein Versand mit fehlgeschlagenen Aufgaben und `weiter: false` erscheint nach Schließen der Ergebnisanzeige als „gesendet am“. Dieser Antwortfall ist im Versandcode möglich.  
Warum falsch: Nach 32b muss der Rahmenstatus erkennen lassen, ob die Übergabe abgeschlossen ist oder geprüft werden muss.  
Vorschlag: Bei Fehlern „Versand unvollständig, n Fehler“ anzeigen und den Fehlerbericht zugänglich halten.

7. **[mittel] Die Bedienprobe kann trotz defekter Bedienung grün werden**  
Fundstelle: `pruefung/komm-bedienung.mjs:44`, ergänzend Zeile 48 und `pruefung/testdaten.mjs:501`  
Was passiert: Der Tastaturtest prüft nach `ArrowRight` lediglich, ob der Tooltip „Stunden“ enthält. Das trifft bereits nach dem vorherigen Fokussieren zu, selbst wenn kein Wochenwechsel stattfindet. Die mobile Prüfung kontrolliert nur die Gesamtbreite und übersieht die extrem schmalen Tabelleninhalte. Schreibantworten verändern zudem den folgenden `komm_list` Seitenstand nicht.  
Warum falsch: Die dokumentierten grünen Prüfungen belegen weniger als die behaupteten Bedienwege. Die ausdrückliche Kennzeichnung als Oberflächentest ist hingegen korrekt.  
Vorschlag: Geänderte Woche und Fokusposition prüfen, mobile Inhaltsbreiten kontrollieren und nach Schreibaktionen einen veränderten Seitenstand zurückliefern. Fehlerantworten und Konflikte ergänzen.

**Empfehlungen**

1. Versandaktionen optisch hinter die Zuständigkeit und die offenen Entscheidungen zurücknehmen.
2. Meldungen nach Entscheidungen für Bildschirmleser als Status oder Fehler ankündigen.
3. Testdaten um die tatsächlich gelieferten Rahmenfelder `aufgaben_gesendet` und `abgebrochen` vervollständigen.

**Prüfnachweis und Grenzen**

1. `node pruefung/komm-test.mjs`: **67 erfolgreich, 0 Fehler**.
2. `node pruefung/komm-vergleich.mjs`: **alle fünf Festivals ohne Abweichung in den verglichenen Feldern**.
3. `komm-bedienung.mjs`: Start versucht, durch **`listen EPERM`** der Sandbox blockiert. Keine neue dynamische Bedienprüfung durchgeführt.
4. Vorhandene Schirmbilder bei 390 und 1440 px, jeweils dunkel und hell, sowie Code und Datenvertrag geprüft. Navigation unter Saison und Assetsversion `?v=32` sind umgesetzt. In `kommunikation.html` wurden keine Gedankenstriche gefunden.

Produktionswirkung, Migration, Deploy und tatsächliche Bedienung mit Bildschirmleser bleiben ungeprüft. Keine Dateien geändert, keine externen Dienste aufgerufen und keine weiteren Prüfer gestartet.

**32b ist wegen der genannten Befunde noch nicht freigabefähig.**