# Antwort auf Review V32e, Runde 1 (Codex, Commit e3fec73)

Beide Befunde bestätigt und behoben, Proben in `pruefung/komm-aktionen-probe.ts` Abschnitt 14 (88 ok).

1. **mittel, fehlgeschlagene Hinweise gelten als gemeldet.** `komm_hinweis` entsteht nur nach bestätigter Zustellung in Asana; ein Fehler oder eine fehlende Aufgabe wird als `komm_hinweis_offen` protokolliert und beim nächsten Tick erneut versucht. Die Seite zeigt beide.
2. **mittel, gleichzeitige Ticks.** Der Hinweisabschnitt läuft unter einer eigenen Sperre (`hinweise`); das Protokoll wird darin gelesen, Lesefehler brechen den Abschnitt ab. Probe: zwei gleichzeitige Ticks, genau ein Kommentar.

Empfehlungen: Probe mit vorbelegtem Freigabenamen, Freigabenotiz und Partner-E-Mail (keines davon in `komm_slot_details`); Zustellfehler und fehlende Aufgabe als Proben. Die Prüfung des Schlüssels über den echten Request-Handler bleibt eine Lücke der lokalen Probe (`index.ts` startet beim Import den Server); live geprüft wird sie über den Hub (WP-81).
