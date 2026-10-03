# Lernlog V31 · was Codex gefunden hat, das die eigenen Prüfungen übersehen haben

Stand 03.10.2026. Je Fund: was durchgerutscht ist, warum die eigene Prüfung es nicht sah, welche Regel folgt. Ist die Regel
mechanisch prüfbar, steht sie in `pruefung/waechter.mjs` (Spalte „Wächter“).

| Fund (Runde) | Warum die eigene Prüfung es nicht sah | Regel | Wächter |
|---|---|---|---|
| Einwurf übernehmen, Punkt abhaken und Vorschlag bestätigen liefen in mehreren Aufrufen; ein Fehler dazwischen hinterließ halbe Zustände (31a/1) | Die Wirkungsprobe prüfte nur den Erfolgsweg; ein Fehler mitten im Ablauf lässt sich von außen nicht auslösen | Jeder Schreibweg mit mehr als einer Tabelle oder Zeile ist eine Datenbankfunktion mit Transaktion; die Edge Function prüft nur Eingaben | nein (Absicht, nicht Muster) |
| Ein Konflikt mit SQLSTATE 40001 lief bis zum Timeout (eigene Probe, vor Codex) | PostgREST wiederholt 40001 von sich aus; das steht in keiner Fehlermeldung | Eigene Konflikte melden `PT409` (wird HTTP 409) | ja, `konfliktcode` |
| Negativproben zählten den HTTP-Status, nicht den Grund (31a/1) | Ein 400 aus einem ganz anderen Grund hätte die Probe bestanden | Erwartete Fehler prüfen Status und Grund (`abgelehnt(…, /Grund/)`) | ja, `negativproben` |
| Gleichzeitige Änderungen: Ball, Ballname, Punktfelder, Stand, Korbzeile, Zuordnung, KI-Vorschlag (31a/1 bis 31b/3, 31d/1) | Die Proben liefen mit einer Person nacheinander; Gleichzeitigkeit war nur beim Ball bedacht | Jede Änderung schickt den gesehenen Wert mit (`expect`, `expect_ball`, `expect_vorhaben_id`, `revision`), die Datenbank vergleicht unter Zeilensperre; nur geänderte Felder senden | nein (fachlich je Feld) |
| Vertraulichkeit nur im Prompt, dann nur in der KI-Antwort, dann nicht für Fremdvorschläge des Abgleichs (31a/1 bis 31a/3) | Geprüft wurde der eigene Weg (KI über die Edge Function), nicht jeder Weg in die Akte | Geprüft wird an der Grenze, an der geschrieben wird (Datenbank), für jede Quelle; Filter in Edge Function und Datenbank gleich halten | ja, `vertraulichGleich` |
| Der Dialog „Ball weitergeben“ las die Notiz nach dem Leeren und speicherte nie (31b/1) | Die Oberflächentests beantworteten Schreibaktionen pauschal mit Erfolg und prüften nur die Nutzlast eines anderen Wegs | Für Schreibwege eine Testantwort, die wirklich schreibt (`vorhaben_save` in den Testdaten), und den ganzen Weg bis zum sichtbaren Ergebnis prüfen | nein |
| Die Probe räumte nicht vollständig auf (Einwürfe an echten Vorhaben, Ticker im echten Laufband) (31a/1, 31a/2) | Aufräumen war nach Status geprüft („archiviert“), nicht nach allen erzeugten Zeilen | Testdaten tragen eine Laufkennung (`probe:v31:<lauf>`), aufgeräumt wird nur über sie; Nebenwirkungen (Ticker) gehören zum Aufräumen | nein |
| Bestätigte Korbzeilen wären vom Urlaubsdialog erneut gesetzt worden (31d/1) | Die Testdaten hatten keine bestätigte Vorhaben-Zeile | Testdaten enthalten jeden Zustand, den die Seite unterscheidet (Vorschlag und bestätigt) | nein |
| Abnahmebeleg nannte einen älteren Commit (31b/1, 31c/1, 31d/1) | Gewollt: der Beleg hängt am Inhalt (`stand`); der Commit ist der Startpunkt des Laufs | Im Technikstand steht, woran der Beleg hängt; vor jedem Commit läuft die Abnahme neu | schon da, `frische` |

Was ohne Codex gefunden wurde und gehalten hat: die Wirkungsprobe fand den 40001-Timeout, das Live-Durchspiel zeigte,
dass eine Vorhaben-Zeile mit Frist vor der Abreise „vor Abreise“ steht und auf der Übergabeseite erst eine Ampel braucht, bevor
eine Vertretung greift (der Übergabe-Dialog setzt sie selbst), und bei der Nacharbeit fiel auf, dass `vorhaben_seit` die
Einträge des eigenen Abgleichs (`abgleich-alex`) ausblendete.
