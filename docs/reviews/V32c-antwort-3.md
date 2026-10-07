# Antwort auf Review V32c, Runde 3 (Codex, Commit 0ab5bad), letzte Runde

Alle fünf Befunde bestätigt und behoben. Nach der dritten Runde keine weitere Review: **letzter Stand ohne Nachprüfung.** Proben in `pruefung/komm-aktionen-probe.ts` Abschnitt 16 (103 ok) und `pruefung/komm-sql-probe.mjs` (31 ok).

1. **schwer, unklare Anlage bei verzögerter Sichtbarkeit.** Anlagen mit unklarem Ausgang stehen je Name und Zeitpunkt im Versandlauf (`unklar`, Migration `20261007091500_hh_komm_v32e.sql`). Fehlt die Aufgabe beim nächsten Lesen noch, wird sie nicht angelegt, sondern als „Anlage ungeklärt“ gemeldet; erst nach 15 Minuten ohne Treffer gilt die Anlage als gescheitert und wird wiederholt. Taucht sie auf, wird sie übernommen.
2. **schwer, Fortschritt nicht atomar.** `hh_komm_versandlauf_speichern` prüft die Sperre mit Zeilensperre auf `komm_sperre` und schreibt den Fortschritt in derselben Transaktion; ein abgelöster Lauf bekommt `false` und schreibt nichts. Ersetzt das bisherige Prüfen und Schreiben in zwei Aufrufen.
3. **schwer, fehlender Abschnitt.** Ohne Monatsabschnitt wird keine Aufgabe dieses Monats angelegt oder übernommen; der Monat bleibt offen, der Lauf meldet „Abschnitt fehlt“ und `weiter`, beim nächsten Senden kommen die Aufgaben in den Abschnitt.
4. **mittel, Eigentum.** Bei jedem Versand wird das Projekt-Eigentum gelesen; ist es leer, wird es auf die verantwortliche Person gesetzt; ein gesetztes Eigentum bleibt, wer es auch hält. Offenes Eigentum verhindert den Abschluss.
5. **mittel, Ratenlimit im Vorlauf.** Kein Vorlauf-Fehler verschluckt 429 mehr; die Hülle des Versands speichert `fortsetzen_ab` unter der Sperre und antwortet mit `weiter`; der nächste Aufruf stellt vorher keine Anfrage an Asana.

Empfehlungen: Abschluss hängt jetzt auch an Abschnitten und Eigentum; der Live-Test wird mit diesem Stand wiederholt und sein Commit im Technikstand genannt.
