Geprüft: 32e, Commit 301c4e68c06ecc6b201af4b5e528fa792f7740c7, 29 Dateien

1. [mittel] Sperrablösung während des Kommentarlesens erlaubt weiterhin doppelte Hinweise  
Fundstelle: `supabase/functions/gfweekly/komm.ts:973`, ergänzend Zeilen 965 und 975 sowie 350  
Was passiert: Der Tick verlängert die Sperre vor dem Lesen der Asana Kommentare. Dieses Lesen kann bis zu 50 Seiten mit jeweils eigener Zeitgrenze umfassen. Danach sendet er ohne erneute Prüfung von Sperrbesitz oder Gesamtzeitbudget. Eine ausschließlich lokale Zusatzprobe hat während einer Abfrage über sieben Seiten die Sperre gezielt ablaufen lassen und einen zweiten Tick ausgeführt. Ergebnis: zwei Kommentare mit derselben Hinweiskennung.  
Warum falsch: Die zugesagte Entdopplung bleibt bei langsamen, paginierten Abfragen unvollständig. Befund 1 aus Runde 2 ist deshalb nur teilweise behoben.  
Vorschlag: Zeitbudget und Sperrbesitz während der Pagination und unmittelbar vor dem POST prüfen. Bei Verlust abbrechen. Ein unvollständiger Kommentarabgleich darf keinen Versand auslösen.

**Empfehlungen**

1. Abschnitt 17 um Sperrablösung während des Hinweisabgleichs ergänzen. Die dortige Sperrverlustprobe betrifft bisher ausschließlich den Tabellenabgleich.
2. Fehlgeschlagenes Hinweisprotokoll nach bestätigtem Versand und die Authentifizierung über den tatsächlichen Request Handler ausdrücklich testen.

**Bisherige Befunde und Sicherheit**

Die Wiederholung nach eindeutig gescheiterter Zustellung und die Entdopplung kurzer gleichzeitiger Läufe aus Runde 1 bestehen. Die stabile Kommentarmarke behebt den geprüften Fall einer verlorenen Versandantwort aus Runde 2.

`ANBINDUNG_SCHLUESSEL` öffnet vor der Passwortprüfung ausschließlich die drei erlaubten Aktionen. Fehlendes oder leeres Secret gewährt keinen Zugang. Die Slotantworten enthalten keine Besetzungsdaten, Hausprotokolle, Partneradressen, Freigabenamen oder Freigabenotizen. Partnername und Abgabeadresse werden ausdrücklich ausgegeben.

Die Feldhoheit ist dokumentiert und im geprüften Hauscode eingehalten. Einzige ausdrückliche Änderung eines Freigabefelds ist der bedingte Rückfall im Tick. Die Fristen von 14, 10, 7 und 3 Tagen sind umgesetzt. Die relevanten Korrekturen aus 32a und 32b bestehen fort.

**Prüfnachweis und Grenzen**

1. Logikprobe: 70 erfolgreich, 0 Fehler.
2. Aktionsprobe einschließlich Abschnitten 11, 14 und 17: 110 erfolgreich, 0 Fehler.
3. SQL Probe: 31 erfolgreich, 0 Fehler.
4. Referenzvergleich: alle fünf Festivals ohne Abweichung.
5. Zusatzprobe ausschließlich im Arbeitsspeicher: doppelte Hinweise bei gezielter Sperrablösung reproduziert.

Livewirkung, effektive Produktionsrechte und die angegebenen 89 offenen Slots am 07.10.2026 wurden nicht unabhängig geprüft. Keine Dateien geändert, keine Netzwerkdienste aufgerufen, keine weiteren Prüfer gestartet.

**32e ist wegen des verbleibenden Befunds noch nicht vollständig freigabefähig.**