# Antwort auf Review V32c, Runde 1 (Codex, Commit dada236)

Alle fünf Befunde bestätigt und behoben, je mit dauerhafter Probe in `pruefung/komm-aktionen-probe.ts` Abschnitt 13 (78 ok).

1. **schwer, unterbrochener Projektwechsel.** Jede gemerkte Aufgabe wird gegen das Zielprojekt geprüft (Kennungen der Aufgaben im Projekt), unabhängig vom letzten Projektprotokoll; fehlt sie, kommt sie mit `addProject` in den Monatsabschnitt. Probe: erste Übernahme scheitert, zweiter Aufruf holt sie nach.
2. **schwer, Fortsetzung ohne Fortschritt.** Neue Tabelle `komm_versandlauf` (Migration `20261007073224_hh_komm_v32c.sql`): ein Versand merkt sich die bearbeiteten Aufgaben und setzt beim nächsten Aufruf bei der nächsten unbearbeiteten fort; ein abgeschlossener oder einen Tag alter Lauf beginnt neu. Jeder Aufruf bearbeitet mindestens eine Aufgabe. Die Seite meldet nach acht Teilen ohne Abschluss ausdrücklich „Versand unvollständig“. Probe: wiederholt knappes Budget, jeder Aufruf kommt voran, kein Wiederholen, vollständig ohne Dubletten.
3. **schwer, abgelaufene Sperre.** Jede Asana-Anfrage hat eine Zeitgrenze von 20 Sekunden; vor jeder Änderung prüft und verlängert der Lauf seine Sperre (`hh_komm_sperre_halten`), auch vor Projekt- und Abschnittsanlage; nach jeder Änderung noch einmal, und eine eigene Neuanlage wird zurückgenommen, wenn die Sperre inzwischen verloren ist. Eine Anlage mit unklarem Ausgang (Zeitgrenze) wird vor einem neuen Versuch im Projekt nachgesehen. Probe: erzwungener Ablauf während einer hängenden Anlage, keine Dubletten.
4. **mittel, Aufräumen.** Bleibt eine Aufgabe stehen, bleibt auch das Testprojekt; der nächste Aufruf räumt fertig auf. Probe.
5. **mittel, Ratenlimit.** Die verlangte Wartezeit wird eingehalten, wenn sie ins Zeitbudget passt; sonst unterbricht der Lauf geordnet mit `unterbrochen` und `fortsetzen_ab`. Probe mit 120 Sekunden.

Empfehlungen: Fehlerfälle als Proben aufgenommen; Versandbericht mit `lauf` und `im_lauf_erledigt`; Technikstand mit aktueller Zahl.
