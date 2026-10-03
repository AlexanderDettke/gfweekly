# Antwort auf V31c, Runde 1 (Commit 833bbad)

Hinweis: `--output-last-message` hat für diese Runde keine Datei geschrieben; der Bericht stammt aus der letzten Antwort im Protokoll des Laufs.

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | mittel | übernommen | Jeder Zielwechsel setzt die Benachrichtigung auf „im Morgenbericht“, ein neuer Vorschlag bringt seinen Wert mit, ein gescheiterter nicht. Bedienung: „gescheiterter Zielwechsel: Fehler sichtbar, Benachrichtigung zurück auf Morgenbericht“. |
| 2 | mittel | übernommen | Ohne Vorschlag gilt die Wahl von Hand sofort; die KI fragt nur „Vorschlag für dieses Vorhaben holen“. Bedienung: „Wahl von Hand fragt die KI nicht erneut“. |
| 3 | mittel | übernommen | Neue Bedienproben (Oberflächentest): KI-Ausfall mit Wahl von Hand und Pflichttext, gescheiterter Zielwechsel, Konflikt beim Übernehmen, Dialog bei 390 px als Vollbild mit Fokusfalle. |
| 4 | mittel | teilweise | Der Beleg hängt am Inhalt (`stand`), nicht am Commit, siehe `pruefung/abnahme.sh`; die Abnahme lief auf diesem Stand erneut („Alle Prüfungen bestanden“). |

Empfehlungen: 1 nicht übernommen: die Reihenfolge ist schon Vorhaben, Verlaufstext, Haken (Verlauf, Punkte, neue Punkte, Ball, Schritt, Frist), Benachrichtigung. 2 übernommen (bei Konflikt wird der Einwurf neu geladen, die Meldung sagt es). 3 übernommen (`nachJedem` lädt die Seite nach jeder Entscheidung). 4 übernommen („Verlaufseintrag (Pflicht)“, wenn kein passender Vorschlag vorliegt).
