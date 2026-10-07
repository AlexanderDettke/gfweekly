Geprüft: 32e, Commit e3fec73231ab5881f7b4332789a15638570c254d, 28 Dateien

1. [mittel] Fehlgeschlagene Hinweise werden dauerhaft als gemeldet behandelt  
Fundstelle: `supabase/functions/gfweekly/komm.ts:731`, zusätzlich Zeile 740  
Was passiert: Auch nach einem Asana Fehler oder bei fehlender Aufgabenkennung entsteht `komm_hinweis` mit `asana: false`. Folgende Ticks überspringen diesen Beitrag trotzdem. Lokal reproduziert: Asana antwortet mit 503, der nächste Tick stellt keinen Hinweis zu.  
Warum falsch: Der nach Paket 32e erforderliche Hinweis drei Tage vor T erreicht die verantwortliche Person nicht. Ein fehlgeschlagener Versuch ersetzt die Zustellung.  
Vorschlag: Nur bestätigte Zustellungen entdoppeln. Fehlgeschlagene oder mangels Ziel nicht ausgeführte Hinweise erneut versuchen und ihren offenen Zustand kenntlich halten.

2. [mittel] Gleichzeitige Ticks verschicken den Hinweis doppelt  
Fundstelle: `supabase/functions/gfweekly/komm.ts:731`, zusätzlich Zeilen 733 bis 740  
Was passiert: Protokollprüfung, Versand und Protokolleintrag sind getrennt und ungesperrt. Zwei Ticks können beide denselben Beitrag als ungemeldet lesen. Lokal mit verzögerter Asana Antwort reproduziert: zwei Kommentare für denselben Beitrag.  
Warum falsch: Die dokumentierte Entdopplung je Beitrag gilt nur bei nacheinander ausgeführten Läufen. Die Festivalsperren der Neuberechnung schützen diesen späteren Abschnitt nicht.  
Vorschlag: Den Hinweisabschnitt gemeinsam sperren und das Protokoll innerhalb der Sperre erneut prüfen. Fehler beim Lesen und Schreiben des Protokolls ausdrücklich behandeln.

**Empfehlungen**

1. Abschnitt 11 um Zustellfehler, fehlende Aufgabenkennungen, Protokollfehler und gleichzeitige Ticks ergänzen.
2. Die Authentifizierung über den tatsächlichen Request Handler prüfen. Aktuell testet Abschnitt 11 die Schlüsselvergleichsfunktion separat und ruft anschließend `handle` direkt auf.
3. Für die Vertraulichkeitsprobe Hausdaten wie `freigabe_von`, `freigabe_notiz` und E-Mail-Adressen gezielt vorbelegen und deren Ausschluss prüfen. Die aktuelle Probe untersucht einen Slot mit unbefüllten Partnerfeldern.

**Prüfnachweis und Grenzen**

1. `komm-test.mjs`: **67 erfolgreich, 0 Fehler**.
2. `komm-aktionen-probe.ts`: **66 erfolgreich, 0 Fehler**, einschließlich Abschnitt 11.
3. `komm-sql-probe.mjs`: **30 erfolgreich, 0 Fehler**.
4. `komm-vergleich.mjs`: alle fünf Festivals ohne Abweichung in den verglichenen Feldern.
5. Beide Befunde durch zusätzliche Proben ausschließlich im Arbeitsspeicher reproduziert.

Die Schlüsselabsicherung ist im Code korrekt eingegrenzt: Vor der Passwortprüfung sind ausschließlich die drei aufgelisteten Aktionen mit gültigem `ANBINDUNG_SCHLUESSEL` erreichbar. Fehlendes oder leeres Secret öffnet keinen Zugang.

Die Ausgaben enthalten keine Besetzungsdaten, Hausprotokolle, Freigabenamen oder Freigabenotizen. Partnername und Abgabeadresse werden ausdrücklich ausgegeben. Die Feldhoheit ist dokumentiert und im geprüften Hauscode eingehalten. Einzige explizite Änderung eines Freigabefelds ist der bedingte Rückfall im Tick. Dessen Update prüft Übernahme und offenen Freigabestatus erneut.

Die früheren Korrekturen aus 32a und 32b sind in den relevanten Codewegen nachvollziehbar erhalten. Die lokalen Proben bestätigen insbesondere geschützte Veröffentlichungen, Konfliktprüfung, Versandsperren, Projektwiederverwendung und Schutz fremder Tabelleninhalte.

Livewirkung, effektive Produktionsrechte und die angegebenen **89 offenen Slots am 07.10.2026** wurden nicht unabhängig geprüft. Keine Dateien geändert, keine Netzwerkdienste aufgerufen, keine weiteren Prüfer gestartet.

**32e ist wegen der beiden Befunde noch nicht vollständig freigabefähig.**