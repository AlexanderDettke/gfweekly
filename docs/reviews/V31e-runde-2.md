Geprüft: 31e, Commit 85e3a84, 17 Dateien.

1. [mittel] Standvorschlag kann bestätigt werden, ohne den vorgeschlagenen Stand zu speichern  
Fundstelle: `site/vorhaben.html:396`  
Was passiert: Die Oberfläche liest den neuen Stand aus dem Freitext nach „jetzt so steht:“. Fehlt diese Formulierung, wird der bisherige Stand ins Formular gesetzt. Beim Speichern kann der Vorschlag trotzdem als bestätigt gelten.  
Warum falsch: Die Antwort auf Befund 1 aus Runde 1 verspricht, dass die Übernahme den neuen Punktstand schreibt. Ein bestätigter Verlaufseintrag kann weiterhin einer unveränderten Akte gegenüberstehen.  
Vorschlag: Zielpunkt und neuen Stand strukturiert im Vorschlag speichern. Ohne gültigen neuen Stand keine Übernahme anbieten.

2. [mittel] Punktänderung und Bestätigung sind nicht atomar  
Fundstelle: `site/vorhaben.html:429`  
Was passiert: `punkt_save` und `verlauf_status` sind zwei getrennte Aufrufe. Scheitert der zweite, ist der Punkt geändert, der Vorschlag bleibt offen. Ein erneuter Versuch zeigt dann unter Umständen keine Feldänderung und bestätigt ihn ebenfalls nicht.  
Warum falsch: Die Antwort auf Befund 1 beschreibt „Speichern schreibt ihn mit `expect` und bestätigt den Vorschlag“ als einen Bedienweg. Bei einem Fehler zwischen beiden Aufrufen bleibt dieser Weg stecken.  
Vorschlag: Eine Datenbankfunktion soll den gesehenen Punktstand prüfen, den neuen Stand schreiben und den Vorschlag in derselben Transaktion bestätigen.

3. [mittel] Die Korrekturen für den laufenden Abgleich sind noch nicht aktiv  
Fundstelle: `docs/ABGLEICH-VORHABEN.md:3`  
Was passiert: Das Dokument sagt ausdrücklich, dass der eingerichtete Cowork Auftrag noch den alten Text hat. Damit gelten der Ausschluss der Einwurfadresse, die eigene Suche für XCeed Berichte und der Aufruf von `hh_vorhaben_quelle` für diesen Auftrag noch nicht.  
Warum falsch: Die Antworten auf die Befunde 2, 3 und 5 aus Runde 1 sind am neuen Auftragstext belegt, aber noch nicht am eingerichteten Lauf. Insbesondere kann der bisherige Lauf weiterhin Einwurfmails zusätzlich als normalen Mailverlauf erfassen und Quellenstände durch vollständiges Zurückschreiben verlieren.  
Vorschlag: Den eingerichteten Auftrag auf den dokumentierten Text umstellen und danach einen Lauf samt Einwurf, XCeed Bericht und Quellenstand prüfen. Bis dahin diese Befunde als vorbereitet, nicht als behoben führen.

4. [mittel] XCeed Berichte können auch mit dem neuen Text doppelt erscheinen  
Fundstelle: `docs/ABGLEICH-VORHABEN.md:35`  
Was passiert: Quelle C liest normale eingegangene Mails, Quelle C2 zusätzlich Mails an `alex+xceed@wildemoehre.org`. Ein Bericht ohne Gmail Kategorie „Werbung“ oder „Soziales“ passt auf beide Suchen. Die vorgesehenen `source_ref` unterscheiden sich durch `mail:` und `xceed:`.  
Warum falsch: Abschnitt 31e soll Berichte verlässlich in den Abgleich bringen; zwei bestätigte Verlaufseinträge für dieselbe Mail verfälschen die Akte.  
Vorschlag: Die XCeed Adresse auch aus C ausschließen und ausschließlich in C2 verarbeiten.

5. [mittel] Arbeitsstand und Verweis auf offene Fragen stimmen nicht mit V31 überein  
Fundstelle: `FRAGEN_FUER_MORGEN.md:1`  
Was passiert: Die Datei trägt weiter den Stand vom 22.09.2026 und enthält die in der Antwort auf Befund 2 angekündigte Umstellung des Cowork Auftrags nicht. `ARBEITSSTAND.md:1` und `README.md:3` beschreiben ebenfalls noch V24 als aktuellen Stand.  
Warum falsch: Die Antwort auf Befund 6 verschiebt diese Aktualisierung auf den Abschluss von V31; am geprüften Commit ist sie weiter offen. Der Verweis aus dem Abgleichdokument führt nicht zur nötigen Handlung.  
Vorschlag: Die Umstellung jetzt als offenen Punkt eintragen und README sowie Arbeitsstand vor der V31 Abschlussmeldung mit dem belegten Stand abgleichen.

## Empfehlungen

1. Für Standvorschläge in der Akte den vorgeschlagenen Wert und den aktuellen Punktstand nebeneinander zeigen. Dann ist die Entscheidung ohne Lesen des ganzen Verlaufstexts möglich.
2. Die Quellenfunktion mit zwei gleichzeitig schreibenden Läufen und einem unbekannten Vorhaben gezielt gegen das echte Backend prüfen. Der Code verwendet eine Zeilensperre; ihre Live Wirkung ist hier nicht belegt.
3. Im Technikstand den Lauf um 20:18 Uhr ausdrücklich als Prüfung des damaligen Auftragstexts kennzeichnen. Er belegt die späteren Korrekturen nicht.

Ich konnte weder Browserdarstellung und Bedienung noch Datenbankwirkung, Cowork Zeitplan, den behaupteten Lauf um 20:18 Uhr oder die XCeed Quellen selbst verifizieren. Die vorhandenen Bedienproben fangen die Edge Function ab; ihr Nachweis reicht nur für die Oberfläche. Es wurden keine Dateien geändert.