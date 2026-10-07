Geprüft: 32e, Commit 0ab5bad8a89fddfdc24df492b5681a7572f3269a, 28 Dateien

1. [mittel] Abgelaufene Hinweissperre erlaubt weiterhin doppelte Zustellung  
Fundstelle: `supabase/functions/gfweekly/komm.ts:858`, zusätzlich Zeile 865  
Was passiert: Die Sperre gilt 120 Sekunden. Die anschließende Schleife hat weder ein Gesamtzeitbudget noch eine Verlängerung oder Prüfung des Sperreigentümers. Bei mehreren langsamen Anfragen kann ein zweiter Tick die abgelaufene Sperre übernehmen, während der erste weiterarbeitet. Lokal mit gezielt abgelaufener Sperre reproduziert: zwei Kommentare für denselben Beitrag.  
Warum falsch: Die in Abschnitt 32e des Technikstands zugesagte Entdopplung gilt weiterhin nicht für alle gleichzeitigen Läufe. Befund 2 aus Runde 1 ist für kurze Läufe behoben, insgesamt aber nur teilweise.  
Vorschlag: Die vorhandene Funktion `hh_komm_sperre_halten` vor weiteren Zustellungen verwenden, den Abschnitt zeitlich begrenzen und bei verlorener Sperre abbrechen. Den Protokollstand nach Sperrerwerb weiterhin frisch lesen.

2. [mittel] Unklarer Versand und Protokollfehler führen zu erneuten Kommentaren  
Fundstelle: `supabase/functions/gfweekly/komm.ts:869`, zusätzlich Zeilen 870 bis 873  
Was passiert: Hat Asana den Kommentar angelegt, aber die Antwort geht verloren, wird der Versuch als offen behandelt und erneut versendet. Dasselbe geschieht nach bestätigtem Versand, wenn `komm_hinweis` nicht gespeichert werden kann. Beide Varianten lokal reproduziert: jeweils zwei Kommentare nach zwei Ticks.  
Warum falsch: Die neue Wiederholung behebt ausgebliebene Zustellungen, unterscheidet aber nicht zwischen sicher gescheitertem und möglicherweise bereits ausgeführtem Versand. Die dokumentierte einmalige Zustellung bleibt dadurch unzuverlässig.  
Vorschlag: Hinweise mit einer stabilen Kennung versehen und bei unklarem Ausgang vorhandene Kommentare abgleichen. Bestätigte Zustellungen mit fehlgeschlagenem Protokoll gesondert behandeln und vor erneutem Versand abgleichen.

**Empfehlungen**

1. Abschnitt 14 um Sperrablauf, verlorene Versandantwort und fehlgeschlagenes Protokollschreiben ergänzen.
2. Fehlende Aufgabenkennung und Fehler beim Lesen des Hinweisprotokolls ausdrücklich testen.
3. Die Authentifizierung künftig über den tatsächlichen Request Handler prüfen. Die vorhandene Probe prüft Schlüsselvergleich und Aktionsaufruf getrennt.

**Runde 1 und Sicherheitsprüfung**

Befund 1 aus Runde 1 ist für eindeutig fehlgeschlagene Zustellungen behoben. Abschnitt 14 bestätigt Wiederholung nach 503 sowie genau einen Kommentar bei kurzen gleichzeitigen Läufen.

Die Begrenzung durch `ANBINDUNG_SCHLUESSEL` ist im Code korrekt: Vor der Passwortprüfung sind ausschließlich die drei ausdrücklich erlaubten Aktionen erreichbar. Ein fehlendes oder leeres Secret öffnet keinen Zugang.

Die Slotantworten geben keine Besetzungsdaten, Hausprotokolle, Partneradressen, Freigabenamen oder Freigabenotizen aus. Partnername und Abgabeadresse bleiben ausdrücklich enthalten. Die Probe mit vorbelegten internen Freigabedaten besteht.

Die Feldhoheit ist dokumentiert und im geprüften Hauscode eingehalten. Die einzige ausdrückliche Änderung eines Freigabefelds ist der Rückfall im Tick. Das Update prüft Übernahme und offenen Freigabestatus erneut. Die Fristen von 14, 10, 7 und 3 Tagen sind umgesetzt.

Die relevanten Korrekturen aus 32a und 32b bestehen fort, insbesondere Schutz gesendeter Beiträge, gemeinsame Festivalsperren und Konfliktprüfung von Prüfpunktentscheidungen.

**Prüfnachweis und Grenzen**

1. `komm-test.mjs`: **70 erfolgreich, 0 Fehler**.
2. `komm-aktionen-probe.ts`: **95 erfolgreich, 0 Fehler**, einschließlich Abschnitten 11 und 14.
3. `komm-sql-probe.mjs`: **30 erfolgreich, 0 Fehler**.
4. `komm-vergleich.mjs`: alle fünf Festivals ohne Abweichung.
5. Die drei zusätzlichen Fehlerfälle wurden ausschließlich im Arbeitsspeicher reproduziert.

Livewirkung, effektive Produktionsrechte und die angegebenen 89 offenen Slots am 07.10.2026 wurden nicht unabhängig geprüft. Keine Dateien geändert, keine externen Dienste aufgerufen, keine weiteren Prüfer gestartet.

**32e ist wegen der beiden Befunde noch nicht vollständig freigabefähig.**