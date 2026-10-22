# Vorstandsbüro im Kompass

Stand 22.10.2026. Auftrag: eigener Bereich unter Arbeiten und eine Karte auf Für dich für den Vorstand der mit Freude eG.

Die Seite `site/vorstand.html` verwendet die vorhandene Navigation, Farben und den geschützten Kompass Zugang. Die eigene Edge Function `vorstand` prüft denselben Serverzugang wie die bestehenden Kompass Funktionen. Die gemeinsame Datenhaltung liegt ausschließlich in `hh_vorstand_cases` und `hh_vorstand_log`. Beide Tabellen haben RLS und keine öffentlichen Lese oder Schreibrechte. Der Funktionszugriff erfolgt auf dem Server. Die Personenauswahl entspricht dem bestehenden Kompass Modell Alex oder Lea; sie ist keine neue persönliche Anmeldung.

## Gemeinsame Bearbeitung

Jeder Vorgang hat Originalquelle, Ausgangsbefund, nächste Aktion, Verantwortlichkeit, Bearbeitungsstand, optionale Frist und Erledigungsnachweis. Speichern erfolgt gegen die gelesene Revision. Eine zwischenzeitliche Änderung liefert einen Konflikt, der vorhandene Eingaben erhält. Die Seite liest den gemeinsamen Stand bei Rückkehr und im sichtbaren Fenster regelmäßig neu. Das ist keine Hintergrundüberwachung des Mailpostfachs.

Die 17 Vorgänge aus der Quellenprüfung vom 22.10.2026 werden einmalig in den geschützten Speicher übernommen. Personenbezogene Inhalte und Adressen stehen nicht in den öffentlich ausgelieferten Dateien oder im Quellrepository. Neue Post wird über Google Groups geprüft und bei Bedarf als Vorgang aufgenommen. Die vorhandenen Kennzeichnungen in Google Groups werden durch Kompass Änderungen nicht automatisch geändert.

## Antwortentwürfe

Antwortadresse, Betreff und Text werden gemeinsam gespeichert. Ein neutraler Formulierungsvorschlag kann eingesetzt und bearbeitet werden. Antworten können mit dem kopierten Entwurf im Originalverlauf oder über das Mailprogramm mit Kopie an die Vorstandsadresse vorbereitet werden. Das Öffnen des Mailprogramms und ein gespeicherter Entwurf belegen keinen Versand.

Die vorhandene Google Verbindung hat nach lesender Prüfung Kalender und Drive Rechte, keine Gmail Schreibrechte. Deshalb erstellt dieser Einbau keinen Gmail Entwurf über eine zusätzliche Kontofreigabe. Die gemeinsam gespeicherten Entwürfe sind im Kompass verfügbar.

## Asana Aufgaben

Die Aufgabe wird nach ausdrücklichem Klick auf In Asana anlegen im persönlichen Aufgabenbereich der ausgewählten Person angelegt. Alex und Lea werden als Beteiligte gesetzt. Personenkennungen werden anhand der vorhandenen E Mail Zuordnung auf dem Server aufgelöst. Titel, Beschreibung, Originalquelle, Kompass Vorgang und eine gewählte Frist werden übertragen.

Vor dem externen Aufruf reserviert eine Datenbanktransaktion den Auftrag. Ein zweiter Klick erhält den vorhandenen Beleg oder einen Hinweis auf den ungeklärten Auftrag. Bei einem unklaren externen Ausgang wird nicht automatisch erneut angelegt. Der Abgleich kann einen bereits angelegten Vorgang anhand seiner eindeutigen Quellenkennung wiederfinden. Ein vorhandener Aufgabenlink wird erst nach bestätigter Asana Antwort gespeichert. Die in Asana gemeldete Erledigung schließt den Mailvorgang nicht automatisch ab.

## Prüfungen und Grenzen

`pruefung/vorstand-handler.test.mjs` prüft neun Aktions und Fehlerfälle mit einem Testanschluss. Die Datenbankprobe prüft zusätzlich reale Revisionskonflikte, gesperrte Doppelanlage und fehlende Erledigungsbelege in einer zurückgerollten Transaktion. Beides ersetzt keine schreibende Wirkungsprobe im veröffentlichten Browser. Der aktuelle Prüfstand und die verbleibenden Grenzen werden im Ergebnisbericht festgehalten.

Migration: `supabase/migrations/20261022034209_vorstandsburo.sql`. Die lokale Kennung wurde nach Anlage mit dem offiziellen Werkzeug auf die vom verbundenen Migrationsdienst protokollierte Versionskennung abgeglichen.
