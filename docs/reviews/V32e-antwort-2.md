# Antwort auf Review V32e, Runde 2 (Codex, Commit 0ab5bad)

Beide Befunde bestätigt und behoben, Probe in `pruefung/komm-aktionen-probe.ts` Abschnitt 17 (110 ok).

1. **mittel, abgelaufene Hinweissperre.** Vor jeder Zustellung prüft und verlängert der Tick die Sperre (`hh_komm_sperre_halten`), bei Verlust hört er auf; der Abschnitt hat ein Zeitbudget von 60 Sekunden, der Rest folgt im nächsten Tick.
2. **mittel, unklarer Versand und Protokollfehler.** Jeder Hinweis trägt eine stabile Marke `[komm:hinweis:<id>]`; vor jedem Senden liest der Tick die Kommentare der Aufgabe und sendet nicht, wenn die Marke schon da ist (verlorene Antwort, fehlendes Protokoll). Probe: verlorene Antwort, zwei Ticks, genau ein Kommentar.

Empfehlung 3 (Schlüssel über den echten Request-Handler) bleibt eine Lücke der lokalen Probe; live geprüft wird der Weg mit dem Hub (WP-81).
