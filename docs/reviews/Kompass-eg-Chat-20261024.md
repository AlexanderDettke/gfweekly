# Allgemeine Chaterkenntnisse im Vorstandsbüro

Die vorhandenen eG Vorgänge erhalten eine eigene Quellenart Chat. Eine allgemeine Erkenntnis lässt sich mit Originalchat, Beitrag oder kurzem Belegauszug, Ereignisdatum, Belegsicherheit, Bedeutung für den Vorstand, offener Entscheidung, Empfehlung und nächstem Schritt aufnehmen und wieder öffnen. Die Einordnung bleibt von Antwortentwürfen bestehender Mailvorgänge getrennt.

Die eingefrorene Erweiterung wurde am 24.10.2026 von einem getrennten Prüfagenten unabhängig geprüft. Keine bestätigten P0, P1 oder P2 Befunde. Alexander hat die konkrete Vorschau angenommen und Veröffentlichung, Übertragung der 14 vorbereiteten Übergaben und einen täglichen Versuch ausdrücklich beauftragt.

## Technischer Umfang

1. Bestehende Tabelle hh_vorstand_cases um source_kind, source_key und insight ergänzen. Der eindeutige Mailquellenlink bleibt für Mailvorgänge erhalten. Chatquellen sind je Erkenntnis eindeutig.
2. Die bestehende Funktion vorstand erweitert chat_add. Organisation mit-freude ist fest geprüft, Originalquelle wird validiert. Wiederholungen geben den bestehenden Vorgang zurück und erhalten menschliche Bearbeitung. Neue Eingaben weisen keine Zuständigkeit oder Frist zu und erzeugen keine Aufgabe.
3. Die Speicherfunktion bleibt SECURITY INVOKER. Bestehende Rollenrechte und RLS bleiben erhalten. Der bestehende gemeinsame Kompass Zugang gilt weiterhin.
4. Oberfläche ausschließlich in site/vorstand.html und assets/vorstand.js sowie assets/vorstand.css erweitern. Alternative lokale Prototypen, Daten und Testabhängigkeiten sind nicht Teil der veröffentlichten Oberfläche.

Ausgangsstand ist main a1533e0b8d7fd060be4981d8f784aaaddb578a3b. Die sieben geprüften Dateiinhalte wurden unverändert integriert. Die SQL Datei wurde zunächst regulär mit Supabase CLI 2.122.0 erzeugt und danach auf die vom Server vergebene Kennung 20261024141128 umbenannt. Die historischen Kommentare im SQL Kopf dokumentieren ihre Entstehung als lokale Probe; diese Einführung ist durch den aktuellen Auftrag freigegeben.

Schema und Funktion vorstand Version 4 sind vor der Oberfläche veröffentlicht und zurückgelesen. Alle vier Funktionsdateien stimmen mit der geprüften Fassung überein.

## Prüfbelege

Unabhängig bestanden: 25 Verarbeitungstests, 118 Browserprüfpunkte, 41 zusätzliche Prüfungen und 17 weitere Prüfpunkte zu eingebetteten Texten und Links. Desktop und schmale Ansicht wurden eigenständig betrachtet. Diese Browserprüfungen verwenden lokale synthetische Daten.

Produktiv geprüft: Alle 18 vorhandenen eG Vorgänge behielten ihre bisherigen Felder und Revisionen. Ein Aufruf ohne Kompass Zugang erhält HTTP 401. Eine zusätzlich auf dem echten PostgreSQL ausgeführte Transaktionsprobe bestand neun Kontrollen: direkte Rollenrechte, SECURITY INVOKER, gültige Anlage, Speichern, alte Revision, unveränderliche Herkunft, doppelte Quelle, Erhalt menschlicher Bearbeitung und vollständige Rücksetzung der Testdaten.

Bestehende Sicherheitsdiagnose meldet für Fälle und Log weiterhin RLS ohne öffentliche Richtlinien. Das entspricht dem bestehenden ausschließlich privilegierten Zugriff über die geschützte Funktion; neue öffentliche Rechte wurden nicht eingerichtet.

Der tatsächliche gemeinsame Nutzertest durch Lea oder Alexander, Wirkung und erste unbeaufsichtigte Ausführung sind eigene spätere Nachweise. Der formale Werkstatt Prüfer wurde ausgeführt; das eigenständige Kompass Vorstandsbüro liegt außerhalb seiner sieben fest registrierten Werkstätten. Es wurde kein anderes Firmenprojekt als Veröffentlichungsziel eingesetzt und der Prüfer wurde nicht geändert.

## Betrieb

Bei falscher Gesellschaft, Dublette, fehlender Herkunft oder überschriebenen menschlichen Angaben neue Übernahmen stoppen und Daten erhalten. Fehler gezielt auf dem aktuellen Quellstand korrigieren. Die Inhaltsübernahme bleibt minimal, idempotent und nach Gesellschaft getrennt. Eine technische Veröffentlichung allein setzt keinen täglichen Lauf in Gang.

