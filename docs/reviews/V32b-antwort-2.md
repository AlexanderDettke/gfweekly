# Antwort auf Review V32b, Runde 2 (Codex, Commit 6819295)

Alle vier Befunde bestätigt und behoben.

1. **schwer, Entwürfe überschreiben neuere Entscheidungen.** Ein Entwurf hält beim Öffnen seinen Ausgangsstand fest (Stufe, Extras, Notiz, Zeitpunkt der letzten Entscheidung); Nachladen ändert ihn nicht. Gespeichert wird mit `expect_stufe`, `expect_extras`, `expect_notiz` und `expect_am`. `komm_pruefpunkt_set` vergleicht Notiz und Entscheidungszeitpunkt unter der Festivalsperre (alle Schreibwege auf `komm_pruefpunkte` laufen unter ihr), Stufe und Extras zusätzlich in der Transaktion; Abweichung 409. Aktionsprobe 66 ok.
2. **mittel, „Gespeichert“ nach Ablehnung.** `neuLaden(erfolg)` meldet nur einen übergebenen Erfolgssatz einer bestätigten Schreibaktion. Scheitert das Neuladen, ist der Stand dauerhaft als veraltet markiert (Hinweis mit „Neu laden“), und Entscheidungen, Versand und Formulare sind bis zum erfolgreichen Neuladen gesperrt. Die Meldung nach einer Ablehnung nennt dann den veralteten Stand statt „aktueller Stand“.
3. **mittel, Fokus im Konflikt.** Meldungen stehen in einer sichtbaren Statuszeile (zusätzlich angekündigt); bei Konflikten und Fehlern springt der Fokus auf diese Zeile.
4. **mittel, Folgestand der Testdaten.** Versand setzt den Rahmenstatus, Speichern und Freigabe führen die Entscheidungsliste wie `komm_list`. Die Probe prüft den Fehlerstatus vor dem Versand, „gesendet“ danach, das Verschwinden der Budgetentscheidung nach der Freigabe und den Konflikt eines Entwurfs gegen eine fremde Entscheidung. Bedienprobe 52 ok.

Empfehlungen: Statuszeile umgesetzt; Rückkehr des Fokus zum auslösenden Knopf des Festivals; Technikstand mit den aktuellen Zahlen.
