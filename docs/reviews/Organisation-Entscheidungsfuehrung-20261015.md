# Organisationsentwicklung: Entscheidungsführung

Stand 15.10.2026. Auftrag von Alexander: Die technische Doppelfreigabe im Hohen Haus an seine Entscheidungsführung anpassen. Lea wird gezielt einbezogen; ihre Rückmeldung begründet keine allgemeine Freigabepflicht oder Wartezeit.

## Änderung

1. Datenbankfunktion `hh_org_freigabe`: Alex setzt die wirksame Freigabe und nimmt sie zurück. Lea kann ihre optionale Zustimmung festhalten oder zurücknehmen; das verändert die Freigabe nicht.
2. Oberfläche: keine Aufgabe „Deine Freigabe fehlt“ für Lea, keine Anzeige „Lea fehlt“, keine Pflicht zu beiden Freigaben. Die optionale Rückmeldung ist eindeutig beschriftet. Neue Einträge im Entscheidungslog nennen Alex als Entscheider und Verantwortlichen.
3. Migration `20261015040502_hh_org_alexander_entscheidungsfuehrung` auf Projekt `bnfmupnmqyrcltrphfak` angewendet. Bereits vorhandene Freigaben von Alex für die Entscheidungen 1, 2 und 5 sind wirksam, Leas Werte bleiben unverändert false. Fünf weitere Entscheidungen bleiben offen. Aktivierung separat im Organisationsverlauf protokolliert; keine erfundenen gemeinsamen Beschlüsse oder Punktevergaben.
4. Rollenabhängigkeiten bleiben bestehen. Die Edge Function prüft `freigegeben_am` und braucht keine neue Bereitstellung. Mit den vorhandenen Entscheidungen sind Geschäftsführung, Daten und Systeme, Kaufmännische Leitung und Studio für neue Formate startklar. Die Migration setzt keine Rollen als begonnen oder erledigt.
5. Die Regel gilt für den Bereich Organisation. Bestehende Anmeldung, Passwortprüfung und sonstige fachliche oder rechtliche Zuständigkeiten werden nicht erweitert.

## Belege

1. Datenbankprobe vor und nach der Migration in einer Transaktion mit vollständiger Rücksetzung bestanden. Geprüft: Alex allein, Lea allein ohne Freigabewirkung, Rücknahme durch Lea ohne Sperre, Rücknahme durch Alex, wiederholte Freigabe, veraltete Wahl, veraltete Revision, Schutz einer freigegebenen Wahl, Rücksetzen bei geänderter Wahl und Funktionsrechte. Testzeile 50 ist entfernt. Skript: `pruefung/organisation-entscheidungsfuehrung.sql`.
2. Authentifizierter lesender Aufruf der produktiven Edge Function: HTTP 200, Entscheidungen 1, 2 und 5 wirksam bei `lea_frei=false`. Aufruf über intern verwendetes Vault Secret; kein Geheimnis im Bericht.
3. 44 gezielte Oberflächenprüfungen bestanden: 390 und 1440 Pixel, hell und dunkel, beide Personen, Freigabe, Rückmeldung, Rücknahme, Rollenfortschritt, Entscheidungslog, Seitenüberlauf und Skriptfehler. API dabei abgefangen. Dies belegt die Bedienung und gesendete Nutzlast, keine produktiven Rollenschritte.
4. Farbscan ohne Funde; Kontrastprüfung ohne Unterschreitung; 70 bestehende Kommunikationsprüfungen ohne Fehler; Referenzvergleich aller fünf Festivals ohne Abweichung. Statische Prüfungen ohne Frischeprüfung bestanden.

## Grenzen

Die globale Abnahme des gesamten Hauses ist nicht neu bestätigt. Die bisherige Datei `pruefung/letzte-abnahme.json` bleibt als historischer Beleg unverändert. Der vollständige Wächter meldet daher den veralteten Gesamtbeleg. Die externe Farbtokenquelle am früheren lokalen Pfad ist nicht vorhanden; der entsprechende vollständige Abnahmelauf kann hier nicht unverändert abgeschlossen werden. Die geänderte Entscheidungslogik ist gesondert wie oben geprüft. Styles und sonstige Fachbereiche wurden nicht verändert.

Die produktiven Rollen wurden für den Test nicht als begonnen markiert. Die tatsächliche personenspezifische Anmeldung wurde nicht neu aufgebaut; das bestehende Hauspasswort und die bestehende Personenwahl bleiben gültig.
