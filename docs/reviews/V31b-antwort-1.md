# Antwort auf V31b, Runde 1 (Commit e7a35c9)

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | `site/vorhaben.html`, `#vhBallOk`: alle Werte werden vor `zu()` gelesen. Bedienprobe „Dialog schickt Ball, Name, Notiz und gesehenen Ball“ und „Karte steht danach in der Spalte Team“ gegen eine schreibende Testantwort. |
| 2 | schwer | übernommen | `AKTE_LAUF`: jede Aktenanfrage bekommt eine laufende Nummer, nur die jüngste zeichnet; `feldSpeichern` schreibt nur in die Akte desselben Vorhabens zurück. |
| 3 | mittel | teilweise | Der Knopf ist bestellt: `docs/PAKET-V31-VORHABEN.md`, Abschnitt „Zuordnung“: „Die Akte zeigt verknüpfte Einträge mit einem Knopf „Zuordnung lösen“ (`vorhaben_verknuepfen` mit null), damit Fehltreffer schnell weg sind.“ Deshalb ohne Rückfrage. Übernommen ist die Wiederherstellung: nach dem Lösen steht „Zuordnung gelöst: <Titel> · Rückgängig“ in der Akte. |
| 4 | mittel | übernommen | Unter 761 px wird nur noch `#vhEinwurf` ausgeblendet (der feste Knopf ersetzt ihn), „Übergeben“ bleibt im Kopf. |
| 5 | mittel | übernommen | Name ist bei Team und extern Pflicht, Fehlermeldung am Feld (`aria-invalid`, `aria-describedby`). Bedienprobe „Team ohne Namen wird nicht gesendet, das Feld meldet sich“. |
| 6 | mittel | übernommen | Ohne `gf_vh_seen_<Person>` gelten die letzten 24 Stunden; der Zeitpunkt steht über der Liste. Gesetzt wird der Wert mit „Alles gesehen“ auf Für dich (31d), so wie das Paket es dort festlegt. |
| 7 | mittel | übernommen | Neue Bedienproben für den ganzen Dialogweg mit zustandsändernder Testantwort `vorhaben_save` (409 bei veraltetem Ball), Konflikt, Tastatur. 22 Proben im Abschnitt Vorhaben, alle in Ordnung. |
| 8 | leicht | teilweise | Der Beleg hängt mit Absicht am Inhalt (`stand`, siehe Kommentar in `pruefung/abnahme.sh`: „Der Beleg haengt am Inhalt der geprueften Dateien, nicht am Commit“). Sein Feld `commit` nennt den Start-Commit des Laufs; der Lauf vor diesem Commit hat den Beleg neu geschrieben. Das steht jetzt im Technikstand. |

Empfehlungen: 1 teilweise (Board-Knopf und Team/Extern in der Akte nutzen denselben Dialog; Alex, Lea, GF und niemand gehen in der Akte mit einem Tipp, weil das der häufigste Fall ist). 2 übernommen über die Meldung des Backends „Der Ball liegt inzwischen bei …, bitte neu laden“, danach lädt die Seite neu. 3 übernommen (leere Auswahl nennt den Filter). 4 übernommen. 5 teilweise (Tastaturprobe für das Öffnen per Enter; die mobile Übergabe kommt mit 31d).
